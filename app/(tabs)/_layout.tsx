import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Small lift above the gesture / software nav bar, after safe area. */
const TAB_BAR_EXTRA_BOTTOM_DP = 8;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + TAB_BAR_EXTRA_BOTTOM_DP;
  const tabBarHeight = 52 + 8 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomPad,
          paddingTop: 8,
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
