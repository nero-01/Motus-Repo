import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: 'fade',
        }}
      >
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            title: 'Onboarding',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Sign In',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            title: 'Sign Up',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ 
            title: 'Forgot Password',
            headerShown: false 
          }} 
        />
      </Stack>
    </>
  );
}
