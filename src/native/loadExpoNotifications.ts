import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

/**
 * `expo-notifications` throws on import in Expo Go for Android (SDK 53+).
 * Skip loading entirely so the native module init never runs.
 */
function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}

function shouldDeferExpoNotificationsImport(): boolean {
  return isExpoGo() && Platform.OS === 'android';
}

export async function loadExpoNotificationsModule(): Promise<NotificationsModule | null> {
  if (shouldDeferExpoNotificationsImport()) {
    return null;
  }
  try {
    return await import('expo-notifications');
  } catch (error) {
    console.warn('Notifications unavailable in this environment:', error);
    return null;
  }
}
