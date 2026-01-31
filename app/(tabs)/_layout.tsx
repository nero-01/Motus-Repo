import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        tabBarStyle: {
          height: isAndroid ? 78 : 64,
          paddingBottom: isAndroid ? 18 : 8,
          paddingTop: 6,
          marginBottom: isAndroid ? 18 : 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
          elevation: 12,
          shadowColor: '#00000040',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 6,
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
        name="reminders/index"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🔔</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activities/index"
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book" size={size ?? 24} color={color} />
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