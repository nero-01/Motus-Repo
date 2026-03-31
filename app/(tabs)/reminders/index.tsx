import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ENV } from '../../../config/env';

type WeekEntry = { day: string; activity: string | null };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const OCR_MAX_WIDTH = 1200;
const OCR_QUALITY = 0.85;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

const emptyWeek = (): WeekEntry[] => DAYS.map((day) => ({ day, activity: null }));

function normalizeOcrText(text: string): string {
  return text.replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseWeekFromOcrText(fullText: string): WeekEntry[] {
  const week = emptyWeek();
  const text = normalizeOcrText(fullText).toLowerCase();
  const starts: { i: number; idx: number; tokenLen: number }[] = [];
  const patterns: Array<{ i: number; token: string }> = [
    { i: 0, token: 'monday' },
    { i: 1, token: 'tuesday' },
    { i: 2, token: 'wednesday' },
    { i: 3, token: 'thursday' },
    { i: 4, token: 'friday' },
    { i: 5, token: 'saturday' },
    { i: 6, token: 'sunday' },
    // common OCR variants
    { i: 1, token: 'tuesdav' },
    { i: 2, token: 'wednesdav' },
    { i: 2, token: 'wensday' },
    { i: 3, token: 'thursdav' },
    { i: 0, token: 'mondav' },
    { i: 4, token: 'frisay' },
    { i: 5, token: 'saturdav' },
    { i: 6, token: 'sundav' },
  ];

  for (const p of patterns) {
    let pos = 0;
    while (pos < text.length) {
      const idx = text.indexOf(p.token, pos);
      if (idx === -1) break;
      const before = idx === 0 ? '' : text[idx - 1];
      const beforeOk = idx === 0 || !/[a-z]/.test(before);
      if (beforeOk) {
        starts.push({ i: p.i, idx, tokenLen: p.token.length });
      }
      pos = idx + p.token.length;
    }
  }

  // keep earliest unique day match
  const byDay = new Map<number, { idx: number; tokenLen: number }>();
  for (const s of starts.sort((a, b) => a.idx - b.idx)) {
    if (!byDay.has(s.i)) byDay.set(s.i, { idx: s.idx, tokenLen: s.tokenLen });
  }

  const ordered = Array.from(byDay.entries())
    .map(([i, v]) => ({ i, ...v }))
    .sort((a, b) => a.idx - b.idx);

  for (let k = 0; k < ordered.length; k++) {
    const cur = ordered[k];
    const nextIdx = k + 1 < ordered.length ? ordered[k + 1].idx : text.length;
    const raw = text.slice(cur.idx + cur.tokenLen, nextIdx).replace(/^\s*[:\-–—.]\s*/, '').trim();
    week[cur.i] = { day: DAYS[cur.i], activity: raw ? raw : null };
  }

  return week;
}

function countFilled(week: WeekEntry[]): number {
  return week.filter((d) => d.activity?.trim()).length;
}

function friendlyVisionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const n = raw.toLowerCase();
  if (n.includes('network request failed')) {
    return 'Network request failed. Check your internet connection and that Cloud Vision API is enabled.';
  }
  if (n.includes('failed to fetch')) {
    return 'Could not reach Google Vision. Check your connection and API key restrictions.';
  }
  return translateVisionApiMessage(raw.replace(/^typeerror:\s*/i, '').trim() || 'Scan request failed.');
}

