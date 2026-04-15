import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="children" 
        options={{ 
          title: 'Manage Children',
          headerShown: true,
        }} 
      />
      <Stack.Screen
        name="family"
        options={{
          title: 'Family setup',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="export-data"
        options={{
          title: 'Export data',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'Help & FAQ',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="contact-support"
        options={{
          title: 'Contact support',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About MotusTots',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'Privacy settings',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
