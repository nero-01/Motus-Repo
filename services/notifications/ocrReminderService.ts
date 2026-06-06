/**
 * MotusTots OCR Reminder Service
 *
 * Uses the Claude Vision API (via Anthropic) to extract structured activity
 * data from a photo of a weekly school planner, then auto-creates reminders.
 *
 * Flow:
 *   1. Parent takes/uploads a photo of the printed weekly planner sheet.
 *   2. Image is sent to Claude with a structured extraction prompt.
 *   3. Claude returns JSON with day/activity pairs.
 *   4. Caller passes the result to scheduleWeeklyReminders().
 */

import { Platform } from 'react-native';
import { ENV } from '../../config/env';
import type { ParsedActivity } from './pushNotificationService';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export interface OcrResult {
  success: boolean;
  activities: ParsedActivity[];
  rawText?: string;
  error?: string;
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

/**
 * Extract activities from a planner image using Claude Vision OCR.
 */
export async function extractActivitiesFromImage(
  imageUri: string,
  imageBase64?: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OcrResult> {
  const apiKey = ENV.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
  if (!apiKey) {
    return {
      success: false,
      activities: [],
      error: 'Missing EXPO_PUBLIC_ANTHROPIC_KEY. Add it to .env for planner OCR.',
    };
  }

  try {
    const base64Data = imageBase64 || (await uriToBase64(imageUri));
    if (!base64Data) {
      return { success: false, activities: [], error: 'Could not read image data.' };
    }

    const resolvedMime = inferMimeType(imageUri, mimeType);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: `You are an OCR assistant specialized in reading printed school / nursery weekly planner sheets.
Your job is to extract activities for each day of the week and return ONLY valid JSON.

Output format — an array of objects, one per weekday that has content:
[
  { "day": "Monday", "activity": "...", "time": "HH:MM or null" },
  ...
]

Rules:
- Include ONLY days that have a non-empty activity.
- If no specific time is mentioned, set "time" to null.
- Preserve the exact wording of the activity.
- Do NOT include any text outside the JSON array.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: resolvedMime,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: 'Please extract all the activities from this weekly planner sheet. Return only the JSON array.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return { success: false, activities: [], error: `API error: ${response.status}` };
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const rawText = data.content?.[0]?.text ?? '';
    const activities = parseActivitiesJson(rawText);

    if (activities.length === 0) {
      return {
        success: false,
        activities: [],
        rawText,
        error: 'No activities found in the planner image.',
      };
    }

    return { success: true, activities, rawText };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('OCR extraction failed:', error);
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

function parseActivitiesJson(rawText: string): ParsedActivity[] {
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed: Array<{ day: string; activity: string; time?: string | null }> = JSON.parse(clean);

    return parsed
      .filter((item) => item.day && item.activity)
      .map((item) => {
        const dayKey = item.day.toLowerCase().trim();
        const dayIndex = DAY_MAP[dayKey] ?? 1;
        const time = item.time && item.time !== 'null' ? String(item.time).trim() : undefined;
        return {
          day: capitalise(item.day.trim()),
          dayIndex,
          activity: item.activity.trim(),
          ...(time ? { time } : {}),
        };
      });
  } catch (error) {
    console.error('Failed to parse OCR JSON:', error, '\nRaw:', rawText);
    return [];
  }
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
