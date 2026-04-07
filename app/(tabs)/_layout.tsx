import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Extra space above the system nav / gesture bar. 5 cm ≈ 63 dp/cm (Android dp definition). */
const TAB_BAR_EXTRA_BOTTOM_CM = 5;
const DP_PER_CM = 160 / 2.54;
const TAB_BAR_EXTRA_BOTTOM_DP = Math.round(TAB_BAR_EXTRA_BOTTOM_CM * DP_PER_CM);

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
