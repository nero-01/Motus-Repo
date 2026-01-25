import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import { ENV } from '../../../config/env';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyWeek = (): { day: string; activity: string | null }[] =>
  DAYS.map(day => ({ day, activity: null }));

function parseWeekFromOcrText(text: string): (string | null)[] {
  if (!text?.trim()) return [null, null, null, null, null, null, null];
  const t = `\n${text.replace(/\r\n/g, '\n').toLowerCase()}\n`;
  const names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const out: (string | null)[] = [];
  for (let i = 0; i < names.length; i++) {
    const start = t.indexOf(`\n${names[i]}`);
    if (start === -1) { out.push(null); continue; }
    const from = start + names[i].length + 1;
    const endIdx = i < names.length - 1 ? t.indexOf(`\n${names[i + 1]}`, from) : t.length;
    const block = (endIdx === -1 ? t.slice(from) : t.slice(from, endIdx))
      .replace(/^[\s:\-]+/, '')
      .trim();
    out.push(block || null);
  }
  return out;
}

async function runOcr(base64: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }] }],
      }),
    }
  );
  const data = (await res.json()) as {
    error?: { code?: number; message?: string; status?: string };
    responses?: { fullTextAnnotation?: { text?: string }; error?: { message?: string } }[];
  };
  const top = data?.error;
  const r0 = data?.responses?.[0];
  if (top) {
    const msg = top.message || `Vision API error: ${res.status}`;
    if (res.status === 403) {
      throw new Error(
        `${msg} — Enable Cloud Vision API in Google Cloud Console, set API key application restrictions to “None” for mobile, and ensure billing is enabled.`
      );
    }
    throw new Error(msg);
  }
  if (r0?.error) throw new Error(r0.error.message || 'Vision API error');
  if (!res.ok) throw new Error(`Vision API error: ${res.status}`);
  const txt = r0?.fullTextAnnotation?.text;
  if (!txt) throw new Error('No text found in image');
  return txt;
}

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [week, setWeek] = useState(emptyWeek());
  const [parsing, setParsing] = useState(false);
  const router = useRouter();

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

  const ensurePermission = async () => {
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

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const { uri, base64 } = res.assets[0];
    setPlannerImage(uri);
    const key = ENV.GOOGLE_VISION_API_KEY?.trim();
    if (!key || !base64) {
      if (!key) return;
      Alert.alert('Image too large', 'Try a smaller or cropped image to auto-fill from the planner.');
      return;
    }
    setParsing(true);
    try {
      const text = await runOcr(base64, key);
      const activities = parseWeekFromOcrText(text);
      setWeek(prev => prev.map((s, i) => ({ ...s, activity: activities[i] ?? s.activity })));
    } catch (e) {
      Alert.alert('Couldn\'t read image', (e instanceof Error ? e.message : 'Please check the image and try again.'));
    } finally {
      setParsing(false);
    }
  };

  const clearReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    setWeek(emptyWeek());
    Alert.alert('Cleared', 'Reminders cleared. Type in your week, then tap Enable.');
  };

  const enableReminders = async () => {
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let count = 0;

    for (let i = 0; i < week.length; i++) {
      const a = week[i].activity?.trim();
      if (!a) continue;

      let dayBefore = i; // i=0 Mon -> notify Sun (getDay 0), i=1 Tue -> Mon (1), ...
      let daysUntil = (dayBefore - now.getDay() + 7) % 7;
      const at = new Date(now);
      at.setDate(now.getDate() + daysUntil);
      at.setHours(20, 0, 0, 0);
      if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 7);

      const sec = Math.max(1, Math.floor((at.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        content: { title: `Reminder: ${week[i].day}`, body: a, sound: true },
        trigger: { seconds: sec } as any,
      });
      count++;
    }

    setRemindersEnabled(true);
    Alert.alert('Enabled', `Scheduled ${count} reminder(s) for the week.`);
  };

  const testNotification = async () => {
    if (!(await ensurePermission())) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Test', body: 'Test from MotusTots', sound: true },
      trigger: { seconds: 5 } as any,
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
        <View style={{ position: 'relative' }}>
          <Image
            source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
            contentFit="contain"
            style={{ width: 320, height: 430, borderRadius: 12 }}
            onError={() => setPlannerImage(null)}
          />
          {parsing && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginTop: 8 }}>Reading planner…</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={pickImage}
          disabled={parsing}
          style={{ marginTop: 10, backgroundColor: parsing ? '#90caf9' : '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
        </TouchableOpacity>
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
          onPress={enableReminders}
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
    </ScrollView>
  );
}
