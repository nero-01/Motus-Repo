import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, TextInput, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';

const REMINDERS_CHANNEL_ID = 'motustots-reminders';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyWeek = (): { day: string; activity: string | null }[] =>
  DAYS.map(day => ({ day, activity: null }));

const DAY_PATTERNS: { full: string; short: string }[] = [
  { full: 'monday', short: 'mon' },
  { full: 'tuesday', short: 'tue' },
  { full: 'wednesday', short: 'wed' },
  { full: 'thursday', short: 'thu' },
  { full: 'friday', short: 'fri' },
  { full: 'saturday', short: 'sat' },
  { full: 'sunday', short: 'sun' },
];

function findDayStart(lower: string, dayIndex: number): { index: number; length: number } | null {
  const { full, short } = DAY_PATTERNS[dayIndex];
  let best: { index: number; length: number } | null = null;
  const fullIdx = lower.indexOf(full);
  if (fullIdx !== -1) best = { index: fullIdx, length: full.length };
  const shortIdx = lower.indexOf(short);
  if (shortIdx !== -1) {
    if (!best || shortIdx < best.index) best = { index: shortIdx, length: short.length };
  }
  return best;
}

function parseWeekFromOcrText(fullText: string): { day: string; activity: string | null }[] {
  const week = emptyWeek();
  const normalized = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lower = normalized.toLowerCase();
  const dayStarts: { dayIndex: number; start: number; end: number }[] = [];
  for (let i = 0; i < DAYS.length; i++) {
    const found = findDayStart(lower, i);
    if (!found) continue;
    const afterMarker = found.index + found.length;
    let end = normalized.length;
    for (let j = 0; j < DAYS.length; j++) {
      if (j === i) continue;
      const next = findDayStart(lower, j);
      if (next && next.index > found.index && next.index < end) end = next.index;
    }
    const activity = normalized.slice(afterMarker, end).replace(/\n+/g, ' ').trim();
    if (activity) week[i] = { day: DAYS[i], activity };
  }
  return week;
}

const OCR_HTML = `
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body>
<p style="padding:20px;text-align:center;">Reading image…</p>
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js"><\/script>
<script>
(function(){
  function go(){
    window.runOCR=function(dataUrl){
      Tesseract.recognize(dataUrl).then(function(r){
        if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({text:(r&&r.data&&r.data.text)||''}));
      }).catch(function(e){
        if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({error:(e&&e.message)||'Failed'}));
      });
    };
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage('READY');
  }
  if(typeof Tesseract!=='undefined') go(); else window.addEventListener('load',go);
})();
<\/script>
</body></html>
`;

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [week, setWeek] = useState(emptyWeek());
  const [readingImage, setReadingImage] = useState(false);
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const ocrWebViewRef = useRef<WebView>(null);
  const ocrBase64Ref = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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
      return () => {
        sub1.remove();
        sub2.remove();
      };
    } catch (_) {
      return undefined;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        if (!mounted) return;
        const prefix = 'Reminder: ';
        const nextWeek = emptyWeek();
        let found = 0;
        for (const n of scheduled) {
          const title = n.content.title ?? '';
          if (!title.startsWith(prefix)) continue;
          const dayName = title.slice(prefix.length).trim();
          const body = n.content.body ?? '';
          const idx = DAYS.indexOf(dayName);
          if (idx !== -1) {
            nextWeek[idx] = { day: dayName, activity: body || null };
            found++;
          }
        }
        if (found > 0) {
          setWeek(nextWeek);
          setRemindersEnabled(true);
        }
      } catch (_) {
        // Notifications may be unavailable (e.g. web)
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]) {
      setPlannerImage(res.assets[0].uri);
      await Notifications.cancelAllScheduledNotificationsAsync();
      setRemindersEnabled(false);
      setWeek(emptyWeek());
    }
  };

  const readFromImage = async () => {
    if (!plannerImage) {
      Alert.alert('No image', 'Upload a weekly planner image first.');
      return;
    }
    setReadingImage(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(plannerImage, { encoding: FileSystem.EncodingType.Base64 });
      ocrBase64Ref.current = base64;
      setOcrModalVisible(true);
    } catch (e) {
      setReadingImage(false);
      Alert.alert('Could not read image', 'Try choosing the image again.');
    }
  };

  const onOcrMessage = (event: { nativeEvent: { data: string } }) => {
    const data = event.nativeEvent.data;
    if (data === 'READY') {
      const b64 = ocrBase64Ref.current;
      if (b64 && ocrWebViewRef.current) {
        const dataUrl = 'data:image/jpeg;base64,' + b64;
        ocrWebViewRef.current.injectJavaScript('window.runOCR(' + JSON.stringify(dataUrl) + ');');
      }
      return;
    }
    try {
      const payload = JSON.parse(data) as { text?: string; error?: string };
      if (payload.error) {
        Alert.alert('Read failed', payload.error);
      } else if (payload.text != null) {
        const parsed = parseWeekFromOcrText(payload.text);
        setWeek(parsed);
        const filled = parsed.filter((e) => e.activity?.trim()).length;
        Alert.alert('Done', filled > 0 ? `Found ${filled} day(s). Tap Enable Reminders.` : 'No day names found. Try a clearer image.');
      }
    } catch (_) {}
    ocrBase64Ref.current = null;
    setOcrModalVisible(false);
    setReadingImage(false);
  };

  const clearReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    setWeek(emptyWeek());
    Alert.alert('Cleared', 'Reminders cleared. Tap Read from image or Enable when ready.');
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
        content: {
          title: `Reminder: ${week[i].day}`,
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

      <Modal visible={ocrModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', height: 260 }}>
            <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Reading image…</Text>
              <TouchableOpacity
                onPress={() => {
                  ocrBase64Ref.current = null;
                  setOcrModalVisible(false);
                  setReadingImage(false);
                }}
              >
                <Text style={{ color: '#006A60', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <WebView
              ref={ocrWebViewRef}
              source={{ html: OCR_HTML }}
              onMessage={onOcrMessage}
              style={{ flex: 1, backgroundColor: '#fff' }}
              originWhitelist={['*']}
              mixedContentMode="compatibility"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
