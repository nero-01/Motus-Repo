import { Stack } from 'expo-router';

export default function ActivitiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#006A60' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Activities' }} />
      <Stack.Screen
        name="session"
        options={{
          title: 'Activity',
          headerBackVisible: true,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
