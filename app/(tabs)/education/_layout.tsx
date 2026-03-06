import { Stack } from 'expo-router';

export default function EducationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#006A60' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Education Hub' }} />
      <Stack.Screen
        name="worksheet"
        options={{
          title: 'Worksheet',
          headerShown: true,
          headerBackVisible: true,
          presentation: 'card',
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#f8f9fa' },
        }}
      />
    </Stack>
  );
}
