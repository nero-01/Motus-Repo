import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Alert, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import * as ImagePicker from 'expo-image-picker';

const WEEK_ACTIVITIES_KEY = 'MotusTots_WEEK_PLANNER_ACTIVITIES';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_WEEK = DAYS.map(day => ({ day, activity: null as string | null }));

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [weekActivities, setWeekActivities] = useState<{ day: string; activity: string | null }[]>(DEFAULT_WEEK);
  const [hasLoaded, setHasLoaded] = useState(false);
  const router = useRouter();

  // Load week activities from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(WEEK_ACTIVITIES_KEY);
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length === 7) {
            setWeekActivities(parsed);
          }
        }
      } catch (_) {}
      setHasLoaded(true);
    })();
  }, []);

  // Persist week activities when they change (after initial load)
  useEffect(() => {
    if (!hasLoaded) return;
    AsyncStorage.setItem(WEEK_ACTIVITIES_KEY, JSON.stringify(weekActivities)).catch(() => {});
  }, [weekActivities, hasLoaded]);

  // Set up notification handler and Android channel
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      }).catch(() => {});
    }

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
        Alert.alert(
          'Notifications disabled',
          'Notifications are turned off for MotusTots. Enable them in device Settings to receive reminders.'
        );
        return false;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notifications were not enabled. You can update this later from Settings.');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error checking notification permissions:', e);
      Alert.alert('Error', 'Unable to check notification permissions.');
      return false;
    }
  };

  const updateActivity = (index: number, activity: string | null) => {
    setWeekActivities(prev => {
      const next = [...prev];
      next[index] = { ...next[index], activity: activity || null };
      return next;
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    // On new upload: clear scheduled reminders, reset state, reset week activities for user to re-enter from planner
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    setPlannerImage(result.assets[0].uri);
    setWeekActivities(DEFAULT_WEEK.map(({ day }) => ({ day, activity: null })));
    Alert.alert('Planner uploaded', 'Enter reminders for each day below from your planner, then tap Enable Reminders.');
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

        // i: 0=Mon..6=Sun. Notify at 8pm the day before. Day before Mon = Sun (getDay 0), before Tue = Mon (1), ... before Sun = Sat (6). So target getDay = i.
        const targetGetDay = i;
        let daysUntil = (targetGetDay - now.getDay() + 7) % 7;
        const notificationDate = new Date(now);
        notificationDate.setDate(now.getDate() + daysUntil);
        notificationDate.setHours(20, 0, 0, 0);

        if (notificationDate.getTime() <= Date.now()) {
          notificationDate.setDate(notificationDate.getDate() + 7);
        }

        const secondsFromNow = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));

        const trigger: Notifications.NotificationTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
        };

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${day}`,
            body: activity.trim(),
            sound: true,
          },
          trigger,
        });
        scheduledCount++;
      }

      setRemindersEnabled(true);
      Alert.alert('Reminders enabled', `Scheduled ${scheduledCount} reminder(s) for this week. You’ll get a notification the evening before each activity.`);
    } catch (e) {
      console.error('Error scheduling notifications:', e);
      Alert.alert('Error', 'Failed to schedule notifications. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      const hasPermission = await ensureNotificationPermission();
      if (!hasPermission) return;

      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test from MotusTots!',
          sound: true,
        },
        trigger,
      });
      Alert.alert('Test Notification', 'A test notification will appear in 5 seconds.');
    } catch (e) {
      console.error('Error scheduling test notification:', e);
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      Alert.alert('Scheduled Notifications', `You have ${scheduled.length} reminder(s) scheduled.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to check scheduled notifications.');
    }
  };

  const resetRemindersState = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setRemindersEnabled(false);
    Alert.alert('Reminders cleared', 'All scheduled reminders have been cancelled. You can enable them again with the list below.');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
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

      <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>This Week&apos;s Reminders</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Edit each day from your planner. Reminders are sent the evening before (8pm).</Text>
        {weekActivities.map(({ day, activity }, idx) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
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
        <TouchableOpacity
          style={{ marginTop: 12, alignSelf: 'flex-end', backgroundColor: '#006A60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
          onPress={() => router.push('/features/settings/reminders')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage Reminders</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Clear All Reminders</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
