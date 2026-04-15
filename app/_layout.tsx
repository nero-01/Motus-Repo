import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Notification handler is set in the Reminders tab when it mounts, so we never
// touch expo-notifications at app startup. That avoids "native module not found"
// or similar errors in Expo Go on first launch.

export default function RootLayout() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        if (__DEV__) console.error('Global error caught:', error, errorInfo);
      }}
    >
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="features" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
} 