import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { theme } from '../styles/theme';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          await new Promise(r => setTimeout(r, attempt === 0 ? 300 : 500));
          if (cancelled) return;
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          });
          return;
        } catch (_) {
          // Native module may not be ready yet (Expo Go on first load)
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
      }}
    >
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="features" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </ErrorBoundary>
  );
} 