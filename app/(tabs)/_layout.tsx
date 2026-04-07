import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON_SIZE = 24;

type TabIconProps = { focused: boolean; color: string; size?: number };

function TabIcon({
  focused,
  color,
  size = ICON_SIZE,
  active,
  inactive,
}: TabIconProps & {
  active: keyof typeof MaterialCommunityIcons.glyphMap;
  inactive: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <MaterialCommunityIcons
      name={focused ? active : inactive}
      size={size}
      color={color}
    />
  );
}

/** Small lift above the gesture / software nav bar, after safe area. */
const TAB_BAR_EXTRA_BOTTOM_DP = 8;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + TAB_BAR_EXTRA_BOTTOM_DP;
  const tabBarHeight = 52 + 8 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#006A60',
        tabBarInactiveTintColor: '#757575',
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
          tabBarIcon: (props) => (
            <TabIcon {...props} active="home" inactive="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: (props) => (
            <TabIcon {...props} active="star" inactive="star-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="education/index"
        options={{
          title: 'Education',
          tabBarIcon: (props) => (
            <TabIcon {...props} active="school" inactive="school-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders/index"
        options={{
          title: 'Reminders',
          tabBarIcon: (props) => (
            <TabIcon {...props} active="bell" inactive="bell-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'More',
          tabBarIcon: (props) => (
            <TabIcon
              {...props}
              active="dots-horizontal"
              inactive="dots-horizontal"
            />
          ),
        }}
      />
    </Tabs>
  );
}
