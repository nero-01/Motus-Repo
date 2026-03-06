import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, TextInput, Platform, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import { extractTextFromImage } from '../../../services/googleVision';

const OCR_MAX_WIDTH = 1200;
const OCR_JPEG_QUALITY = 0.85;

const REMINDERS_CHANNEL_ID = 'motustots-reminders';
const REMINDERS_STORAGE_KEY_WEEK = 'motustots_reminders_week';
const REMINDERS_STORAGE_KEY_ENABLED = 'motustots_reminders_enabled';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyWeek = (): { day: string; activity: string | null }[] =>
  DAYS.map(day => ({ day, activity: null }));

const DAY_PATTERNS: { full: string; shorts: string[] }[] = [
  { full: 'monday', shorts: ['mon', 'mondav'] },
  { full: 'tuesday', shorts: ['tue', 'tues', 'tuesdav'] },
  { full: 'wednesday', shorts: ['wed', 'weds', 'wednesdav', 'wensday'] },
  { full: 'thursday', shorts: ['thu', 'thur', 'thurs', 'thursdav'] },
  { full: 'friday', shorts: ['fri', 'frisay'] },
  { full: 'saturday', shorts: ['sat', 'saturdav'] },
  { full: 'sunday', shorts: ['sun', 'sundav'] },
];

type DayMatch = { dayIndex: number; start: number; end: number };

/** Normalize OCR output so parsing is consistent regardless of line breaks/spaces. */
function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fix common OCR misreads of day names (whole-word, case-insensitive). */
function fixOcrDayTypos(text: string): string {
  const lower = text.toLowerCase();
  const replacements: [string, string][] = [
    ['tuesdav', 'tuesday'], ['wednesdav', 'wednesday'], ['wensday', 'wednesday'],
    ['thursdav', 'thursday'], ['mondav', 'monday'], ['frisay', 'friday'],
    ['saturdav', 'saturday'], ['sundav', 'sunday'],
    ['tuesda y', 'tuesday'], ['wednesda y', 'wednesday'], ['thursda y', 'thursday'],
    ['monda y', 'monday'], ['frida y', 'friday'], ['saturda y', 'saturday'], ['sunda y', 'sunday'],
  ];
  let out = lower;
  for (const [wrong, right] of replacements) {
    const re = new RegExp('\\b' + wrong.replace(/\s/g, '\\s*') + '\\b', 'gi');
    out = out.replace(re, right);
  }
  return out;
}

/** All day name patterns (longest first) for regex. */
const DAY_REGEX_SOURCES = DAY_PATTERNS.flatMap(({ full, shorts }) =>
  [full, ...shorts].sort((a, b) => b.length - a.length)
);
const DAY_REGEX = new RegExp(
  '\\b(' + DAY_REGEX_SOURCES.join('|') + ')\\b',
  'gi'
);

/**
 * Find all day names in text using a single regex pass (whole words only).
 * Returns one match per day (earliest occurrence), sorted by position.
 */
function findAllDayMatches(text: string): DayMatch[] {
  const lower = text.toLowerCase();
  const byDay = new Map<number, DayMatch>();
  let match: RegExpExecArray | null;
  const re = new RegExp(DAY_REGEX.source, 'gi');
  while ((match = re.exec(lower)) !== null) {
    const pat = match[1].toLowerCase();
    const dayIndex = DAY_PATTERNS.findIndex(
      ({ full, shorts }) => full === pat || shorts.includes(pat)
    );
    if (dayIndex === -1) continue;
    const start = match.index;
    const end = start + pat.length;
    const existing = byDay.get(dayIndex);
    const keep =
      !existing ||
      start < existing.start ||
      (start === existing.start && end - start > existing.end - existing.start);
    if (keep) byDay.set(dayIndex, { dayIndex, start, end });
  }
  return Array.from(byDay.values()).sort((a, b) => a.start - b.start);
}

/**
 * Also find day names without requiring word boundary after (OCR often concatenates "MondayKarate").
 * Merge with regex results so we catch days that appear right before another word.
 */
