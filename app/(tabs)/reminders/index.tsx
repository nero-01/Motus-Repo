import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { readAsStringAsync } from 'expo-file-system/legacy';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import * as ImagePicker from 'expo-image-picker';
import { ENV } from '../../../config/env';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyWeek = () => DAYS.map(day => ({ day, activity: null as string | null }));

type WeekActivity = { day: string; activity: string | null };

function parseWeekActivitiesFromOcrText(fullText: string): WeekActivity[] {
  const normalized = (fullText || '').replace(/\r\n/g, '\n');
  const result: WeekActivity[] = DAYS.map(day => ({ day, activity: null }));

  for (let i = 0; i < DAYS.length; i++) {
    const dayName = DAYS[i];
    const re = new RegExp(dayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const match = re.exec(normalized);
    if (!match) continue;

    const start = match.index + match[0].length;
    let end = normalized.length;
    for (let j = i + 1; j < DAYS.length; j++) {
      const r2 = new RegExp(DAYS[j].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      r2.lastIndex = start;
      const m2 = r2.exec(normalized);
      if (m2) {
        end = m2.index;
        break;
      }
    }
    const raw = normalized.slice(start, end);
    const activity = raw.replace(/\s+/g, ' ').trim();
    if (activity) result[i].activity = activity;
  }
  return result;
}

async function runOcrOnImage(uri: string, apiKey: string): Promise<string | null> {
  const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { responses?: { fullTextAnnotation?: { text?: string }; error?: unknown }[] };
  const r = json.responses?.[0];
  if (r?.error) return null;
  return r?.fullTextAnnotation?.text ?? null;
}

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [weekActivities, setWeekActivities] = useState<WeekActivity[]>(() => [
    { day: 'Monday', activity: null },
    { day: 'Tuesday', activity: 'Bring along a poster / object relating to the theme. Karate' },
    { day: 'Wednesday', activity: 'Speech & Drama' },
    { day: 'Thursday', activity: null },
    { day: 'Friday', activity: null },
    { day: 'Saturday', activity: null },
    { day: 'Sunday', activity: null },
  ]);
  const [parsingInProgress, setParsingInProgress] = useState(false);
  const router = useRouter();

  const updateActivity = (index: number, activity: string | null) => {
    setWeekActivities(prev => {
      const next = [...prev];
      next[index] = { ...next[index], activity: activity || null };
      return next;
    });
  };

  const clearReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    setWeekActivities(emptyWeek());
    Alert.alert('Reminders cleared', 'The list is cleared. Upload a planner to auto-fill, or type reminders below.');
  };

  // Set up notification handler
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const sub1 = Notifications.addNotificationReceivedListener(() => {});
    const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const ensureNotificationPermission = async () => {
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.status === 'granted') return true;

      if (!existing.canAskAgain) {
        Alert.alert('Notifications disabled', 'Notifications are turned off for MotusTots. You can enable them in your device Settings if you want to receive reminders.');
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notifications were not enabled. You can update this later from Settings.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      Alert.alert('Error', 'Unable to check notification permissions right now.');
      return false;
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    setPlannerImage(uri);
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);

    const apiKey = ENV.GOOGLE_VISION_API_KEY?.trim();

    if (apiKey) {
      setParsingInProgress(true);
      try {
        const text = await runOcrOnImage(uri, apiKey);
        if (text) {
          const parsed = parseWeekActivitiesFromOcrText(text);
          setWeekActivities(parsed);
          const hasAny = parsed.some(p => p.activity && p.activity.trim().length > 0);
          Alert.alert(hasAny ? 'Reminders filled' : 'No activities found', hasAny ? 'Reminders were auto-filled from your planner. You can edit below, then tap Enable Reminders.' : 'No day-by-day activities were found in the image. You can type them in below.');
        } else {
          Alert.alert('Couldn\'t read image', 'The image couldn\'t be read. You can type reminders below.');
        }
      } catch (e) {
        console.warn('OCR failed', e);
        Alert.alert('Couldn\'t read image', 'Something went wrong reading the image. You can type reminders below.');
      } finally {
        setParsingInProgress(false);
      }
    } else {
      Alert.alert('Auto-fill not set up', 'Set EXPO_PUBLIC_GOOGLE_VISION_API_KEY to auto-fill reminders from your planner. You can type them below.');
    }
  };

  const handleEnableReminders = async () => {
    try {
      const hasPermission = await ensureNotificationPermission();
      if (!hasPermission) return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();
      let scheduledCount = 0;

      for (let i = 0; i < weekActivities.length; i++) {
        const { day, activity } = weekActivities[i];
        if (!activity || !activity.trim()) continue;

        const dayOfWeek = i + 1;
        let notificationDate = new Date(now);
        let dayBefore = dayOfWeek - 1;
        if (dayBefore === 0) dayBefore = 7;
        notificationDate.setDate(now.getDate() + ((dayBefore + 7 - now.getDay()) % 7));
        notificationDate.setHours(20, 0, 0, 0);

        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 7);
        }

        const secondsFromNow = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));

        await Notifications.scheduleNotificationAsync({
          content: { title: `Reminder: ${day}`, body: activity.trim(), sound: true },
          trigger: { seconds: secondsFromNow } as any,
        });

        scheduledCount++;
      }

      setRemindersEnabled(true);
      Alert.alert('Reminders enabled', `Scheduled ${scheduledCount} reminder(s) for the week.`);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      const hasPermission = await ensureNotificationPermission();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Test Notification', body: 'This is a test notification from MotusTots!', sound: true },
        trigger: { seconds: 5 } as any,
      });

      Alert.alert('Test Notification', 'A test notification will appear in 5 seconds.');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      Alert.alert('Scheduled Notifications', `Found ${scheduled.length} scheduled notifications.`);
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      Alert.alert('Error', 'Failed to check scheduled notifications.');
    }
  };

  const resetRemindersState = () => {
    setRemindersEnabled(false);
    Notifications.cancelAllScheduledNotificationsAsync()
      .then(() => Alert.alert('Reminders cleared', 'All scheduled reminders have been cancelled. You can enable them again at any time.'))
      .catch((error) => {
        console.error('Error cancelling notifications:', error);
        Alert.alert('Error', 'Failed to clear scheduled reminders.');
      });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Image
          source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
          style={{ width: 320, height: 430, resizeMode: 'contain', borderRadius: 12 }}
        />
        {parsingInProgress && (
          <View style={{ position: 'absolute', top: 180, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8 }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8, fontWeight: '600' }}>Reading planner…</Text>
          </View>
        )}
        <TouchableOpacity
          style={{ marginTop: 10, backgroundColor: parsingInProgress ? '#9e9e9e' : '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
          onPress={handlePickImage}
          disabled={parsingInProgress}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>This Week&apos;s Reminders</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>Upload a planner to auto-fill, or type below. Use Clear reminders to start over.</Text>
        {weekActivities.map(({ day, activity }, idx) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '600', width: 90 }}>{day}:</Text>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 }}
              placeholder="e.g. Karate, Speech & Drama"
              placeholderTextColor="#999"
              value={activity ?? ''}
              onChangeText={t => updateActivity(idx, t)}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#757575', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
            onPress={clearReminders}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Clear reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#006A60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
            onPress={() => router.push('/features/settings/reminders')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage Reminders</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          style={{ backgroundColor: remindersEnabled ? '#bdbdbd' : '#006A60', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6, marginBottom: 10 }}
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