/** Maps Google Cloud Vision / API error text to actionable copy (billing, enablement, key, quota). */
function translateVisionApiMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('billing') || m.includes('billable')) {
    return 'Planner scan needs Google Cloud billing enabled on the project that owns this API key. In Google Cloud Console: open Billing, link a billing account, then retry.';
  }
  if (m.includes('has not been used') || m.includes('not been enabled') || m.includes('api has not been')) {
    return 'Enable the Cloud Vision API for your Google Cloud project (APIs & Services → Library), wait a few minutes, then retry.';
  }
  if (m.includes('not authorized to use this api') || m.includes('permission_denied') || m.includes('permission denied')) {
    return 'Vision API access was denied. Enable Cloud Vision API, confirm billing if required, and check that this API key is allowed to call Vision.';
  }
  if (m.includes('api key not valid') || m.includes('invalid api key') || m.includes('bad request') && m.includes('key')) {
    return 'The Vision API key is missing or invalid. Set EXPO_PUBLIC_GOOGLE_VISION_API_KEY and check key restrictions in Google Cloud.';
  }
  if (m.includes('quota') || m.includes('resource_exhausted') || m.includes('rate limit')) {
    return 'Vision API quota exceeded or rate limited. Check quotas in Google Cloud Console or try again later.';
  }
  if (m.includes('403') || m.includes('forbidden')) {
    return 'Vision API returned forbidden (403). Enable billing, enable Cloud Vision API, and verify API key restrictions.';
  }
  return message;
}

