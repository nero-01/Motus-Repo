import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarExtraBottom = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: tabBarExtraBottom,
          minHeight: 52 + tabBarExtraBottom,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⭐</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="education/index"
        options={{
          title: 'Education',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="reminders/index"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🔔</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⋯</Text>
          ),
        }}
      />
    </Tabs>
  );
} 