import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON_SIZE = 24;

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

type TabMeta = {
  title: string;
  tabBarLabel: string;
  active: MciName;
  inactive: MciName;
};

/** Normalize expo-router route names (e.g. `activities/index` → `activities`). */
function tabMetaForRoute(routeName: string): TabMeta | undefined {
  const base = routeName.includes('/')
    ? routeName.slice(0, routeName.indexOf('/'))
    : routeName;

  const tabs: Record<string, TabMeta> = {
    index: {
      title: 'Home',
      tabBarLabel: 'Home',
      active: 'home',
      inactive: 'home-outline',
    },
    activities: {
      title: 'activities',
      tabBarLabel: 'activities',
      active: 'puzzle',
      inactive: 'puzzle-outline',
    },
    education: {
      title: 'Education',
      tabBarLabel: 'Education',
      active: 'school',
      inactive: 'school-outline',
    },
    reminders: {
      title: 'Reminders',
      tabBarLabel: 'Reminders',
      active: 'bell',
      inactive: 'bell-outline',
    },
    profile: {
      title: 'More',
      tabBarLabel: 'More',
      active: 'dots-horizontal',
      inactive: 'dots-horizontal',
    },
  };

  return tabs[base];
}

/** Small lift above the gesture / software nav bar, after safe area. */
const TAB_BAR_EXTRA_BOTTOM_DP = 8;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + TAB_BAR_EXTRA_BOTTOM_DP;
  const tabBarHeight = 52 + 8 + bottomPad;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const meta = tabMetaForRoute(route.name);
        return {
          title: meta?.title ?? route.name,
          tabBarLabel: meta?.tabBarLabel ?? route.name,
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
          tabBarIcon: ({ focused, color, size }) => {
            if (!meta) {
              return (
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={size ?? ICON_SIZE}
                  color={color}
                />
              );
            }
            return (
              <MaterialCommunityIcons
                name={focused ? meta.active : meta.inactive}
                size={size ?? ICON_SIZE}
                color={color}
              />
            );
          },
        };
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activities" />
      <Tabs.Screen name="education/index" />
      <Tabs.Screen name="reminders/index" />
      <Tabs.Screen name="profile/index" />
    </Tabs>
  );
}