function findAllDayMatchesNoBoundaryAfter(text: string): DayMatch[] {
  const lower = text.toLowerCase();
  const matches: DayMatch[] = [];
  for (let i = 0; i < DAY_PATTERNS.length; i++) {
    const { full, shorts } = DAY_PATTERNS[i];
    const patterns = [full, ...shorts].sort((a, b) => b.length - a.length);
    for (const pat of patterns) {
      let pos = 0;
      while (pos < lower.length) {
        const idx = lower.indexOf(pat, pos);
        if (idx === -1) break;
        const before = idx === 0 ? '' : lower[idx - 1];
        const beforeOk = idx === 0 || !/[a-zA-Z]/.test(before);
        if (beforeOk) {
          const overlap = matches.find(
            (m) => m.dayIndex === i && m.start <= idx && idx < m.end
          );
          if (!overlap) {
            matches.push({ dayIndex: i, start: idx, end: idx + pat.length });
          }
          pos = idx + pat.length;
        } else {
          pos = idx + 1;
        }
      }
    }
  }
  matches.sort((a, b) => a.start - b.start);
  const byDay = new Map<number, DayMatch>();
  for (const m of matches) {
    const existing = byDay.get(m.dayIndex);
    const keep =
      !existing ||
      m.start < existing.start ||
      (m.start === existing.start && m.end - m.start > existing.end - existing.start);
    if (keep) byDay.set(m.dayIndex, m);
  }
  return Array.from(byDay.values()).sort((a, b) => a.start - b.start);
}

/** Find which day (if any) the line starts with; return dayIndex and length of match. */
function matchDayAtLineStart(line: string): { dayIndex: number; len: number } | null {
  const trimmed = line.trimStart();
  const lower = trimmed.toLowerCase();
  let best: { dayIndex: number; len: number } | null = null;
  for (let i = 0; i < DAY_PATTERNS.length; i++) {
    const { full, shorts } = DAY_PATTERNS[i];
    const patterns = [full, ...shorts].sort((a, b) => b.length - a.length);
    for (const pat of patterns) {
      if (lower === pat || lower.startsWith(pat + ' ') || lower.startsWith(pat + '\t') ||
          lower.startsWith(pat + ':') || lower.startsWith(pat + '-') || lower.startsWith(pat + '–') || lower.startsWith(pat + '—')) {
        const len = trimmed.substring(0, pat.length).length;
        if (!best || len > best.len) best = { dayIndex: i, len };
        break;
      }
    }
  }
  return best;
}

/** Merge two sorted day-match arrays: union by day index, keep earliest position per day. */
function mergeDayMatches(a: DayMatch[], b: DayMatch[]): DayMatch[] {
  const byDay = new Map<number, DayMatch>();
  for (const m of [...a, ...b]) {
    const existing = byDay.get(m.dayIndex);
    const keep =
      !existing ||
      m.start < existing.start ||
      (m.start === existing.start && m.end - m.start > existing.end - existing.start);
    if (keep) byDay.set(m.dayIndex, m);
  }
  return Array.from(byDay.values()).sort((x, y) => x.start - y.start);
}

function extractWeekFromBlockText(
  text: string,
  isDayNameOnly: (s: string) => boolean
): { week: { day: string; activity: string | null }[]; matchedIndices: Set<number> } {
  const week = emptyWeek();
  const matchedIndices = new Set<number>();
  const regexMatches = findAllDayMatches(text);
  const noBoundaryMatches = findAllDayMatchesNoBoundaryAfter(text);
  const matches = mergeDayMatches(regexMatches, noBoundaryMatches);
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    matchedIndices.add(m.dayIndex);
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const raw = text
      .slice(m.end, nextStart)
      .replace(/^\s*[:\-–—.]\s*/, '')
      .trim();
    const activity = raw && !isDayNameOnly(raw) ? raw : null;
    week[m.dayIndex] = { day: DAYS[m.dayIndex], activity };
  }
  return { week, matchedIndices };
}

