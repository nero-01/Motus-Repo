/**
 * MotusTots OCR Reminder Service
 *
 * Uses OCR.space to read printed weekly planner sheets, then parses
 * day/activity pairs for reminder scheduling.
 */

import { Platform } from 'react-native';
import { ENV } from '../../config/env';
import { extractTextFromImage } from '../ocr';
import type { ParsedActivity } from './pushNotificationService';

export interface OcrResult {
  success: boolean;
  activities: ParsedActivity[];
  rawText?: string;
  error?: string;
  confidence?: number;
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES = Object.keys(DAY_MAP);
const DAY_REGEX = new RegExp(`\\b(${DAY_NAMES.join('|')})\\b`, 'i');

/**
 * Extract activities from a planner image using OCR.space.
 */
export async function extractActivitiesFromImage(
  imageUri: string,
  imageBase64?: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OcrResult> {
  if (!ENV.OCR_SPACE_API_KEY && !process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY) {
    return {
      success: false,
      activities: [],
      error: 'Missing EXPO_PUBLIC_OCR_SPACE_API_KEY. Get a free key at https://ocr.space/ocrapi',
    };
  }

  try {
    const base64Data = imageBase64 || (await uriToBase64(imageUri));
    if (!base64Data) {
      return { success: false, activities: [], error: 'Could not read image data.' };
    }

    const resolvedMime = inferMimeType(imageUri, mimeType);
    const ocr = await extractTextFromImage(base64Data, resolvedMime);
    const activities = parseActivitiesFromOcrText(ocr.text);

    if (activities.length === 0) {
      return {
        success: false,
        activities: [],
        rawText: ocr.text,
        confidence: ocr.confidence,
        error: 'No activities found in the planner image. Try a clearer photo or check the sheet layout.',
      };
    }

    return {
      success: true,
      activities,
      rawText: ocr.text,
      confidence: ocr.confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OCR error';
    console.error('[OCR] extraction failed:', error);
    return { success: false, activities: [], error: message };
  }
}

/** @deprecated Use extractActivitiesFromImage */
export async function extractActivitiesFromPlannerImage(imageUri: string): Promise<ParsedActivity[]> {
  const result = await extractActivitiesFromImage(imageUri);
  if (!result.success) {
    throw new Error(result.error ?? 'OCR failed');
  }
  return result.activities;
}

/** Map parsed OCR rows into a full Mon–Sun list for the reminders UI. */
export function parsedActivitiesToWeekDisplay(
  activities: ParsedActivity[]
): Array<{ day: string; activity: string | null; time?: string | null }> {
  const byDay = new Map(activities.map((item) => [item.day.trim().toLowerCase(), item]));

  return WEEKDAYS.map((day) => {
    const match = byDay.get(day.toLowerCase());
    return {
      day,
      activity: match?.activity ?? null,
      time: match?.time ?? null,
    };
  });
}

export function parseActivitiesFromOcrText(rawText: string): ParsedActivity[] {
  const activities: ParsedActivity[] = [];
  const seenDays = new Set<string>();

  const addActivity = (day: string, activity: string) => {
    const key = day.toLowerCase();
    if (!activity || seenDays.has(key)) {
      return;
    }
    seenDays.add(key);
    activities.push({
      day: capitalise(day),
      dayIndex: DAY_MAP[key] ?? 1,
      activity,
      ...(extractTime(activity) ? { time: extractTime(activity)! } : {}),
    });
  };

  // Strategy 1: "Monday: Karate" / "Monday - Library" on one line
  const inlinePattern = new RegExp(
    `\\b(${DAY_NAMES.join('|')})\\b\\s*[:\\-–—|]?\\s*([^\\n]+)`,
    'gi'
  );
  let match: RegExpExecArray | null;
  while ((match = inlinePattern.exec(rawText)) !== null) {
    addActivity(match[1], cleanActivityText(match[2]));
  }
  if (activities.length > 0) {
    return sortByDayIndex(activities);
  }

  // Strategy 2: day on its own line, activity on the next line(s)
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const dayMatch = lines[index].match(DAY_REGEX);
    if (!dayMatch) {
      continue;
    }

    const day = dayMatch[1];
    const sameLineActivity = lines[index].slice(dayMatch.index! + dayMatch[0].length).trim();
    const cleanedSameLine = cleanActivityText(sameLineActivity.replace(/^[\s:.\-|–—]+/, ''));

    if (cleanedSameLine) {
      addActivity(day, cleanedSameLine);
      continue;
    }

    const nextLine = lines[index + 1];
    if (nextLine && !DAY_REGEX.test(nextLine)) {
      addActivity(day, cleanActivityText(nextLine));
      index += 1;
    }
  }

  if (activities.length > 0) {
    return sortByDayIndex(activities);
  }

  // Strategy 3: table row with multiple day columns (Mon | Tue | ...)
  return parseTableLayout(lines);
}

function parseTableLayout(lines: string[]): ParsedActivity[] {
  const activities: ParsedActivity[] = [];
  const headerIndex = lines.findIndex((line) => {
    const hits = DAY_NAMES.filter((day) => new RegExp(`\\b${day}\\b`, 'i').test(line));
    return hits.length >= 3;
  });

  if (headerIndex === -1) {
    return activities;
  }

  const headerLine = lines[headerIndex];
  const dayColumns: Array<{ day: string; start: number; end: number }> = [];

  for (const day of DAY_NAMES) {
    const regex = new RegExp(`\\b${day}\\b`, 'i');
    const dayMatch = regex.exec(headerLine);
    if (dayMatch) {
      dayColumns.push({
        day: capitalise(dayMatch[0]),
        start: dayMatch.index,
        end: headerLine.length,
      });
    }
  }

  dayColumns.sort((a, b) => a.start - b.start);
  for (let index = 0; index < dayColumns.length; index += 1) {
    dayColumns[index].end = dayColumns[index + 1]?.start ?? headerLine.length;
  }

  for (let rowIndex = headerIndex + 1; rowIndex < lines.length; rowIndex += 1) {
    const row = lines[rowIndex];
    if (DAY_REGEX.test(row) && row.split(/\s{2,}|\t|\|/).length >= 3) {
      continue;
    }

    for (const column of dayColumns) {
      const cell = cleanActivityText(row.slice(column.start, column.end));
      if (cell && cell.length > 1) {
        const existing = activities.find((item) => item.day === column.day);
        if (existing) {
          existing.activity = `${existing.activity}; ${cell}`;
        } else {
          activities.push({
            day: column.day,
            dayIndex: DAY_MAP[column.day.toLowerCase()] ?? 1,
            activity: cell,
            ...(extractTime(cell) ? { time: extractTime(cell)! } : {}),
          });
        }
      }
    }
  }

  return sortByDayIndex(activities);
}

function cleanActivityText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s:.\-|–—]+|[\s:.\-|–—]+$/g, '')
    .trim();
}

