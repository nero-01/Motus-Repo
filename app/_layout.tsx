import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { usePWA } from '../hooks/usePWA';

function PWABootstrap() {
  usePWA();
  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
      }}
    >
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <PWABootstrap />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="features" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
