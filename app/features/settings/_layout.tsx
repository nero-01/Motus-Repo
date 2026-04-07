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
        name="edit-profile"
        options={{
          title: 'Edit profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Change password',
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