async function extractTextFromImage(base64Image: string): Promise<{ success: true; text: string } | { success: false; error: string }> {
  const apiKey = ENV.GOOGLE_VISION_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'Google Vision key missing. Set EXPO_PUBLIC_GOOGLE_VISION_API_KEY.' };
  }
  const base64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  try {
    const res = await fetch(`${VISION_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const raw = data?.error?.message || `HTTP ${res.status}`;
      return { success: false, error: translateVisionApiMessage(String(raw)) };
    }
    const responseError = data?.responses?.[0]?.error?.message;
    if (responseError) {
      return { success: false, error: translateVisionApiMessage(String(responseError)) };
    }
    const text = data?.responses?.[0]?.fullTextAnnotation?.text?.trim() ?? '';
    return { success: true, text };
  } catch (e) {
    return { success: false, error: friendlyVisionError(e) };
  }
}

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [weekActivities, setWeekActivities] = useState<WeekEntry[]>(emptyWeek());
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  // Set up notification handler
  useEffect(() => {
    // Configure how notifications are handled when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen for notifications when app is in foreground
    const notificationSub = Notifications.addNotificationReceivedListener((notification: any) => {
      if (__DEV__) console.log('Notification received in foreground:', notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      if (__DEV__) console.log('Notification response received:', response);
    });

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, []);

  const scheduleWeekReminders = async (week: WeekEntry[]) => {
    try {
      if (__DEV__) console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      if (__DEV__) console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in your settings.');
        return -1;
      }

      if (__DEV__) console.log('Scheduling notifications...');
      const now = new Date();
      let scheduledCount = 0;
      
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (let i = 0; i < week.length; i++) {
        const { day, activity } = week[i];
        if (!activity) continue;

        const activityDayJs = (i + 1) % 7; // Mon=1...Sat=6, Sun=0
        const notifyDayJs = (activityDayJs + 6) % 7; // day before
        let notificationDate = new Date(now);
        const daysUntil = (notifyDayJs + 7 - now.getDay()) % 7;
        notificationDate.setDate(now.getDate() + daysUntil);
        notificationDate.setHours(20, 0, 0, 0);

        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 7);
        }

        if (__DEV__) console.log(`Scheduling notification for ${day} (day before) at ${notificationDate.toLocaleString()}`);

        const secondsFromNow = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${day}`,
            body: activity,
            sound: true,
          },
          trigger: {
            seconds: secondsFromNow,
          } as any,
        });
        
        if (__DEV__) console.log(`Notification scheduled with ID: ${notificationId}`);
        scheduledCount++;
      }
      
      setRemindersEnabled(scheduledCount > 0);
      return scheduledCount;
    } catch (error) {
      if (__DEV__) console.error('Error scheduling notifications:', error);
      return -1;
    }
  };

  const handleEnableReminders = async () => {
    const scheduledCount = await scheduleWeekReminders(weekActivities);
    if (scheduledCount >= 0) {
      Alert.alert('Reminders enabled', `Successfully scheduled ${scheduledCount} reminders for the week.`);
    } else {
      Alert.alert('Error', 'Failed to schedule reminders. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in your settings.');
        return;
      }

      // Schedule a test notification for 5 seconds from now
      const testDate = new Date(Date.now() + 5000);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from MotusTots!',
          sound: true,
        },
        trigger: {
          seconds: 5,
        } as any,
      });
      
      if (__DEV__) console.log('Test notification scheduled with ID:', notificationId);
      Alert.alert('Test Notification', 'A test notification will appear in 5 seconds.');
    } catch (error) {
      if (__DEV__) console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      if (__DEV__) console.log('Currently scheduled notifications:', scheduled);
      Alert.alert('Scheduled Notifications', `Found ${scheduled.length} scheduled notifications. Check console for details.`);
    } catch (error) {
      if (__DEV__) console.error('Error checking scheduled notifications:', error);
      Alert.alert('Error', 'Failed to check scheduled notifications.');
    }
  };

  const resetRemindersState = () => {
    setRemindersEnabled(false);
    setWeekActivities(emptyWeek());
    Alert.alert('State Reset', 'Reminders state has been reset. You can now enable reminders again.');
  };

  const scanAndApplyReminders = async (uri: string) => {
    setScanning(true);
    try {
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: OCR_MAX_WIDTH } }],
        { compress: OCR_QUALITY, format: SaveFormat.JPEG, base64: true }
      );
      const base64 = manipulated.base64 ?? '';
      if (!base64) {
        Alert.alert('Scan failed', 'Could not prepare image for OCR. Try a clearer image.');
        return;
      }

      const vision = await extractTextFromImage(base64);
      if (!vision.success) {
        Alert.alert('Scan failed', vision.error);
        return;
      }

      const parsed = parseWeekFromOcrText(vision.text);
      const filled = countFilled(parsed);
      setWeekActivities(parsed);

      if (filled === 0) {
        Alert.alert('Done', 'No weekday activities were detected. Try a clearer planner image.');
        return;
      }

      const scheduledCount = await scheduleWeekReminders(parsed);
      if (scheduledCount < 0) {
        Alert.alert('Partial success', 'Planner was scanned but scheduling reminders failed. You can retry.');
      } else {
        Alert.alert('Planner scanned', `Detected ${filled} activities and scheduled ${scheduledCount} reminders.`);
      }
    } catch (error) {
      Alert.alert('Scan failed', friendlyVisionError(error));
    } finally {
      setScanning(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: OCR_QUALITY,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPlannerImage(uri);
      await scanAndApplyReminders(uri);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color="#006A60" />
            <Text style={styles.modalText}>Scanning planner image...</Text>
          </View>
        </View>
      </Modal>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Image
          source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
          style={{ width: 320, height: 430, resizeMode: 'contain', borderRadius: 12 }}
        />
        <TouchableOpacity
          style={{ marginTop: 10, backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
          onPress={handlePickImage}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
        </TouchableOpacity>
      </View>
      {/* Show list of reminders for the week */}
      <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>This Week's Reminders</Text>
        {weekActivities.map(({ day, activity }) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ fontWeight: '600', width: 90 }}>{day}:</Text>
            <Text style={{ color: activity ? '#222' : '#bbb', flex: 1, flexWrap: 'wrap' }} numberOfLines={3} ellipsizeMode="tail">{activity || 'No reminder'}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={{ marginTop: 12, alignSelf: 'flex-end', backgroundColor: '#006A60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
          onPress={() => router.push('/features/settings/reminders')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage Reminders</Text>
        </TouchableOpacity>
      </View>
      {/* Bottom buttons section */}
      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: remindersEnabled ? '#bdbdbd' : '#006A60',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 6,
            marginBottom: 10,
          }}
          onPress={handleEnableReminders}
          disabled={remindersEnabled}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
            {remindersEnabled ? 'Reminders Enabled' : 'Enable Reminders for the Week'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#FF9800', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
          onPress={handleTestNotification}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Test Notification (5s)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#9C27B0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
          onPress={checkScheduledNotifications}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Check Scheduled</Text>
        </TouchableOpacity>
        {remindersEnabled && (
          <TouchableOpacity
            style={{ backgroundColor: '#FF5722', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
            onPress={resetRemindersState}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Reset State</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalText: {
    marginTop: 10,
    fontWeight: '600',
    color: '#333',
  },
});