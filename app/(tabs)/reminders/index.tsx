/**
 * MotusTots — Reminders Tab (with OCR + Push Notifications + PWA)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import {
  registerForPushNotifications,
  scheduleWeeklyReminders,
  type ParsedActivity,
  type ScheduledReminder,
} from '../../../services/notifications/pushNotificationService';
import { extractActivitiesFromImage } from '../../../services/notifications/ocrReminderService';
import { usePWA } from '../../../hooks/usePWA';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';

const TYPE_BG: Record<string, string> = {
  sport: '#E8F5E9',
  arts: '#F3E5F5',
  preparation: '#FFF3E0',
  language: '#E3F2FD',
  general: '#F5F5F5',
};
const TYPE_ICON: Record<string, string> = {
  sport: '🥋',
  arts: '🎭',
  preparation: '🎒',
  language: '💬',
  general: '📌',
};

export default function RemindersTabScreen() {
  const router = useRouter();
  const { isInstallable, promptInstall } = usePWA();

  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [activities, setActivities] = useState<ParsedActivity[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'scanned' | 'scheduled'>('idle');

  useEffect(() => {
    registerForPushNotifications().then((t) => {
      if (t) {
        setPushToken(t);
      }
    });
  }, []);

  const pickImage = async () => {
    setScanError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!res.canceled && res.assets?.length) {
      setPlannerImage(res.assets[0].uri);
      setStep('idle');
      setActivities([]);
      setScheduled([]);
    }
  };

  const captureCamera = async () => {
    setScanError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission required');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!res.canceled && res.assets?.length) {
      setPlannerImage(res.assets[0].uri);
      setStep('idle');
      setActivities([]);
      setScheduled([]);
    }
  };

  const handleScan = useCallback(async () => {
    if (!plannerImage) {
      Alert.alert('No image', 'Please upload or photograph your planner first.');
      return;
    }
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await extractActivitiesFromImage(plannerImage);
      if (!result.success || !result.activities.length) {
        setScanError(result.error || 'No activities found — try a clearer photo.');
        return;
      }
      setActivities(result.activities);
      setStep('scanned');
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  }, [plannerImage]);

  const handleSchedule = async () => {
    if (!activities.length) {
      return;
    }
    setIsScheduling(true);
    try {
      const result = await scheduleWeeklyReminders(activities);
      setScheduled(result);
      setStep('scheduled');
      Alert.alert(
        '✅ Reminders set!',
        `${result.length} reminder${result.length !== 1 ? 's' : ''} scheduled — you'll be notified the evening before each activity.`
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to schedule reminders.');
    } finally {
      setIsScheduling(false);
    }
  };

  const reset = () => {
    setStep('idle');
    setActivities([]);
    setScheduled([]);
    setPlannerImage(null);
    setScanError(null);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {Platform.OS === 'web' && isInstallable && (
        <TouchableOpacity style={s.pwaBanner} onPress={() => void promptInstall()}>
          <Text style={s.pwaBannerTitle}>📲 Install MotusTots on your home screen</Text>
          <Text style={s.pwaBannerSub}>Get push notifications & offline access</Text>
        </TouchableOpacity>
      )}

      <View style={s.header}>
        <Text style={s.title}>Weekly Reminders</Text>
        <Text style={s.subtitle}>
          Photograph or upload your printed planner — AI will extract activities and set reminders
          automatically.
        </Text>
      </View>

      <View style={s.imageCard}>
        <Image
          source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
          style={s.image}
        />
        <View style={s.imageRow}>
          <TouchableOpacity style={s.outlineBtn} onPress={pickImage}>
            <Text style={s.outlineBtnText}>📁 Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={captureCamera}>
            <Text style={s.outlineBtnText}>📷 Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {step === 'idle' && (
        <TouchableOpacity
          style={[s.primaryBtn, isScanning && s.disabled]}
          onPress={handleScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={s.row}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[s.primaryBtnText, { marginLeft: 8 }]}>Scanning with AI…</Text>
            </View>
          ) : (
            <Text style={s.primaryBtnText}>🔍 Scan Planner (OCR)</Text>
          )}
        </TouchableOpacity>
      )}

      {scanError && (
        <View style={s.errorCard}>
          <Text style={s.errorText}>⚠️ {scanError}</Text>
        </View>
      )}

      {activities.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {step === 'scheduled' ? '✅ Scheduled Reminders' : '📋 Detected Activities'}
          </Text>

          {activities.map((item) => {
            const sched = scheduled.find((row) => row.id.includes(item.day.toLowerCase()));
            const type = sched?.activityType || 'general';
            return (
              <View key={item.day} style={[s.card, { backgroundColor: TYPE_BG[type] }]}>
                <Text style={s.cardIcon}>{TYPE_ICON[type]}</Text>
                <View style={s.cardBody}>
                  <Text style={s.cardDay}>{item.day}</Text>
                  <Text style={s.cardActivity}>{item.activity}</Text>
                  {sched && (
                    <Text style={s.cardScheduled}>
                      🔔{' '}
                      {sched.scheduledDate.toLocaleDateString('en-ZA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {step === 'scanned' && (
            <TouchableOpacity
              style={[s.successBtn, isScheduling && s.disabled]}
              onPress={handleSchedule}
              disabled={isScheduling}
            >
              {isScheduling ? (
                <View style={s.row}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[s.primaryBtnText, { marginLeft: 8 }]}>Scheduling…</Text>
                </View>
              ) : (
                <Text style={s.primaryBtnText}>
                  🔔 Schedule {activities.length} Reminder{activities.length !== 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {step === 'scheduled' && (
            <TouchableOpacity style={[s.outlineBtnFull, { marginTop: 12 }]} onPress={reset}>
              <Text style={s.outlineBtnText}>↩ Scan a new planner</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {__DEV__ && pushToken && (
        <View style={s.devCard}>
          <Text style={s.devTitle}>Push Token (dev)</Text>
          <Text style={s.devText} numberOfLines={3}>
            {pushToken}
          </Text>
        </View>
      )}

      <TouchableOpacity style={s.manageLink} onPress={() => router.push('/features/settings/reminders')}>
        <Text style={s.manageLinkText}>⚙️ Manage all scheduled reminders →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const TEAL = '#006A60';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F9' },
  content: { paddingBottom: 48 },

  pwaBanner: {
    backgroundColor: TEAL,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
  },
  pwaBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pwaBannerSub: { color: '#c8ede9', fontSize: 12, marginTop: 2 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: TEAL },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4, lineHeight: 20 },

  imageCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  image: { width: '100%', height: 240, resizeMode: 'contain', borderRadius: 8 },
  imageRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },

  primaryBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: TEAL,
  },
  successBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2E7D32',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  outlineBtnFull: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineBtnText: { color: TEAL, fontWeight: '600', fontSize: 14 },
  disabled: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center' },

  errorCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#B00020', fontSize: 14 },

  section: { marginTop: 20, marginHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 10 },

  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  cardIcon: { fontSize: 22, marginRight: 12, marginTop: 2, flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardDay: { fontWeight: '700', fontSize: 15, color: '#333' },
  cardActivity: { fontSize: 13, color: '#555', marginTop: 2, lineHeight: 18, flexShrink: 1 },
  cardScheduled: { fontSize: 11, color: TEAL, marginTop: 4, fontWeight: '600' },

  devCard: { margin: 20, backgroundColor: '#E8F4FD', borderRadius: 8, padding: 12 },
  devTitle: { fontWeight: '700', fontSize: 12, color: '#1565C0', marginBottom: 4 },
  devText: { fontSize: 10, color: '#333' },

  manageLink: { marginTop: 20, marginHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  manageLinkText: { color: TEAL, fontWeight: '600', fontSize: 14 },
});