function parseWeekFromOcrText(fullText: string): { day: string; activity: string | null }[] {
  const week = emptyWeek();
  const withNewlines = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const normalized = normalizeOcrText(fullText);
  const corrected = fixOcrDayTypos(normalized);

  const isDayNameOnly = (s: string) => {
    const low = s.toLowerCase().trim();
    if (!low) return false;
    for (const { full, shorts } of DAY_PATTERNS) {
      if (low === full || shorts.some(sh => low === sh)) return true;
    }
    return false;
  };

  // Pass 1a: block-based on normalized text
  const { week: week1, matchedIndices: idx1 } = extractWeekFromBlockText(normalized, isDayNameOnly);
  // Pass 1b: block-based on typo-corrected text (catches "Tuesdav", "Wensday", etc.)
  const { week: week2, matchedIndices: idx2 } = extractWeekFromBlockText(corrected, isDayNameOnly);
  // Merge: keep every day found in either pass, prefer non-empty activity and longer when both have one
  const allMatched = new Set([...idx1, ...idx2]);
  for (const i of allMatched) {
    const a1 = week1[i].activity?.trim();
    const a2 = week2[i].activity?.trim();
    if (a1 && a2) {
      week[i] = { day: DAYS[i], activity: a1.length >= a2.length ? a1 : a2 };
    } else if (a1) {
      week[i] = { day: DAYS[i], activity: a1 };
    } else if (a2) {
      week[i] = { day: DAYS[i], activity: a2 };
    } else {
      week[i] = { day: DAYS[i], activity: null };
    }
  }

  // Pass 2: line-based on original lines (fill gaps)
  const lines = withNewlines.split('\n');
  for (const line of lines) {
    const hit = matchDayAtLineStart(line);
    if (!hit || week[hit.dayIndex].activity) continue;
    const trimmed = line.trimStart();
    const rest = trimmed.slice(hit.len).replace(/^\s*[:\-–—]\s*/, '').trim();
    const activity = rest.replace(/\s+/g, ' ').trim() || null;
    if (activity && !isDayNameOnly(activity)) {
      week[hit.dayIndex] = { day: DAYS[hit.dayIndex], activity };
    }
  }
  return week;
}

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [week, setWeek] = useState(emptyWeek());
  const [readingImage, setReadingImage] = useState(false);
  const [visionModalVisible, setVisionModalVisible] = useState(false);
  const hasLoadedFromStorageRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const id = setTimeout(() => {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        const sub1 = Notifications.addNotificationReceivedListener(() => {});
        const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});
        cleanup = () => {
          try {
            sub1.remove();
            sub2.remove();
          } catch (_) {}
        };
      } catch (_) {
        // Native module may not be ready (Expo Go first load)
      }
    }, 400);
    return () => {
      clearTimeout(id);
      cleanup?.();
    };
  }, []);

  // Load baked-in reminders from storage only; do not refresh from notifications on reload
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedWeek, storedEnabled] = await Promise.all([
          AsyncStorage.getItem(REMINDERS_STORAGE_KEY_WEEK),
          AsyncStorage.getItem(REMINDERS_STORAGE_KEY_ENABLED),
        ]);
        if (!mounted) return;
        if (storedWeek) {
          try {
            const parsed = JSON.parse(storedWeek) as { day: string; activity: string | null }[];
            if (Array.isArray(parsed) && parsed.length === DAYS.length) {
              setWeek(parsed);
            }
          } catch (_) {}
        }
        if (storedEnabled === 'true') {
          setRemindersEnabled(true);
        }
      } catch (_) {}
      if (mounted) hasLoadedFromStorageRef.current = true;
    })();
    return () => { mounted = false; };
  }, []);

  // Persist reminders when they change (stay baked in across reloads)
  useEffect(() => {
    if (!hasLoadedFromStorageRef.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(REMINDERS_STORAGE_KEY_WEEK, JSON.stringify(week));
        await AsyncStorage.setItem(REMINDERS_STORAGE_KEY_ENABLED, remindersEnabled ? 'true' : 'false');
      } catch (_) {}
    })();
  }, [week, remindersEnabled]);

  const ensurePermission = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
        name: 'MotusTots Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const { canAskAgain } = await Notifications.getPermissionsAsync();
    if (!canAskAgain) {
      Alert.alert('Notifications disabled', 'Enable them in Settings to receive reminders.');
      return false;
    }
    const { status: s } = await Notifications.requestPermissionsAsync();
    if (s !== 'granted') {
      Alert.alert('Permission required', 'Notifications were not enabled.');
      return false;
    }
    return true;
  };

  /** Resize/compress image, then run Google Vision OCR and build reminders. */
  const startVisionFromUri = async (uri: string) => {
    setReadingImage(true);
    setVisionModalVisible(true);
    try {
      let base64: string;
      try {
        const result = await manipulateAsync(
          uri,
          [{ resize: { width: OCR_MAX_WIDTH } }],
          { compress: OCR_JPEG_QUALITY, format: SaveFormat.JPEG, base64: true }
        );
        base64 = result.base64 ?? '';
        if (!base64) throw new Error('No base64');
      } catch {
        base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      }

      const visionResult = await extractTextFromImage(base64);

      if (!visionResult.success) {
        setVisionModalVisible(false);
        setReadingImage(false);
        Alert.alert('Scan failed', visionResult.error);
        return;
      }

      const parsed = parseWeekFromOcrText(visionResult.text);
      const filled = parsed.filter((e) => e.activity?.trim()).length;
      setWeek(parsed);
      setVisionModalVisible(false);
      setReadingImage(false);

      if (filled > 0) {
        await enableReminders(parsed);
      } else {
        Alert.alert('Done', 'No day names found. Try a clearer image or check that the Vision API key is set.');
      }
    } catch (e) {
      setVisionModalVisible(false);
      setReadingImage(false);
      Alert.alert('Could not read image', e instanceof Error ? e.message : 'Try choosing the image again.');
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]) {
      const uri = res.assets[0].uri;
      setPlannerImage(uri);
      await Notifications.cancelAllScheduledNotificationsAsync();
      setRemindersEnabled(false);
      setWeek(emptyWeek());
      await startVisionFromUri(uri);
    }
  };

  const readFromImage = async () => {
    if (!plannerImage) {
      Alert.alert('No image', 'Upload a weekly planner image first.');
      return;
    }
    await startVisionFromUri(plannerImage);
  };

  const clearReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    setWeek(emptyWeek());
    Alert.alert('Cleared', 'Reminders cleared. Tap Read from image or Enable when ready.');
  };

  const enableReminders = async (weekOverride?: { day: string; activity: string | null }[]) => {
    const w = weekOverride ?? week;
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let count = 0;

    for (let i = 0; i < w.length; i++) {
      const a = w[i].activity?.trim();
      if (!a) continue;

      const prevDayGetDay = i;
      let daysUntil = (prevDayGetDay - now.getDay() + 7) % 7;
      const at = new Date(now);
      at.setDate(now.getDate() + daysUntil);
      at.setHours(9, 0, 0, 0);
      if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 7);

      const sec = Math.max(1, Math.floor((at.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${w[i].day}`,
          body: a,
          sound: true,
          ...(Platform.OS === 'android' && { channelId: REMINDERS_CHANNEL_ID }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: sec,
          ...(Platform.OS === 'android' && { channelId: REMINDERS_CHANNEL_ID }),
        },
      });
      count++;
    }

    setRemindersEnabled(true);
    if (weekOverride) setWeek(weekOverride);
    Alert.alert('Enabled', `Scheduled ${count} reminder(s) for the week.`);
  };

  const testNotification = async () => {
    if (!(await ensurePermission())) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test',
        body: 'Test from MotusTots',
        sound: true,
        ...(Platform.OS === 'android' && { channelId: REMINDERS_CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(Platform.OS === 'android' && { channelId: REMINDERS_CHANNEL_ID }),
      },
    });
    Alert.alert('Test', 'Notification in 5 seconds.');
  };

  const setActivity = (i: number, v: string) => {
    setWeek(prev => {
      const n = [...prev];
      n[i] = { ...n[i], activity: v || null };
      return n;
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Image
          source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
          contentFit="contain"
          style={{ width: 320, height: 430, borderRadius: 12 }}
          onError={() => setPlannerImage(null)}
        />
        <TouchableOpacity
          onPress={pickImage}
          style={{ marginTop: 10, backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
        </TouchableOpacity>
        {plannerImage && (
          <TouchableOpacity
            onPress={readFromImage}
            disabled={readingImage}
            style={{ marginTop: 10, backgroundColor: readingImage ? '#9e9e9e' : '#006A60', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{readingImage ? 'Reading…' : 'Read from image'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>This Week&apos;s Reminders</Text>
        {week.map(({ day, activity }, i) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '600', width: 90 }}>{day}</Text>
            <TextInput
              value={activity ?? ''}
              onChangeText={v => setActivity(i, v)}
              placeholder="e.g. Karate, Speech & Drama"
              placeholderTextColor="#999"
              style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 }}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <TouchableOpacity onPress={clearReminders} style={{ backgroundColor: '#757575', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Clear reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/features/settings/reminders')} style={{ backgroundColor: '#006A60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => enableReminders()}
          disabled={remindersEnabled}
          style={{ backgroundColor: remindersEnabled ? '#bdbdbd' : '#006A60', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6, marginBottom: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
            {remindersEnabled ? 'Reminders Enabled' : 'Enable Reminders for the Week'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={testNotification} style={{ backgroundColor: '#FF9800', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Test Notification (5s)</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visionModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', padding: 24, alignItems: 'center', minHeight: 120 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Scanning image…</Text>
            <ActivityIndicator size="large" color="#006A60" />
            <Text style={{ fontSize: 14, color: '#666', marginTop: 12 }}>Google Vision</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
