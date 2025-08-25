import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../styles/theme';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function RootLayout() {
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