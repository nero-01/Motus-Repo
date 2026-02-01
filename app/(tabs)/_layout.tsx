import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';

function MoreIcon({ color }: { color: string }) {
  return (
    <View style={iconStyles.dotsRow}>
      <View style={[iconStyles.dot, { backgroundColor: color }]} />
      <View style={[iconStyles.dot, { backgroundColor: color }]} />
      <View style={[iconStyles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';

  return (
    <Tabs
      initialRouteName="index"
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
        name="activities/index"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⭐</Text>
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
        name="education"
        options={{
          title: 'Education',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <MoreIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