function extractTime(value: string): string | undefined {
  const match = value.match(/\b(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)\b/i);
  if (!match) {
    return undefined;
  }
  return match[1].replace('.', ':');
}

function sortByDayIndex(activities: ParsedActivity[]): ParsedActivity[] {
  return [...activities].sort((a, b) => a.dayIndex - b.dayIndex);
}

async function uriToBase64(uri: string): Promise<string | null> {
  if (uri.startsWith('data:')) {
    return uri.split(',')[1] || null;
  }

  if (typeof window !== 'undefined' && (uri.startsWith('blob:') || uri.startsWith('http'))) {
    try {
      const blob = await fetch(uri).then((r) => r.blob());
      return await blobToBase64(blob);
    } catch {
      return null;
    }
  }

  if (Platform.OS === 'web') {
    try {
      const blob = await fetch(uri).then((r) => r.blob());
      return await blobToBase64(blob);
    } catch {
      return null;
    }
  }

  try {
    const FileSystem = await import('expo-file-system/legacy');
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function inferMimeType(
  uri: string,
  fallback: 'image/jpeg' | 'image/png' | 'image/webp'
): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.includes('.png') || lower.startsWith('data:image/png')) {
    return 'image/png';
  }
  if (lower.includes('.webp') || lower.startsWith('data:image/webp')) {
    return 'image/webp';
  }
  return fallback;
}

function capitalise(str: string): string {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
