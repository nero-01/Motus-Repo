/**
 * MotusTots Push Notification Service
 *
 * Handles:
 *  - Expo push token registration (native iOS/Android)
 *  - Web Push API subscription (PWA)
 *  - Scheduling local notifications
 *  - Storing push token in Supabase for server-side sends
 */

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '../../config/env';
import { loadExpoNotificationsModule } from '../../src/native/loadExpoNotifications';
import { supabase } from '../supabase/client';

type NotificationsModule = NonNullable<Awaited<ReturnType<typeof loadExpoNotificationsModule>>>;

export interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  scheduledDate: Date;
  dayOfWeek: number;
  activityType?: string;
}

export interface ParsedActivity {
  day: string;
  dayIndex: number;
  activity: string;
  time?: string;
}

/** @deprecated Use ParsedActivity */
export type WeekActivity = {
  day: string;
  activity: string | null;
  time?: string | null;
};

const VAPID_PUBLIC_KEY =
  ENV.VAPID_PUBLIC_KEY || process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY_HERE';

let handlerConfigured = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') {
    return loadExpoNotificationsModule();
  }
  return loadExpoNotificationsModule();
}

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    ENV.PROJECT_ID ||
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    undefined
  );
}

export async function configureNotificationHandler(): Promise<void> {
  if (handlerConfigured) {
    return;
  }
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return registerWebPush();
  }
  return registerNativePush();
}

/** Alias for registerForPushNotifications */
export const registerPushToken = registerForPushNotifications;

async function registerNativePush(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return null;
  }

  await configureNotificationHandler();

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Weekly Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#006A60',
      sound: 'default',
    });
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('Missing Expo project ID. Set extra.eas.projectId or EXPO_PUBLIC_PROJECT_ID.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    await savePushTokenToSupabase(token, 'expo');
    return token;
  } catch (error) {
    console.error('Failed to get Expo push token:', error);
    return null;
  }
}

async function registerWebPush(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push not supported in this browser.');
    return null;
  }

  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
    console.warn('Missing EXPO_PUBLIC_VAPID_PUBLIC_KEY for web push.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const subscriptionJson = JSON.stringify(subscription);
    await savePushTokenToSupabase(subscriptionJson, 'web');
    return subscriptionJson;
  } catch (error) {
    console.error('Web Push subscription failed:', error);
    return null;
  }
}

async function savePushTokenToSupabase(token: string, platform: 'expo' | 'web'): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    );
  } catch (error) {
    console.error('Failed to save push token to Supabase:', error);
  }
}

export async function scheduleWeeklyReminders(
  activities: ParsedActivity[]
): Promise<ScheduledReminder[]> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return [];
  }

  await configureNotificationHandler();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    if (requested !== 'granted') {
      throw new Error('Notification permission not granted');
    }
  }

  const scheduled: ScheduledReminder[] = [];
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const { day, dayIndex, activity, time } of activities) {
    if (!activity.trim()) {
      continue;
    }

    const [notifyHour, notifyMin] = time ? time.split(':').map(Number) : [20, 0];
    const reminderDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const notificationDate = nextOccurrenceOfDay(reminderDayIndex, notifyHour, notifyMin, now);
    const identifier = `reminder-${day.toLowerCase()}-${dayIndex}`;

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `📅 Tomorrow: ${day}`,
        body: activity,
        sound: 'default',
        data: { day, activity, dayIndex },
      },
      trigger: {
        date: notificationDate,
      } as import('expo-notifications').NotificationTriggerInput,
    });

    scheduled.push({
      id: identifier,
      title: `Tomorrow: ${day}`,
      body: activity,
      scheduledDate: notificationDate,
      dayOfWeek: reminderDayIndex,
      activityType: classifyActivity(activity),
    });
  }

  return scheduled;
}

export async function cancelAllReminders(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminderCount(): Promise<number> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return 0;
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

export async function scheduleTestNotification(delaySeconds = 5): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    throw new Error('Notifications unavailable in this environment');
  }

  await configureNotificationHandler();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    if (requested !== 'granted') {
      throw new Error('Notification permission not granted');
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification from MotusTots!',
      sound: 'default',
    },
    trigger: {
      seconds: delaySeconds,
    } as import('expo-notifications').NotificationTriggerInput,
  });
}

export function weekActivitiesToParsed(week: WeekActivity[]): ParsedActivity[] {
  const dayIndexByName: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return week
    .filter((row) => row.activity?.trim())
    .map((row) => {
      const key = row.day.trim().toLowerCase();
      const dayIndex = dayIndexByName[key] ?? 1;
      return {
        day: row.day,
        dayIndex,
        activity: row.activity!.trim(),
        ...(row.time ? { time: row.time } : {}),
      };
    });
}

function nextOccurrenceOfDay(targetDay: number, hour: number, minute: number, from: Date): Date {
  const result = new Date(from);
  result.setHours(hour, minute, 0, 0);

  const currentDay = from.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;

  if (daysUntil === 0 && result <= from) {
    daysUntil = 7;
  }

  result.setDate(result.getDate() + daysUntil);
  return result;
}

function classifyActivity(activity: string): string {
  const lower = activity.toLowerCase();
  if (lower.includes('karate') || lower.includes('sport') || lower.includes('soccer')) {
    return 'sport';
  }
  if (lower.includes('drama') || lower.includes('music') || lower.includes('art')) {
    return 'arts';
  }
  if (lower.includes('bring') || lower.includes('pack') || lower.includes('poster')) {
    return 'preparation';
  }
  if (lower.includes('speech') || lower.includes('language')) {
    return 'language';
  }
  return 'general';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
