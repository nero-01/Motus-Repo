import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Surface, Chip, Avatar, List, Divider } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getGreeting } from '../../utils/greeting';
import { useAuthStore } from '../../src/modules/auth/store/authStore';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const ACTION_GAP = 10;
const cardWidth = (width - HORIZONTAL_PADDING * 2 - ACTION_GAP) / 2; // tighter two-column layout

interface DashboardStats {
  routinesCompleted: number;
  routinesRemaining: number;
  mealsPlanned: number;
  worksheetsAvailable: number;
  newMessages: number;
  expensesToReview: number;
  weeklyProgress: number;
  streakDays: number;
  activeRoutines: number;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string[];
  route: string;
}

interface RecentActivity {
  id: string;
  type: 'routine' | 'meal' | 'education' | 'message';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

export default function DashboardScreen() {
  const { logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    routinesCompleted: 0,
    routinesRemaining: 0,
    mealsPlanned: 0,
    worksheetsAvailable: 0,
    newMessages: 0,
    expensesToReview: 0,
    weeklyProgress: 0,
    streakDays: 0,
    activeRoutines: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Activities',
      subtitle: 'Fun & Games',
      icon: '🎯',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E8E'],
      route: '/(tabs)/activities',
    },
    {
      id: '2',
      title: 'Education',
      subtitle: 'Learning Hub',
      icon: '📚',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#6EE5DC'],
      route: '/(tabs)/education',
    },
    {
      id: '3',
      title: 'Routines',
      subtitle: 'Daily Tasks',
      icon: '⚡',
      color: '#45B7D1',
      gradient: ['#45B7D1', '#67C8E0'],
      route: '/features/routines',
    },
    {
      id: '4',
      title: 'Rewards',
      subtitle: 'Achievements',
      icon: '🏆',
      color: '#F7DC6F',
      gradient: ['#F7DC6F', '#F9E79F'],
      route: '/features/rewards',
    },
    {
      id: '5',
      title: 'Chores',
      subtitle: 'House Tasks',
      icon: '🏠',
      color: '#BB8FCE',
      gradient: ['#BB8FCE', '#C8A2DB'],
      route: '/features/chores',
    },
    {
      id: '6',
      title: 'Co-Parenting',
      subtitle: 'Family Sync',
      icon: '👨‍👩‍👧‍👦',
      color: '#85C1E9',
      gradient: ['#85C1E9', '#A3D5F1'],
      route: '/features/co-parenting',
    },
  ];

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Dashboard: Loading data...');
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockStats: DashboardStats = {
        routinesCompleted: 3,
        routinesRemaining: 2,
        mealsPlanned: 4,
        worksheetsAvailable: 6,
        newMessages: 2,
        expensesToReview: 1,
        weeklyProgress: 75,
        streakDays: 5,
        activeRoutines: 3,
      };
      
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'routine',
          title: 'Morning Routine',
          description: 'Emma completed her morning tasks',
          time: '2h ago',
          icon: '☀️',
          color: '#4CAF50',
        },
        {
          id: '2',
          type: 'education',
          title: 'Math Practice',
          description: 'Addition worksheet finished',
          time: '4h ago',
          icon: '🧮',
          color: '#2196F3',
        },
        {
          id: '3',
          type: 'meal',
          title: 'Lunch Planned',
          description: 'Healthy meal added to schedule',
          time: '6h ago',
          icon: '🥗',
          color: '#FF9800',
        },
      ];
      
      setStats(mockStats);
      setRecentActivities(mockActivities);
      console.log('Dashboard: Data loaded successfully');
    } catch (error) {
      console.error('Dashboard: Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('Signing out...');
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#4CAF50';
    if (progress >= 60) return '#FF9800';
    return '#F44336';
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statInfo}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </Surface>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionTile}
      onPress={() => router.push(action.route as any)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={action.gradient as any}
        style={styles.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.actionContent}>
          <Text style={styles.actionIcon}>{action.icon}</Text>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <LinearGradient
          colors={['#006A60', '#008577']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>{getGreeting().message} {getGreeting().icon}</Text>
              <Text style={styles.subtitle}>Ready to make today amazing?</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.profileButton}>
              <Avatar.Text size={40} label="U" style={styles.avatar} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Progress Overview - Compact */}
        <View style={styles.progressSection}>
          <Surface style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Weekly Progress</Text>
              <Text style={styles.progressPercentage}>{stats.weeklyProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.weeklyProgress}%`,
                    backgroundColor: getProgressColor(stats.weeklyProgress)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressSubtext}>
              Great job! Keep up the momentum 🚀
            </Text>
          </Surface>
        </View>

        {/* Quick Stats - Compact Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('Completed', stats.routinesCompleted, '✅', '#4CAF50')}
          {renderStatCard('Remaining', stats.routinesRemaining, '⏳', '#FF9800')}
          {renderStatCard('Streak Days', stats.streakDays, '🔥', '#F44336')}
          {renderStatCard('Activities', stats.activeRoutines, '⚡', '#2196F3')}
        </View>

        {/* Quick Actions - Modern Tiles */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Recent Activity - Compact */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivities.map((activity) => (
            <Surface key={activity.id} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <Text style={styles.activityIconText}>{activity.icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </Surface>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Extra padding to avoid Android navigation buttons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '400',
  },
  profileButton: {
    marginLeft: 16,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006A60',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: cardWidth - 6,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    borderLeftWidth: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickActionsSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ACTION_GAP,
    justifyContent: 'space-between',
  },
  actionTile: {
    width: cardWidth,
    height: 100,
  },
  actionGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32, // Extra bottom padding for Android navigation
  },
  activityItem: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});