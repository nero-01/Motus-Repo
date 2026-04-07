import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button, Surface, Chip, Avatar, List, Divider } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { getGreeting } from '../../utils/greeting';
import { useAuthStore } from '../../src/modules/auth/store/authStore';

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

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Dashboard: Loading data...');
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
          title: 'Morning Routine Completed',
          description: 'Emma finished her morning routine',
          time: '2 hours ago',
          icon: '☀️',
          color: '#4CAF50',
        },
        {
          id: '2',
          type: 'meal',
          title: 'Lunch Planned',
          description: 'Added chicken sandwich to meal plan',
          time: '4 hours ago',
          icon: '🍽️',
          color: '#FF9800',
        },
        {
          id: '3',
          type: 'education',
          title: 'Math Worksheet Completed',
          description: 'Emma finished addition worksheet',
          time: '6 hours ago',
          icon: '📚',
          color: '#2196F3',
        },
        {
          id: '4',
          type: 'message',
          title: 'New Message from Co-Parent',
          description: 'Sarah sent a message about weekend plans',
          time: '1 day ago',
          icon: '💬',
          color: '#9C27B0',
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'routine': return '🔄';
      case 'meal': return '🍽️';
      case 'education': return '📚';
      case 'message': return '💬';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting().message} {getGreeting().icon}</Text>
              <Text style={styles.subtitle}>Here's your family's progress today</Text>
            </View>
            <Button
              mode="outlined"
              onPress={handleSignOut}
              style={styles.signOutButton}
              textColor="#ffffff"
            >
              Sign Out
            </Button>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.routinesCompleted}</Text>
              <Text style={styles.statLabel}>Routines Completed</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.routinesRemaining}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.weeklyProgress}%</Text>
              <Text style={styles.statLabel}>Weekly Progress</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statNumber}>{stats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Weekly Progress</Text>
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
            <Text style={styles.progressText}>
              {stats.weeklyProgress}% of weekly goals completed
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/activities/index')}
              style={styles.actionButton}
              icon="plus"
            >
              New Activity
            </Button>
            
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/education/index')}
              style={styles.actionButton}
              icon="book"
            >
              Education
            </Button>
            
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/reminders/index')}
              style={styles.actionButton}
              icon="bell"
            >
              Reminders
            </Button>
            
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/profile/index')}
              style={styles.actionButton}
              icon="account"
            >
              Profile
            </Button>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {recentActivities.map((activity, index) => (
            <Card key={activity.id} style={styles.activityCard}>
              <Card.Content>
                <View style={styles.activityHeader}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityIconText}>{activity.icon}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Family Overview */}
        <Card style={styles.familyCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Family Overview</Text>
            <View style={styles.familyStats}>
              <View style={styles.familyStat}>
                <Text style={styles.familyStatNumber}>1</Text>
                <Text style={styles.familyStatLabel}>Child</Text>
              </View>
              <View style={styles.familyStat}>
                <Text style={styles.familyStatNumber}>{stats.activeRoutines}</Text>
                <Text style={styles.familyStatLabel}>Active Routines</Text>
              </View>
              <View style={styles.familyStat}>
                <Text style={styles.familyStatNumber}>{stats.mealsPlanned}</Text>
                <Text style={styles.familyStatLabel}>Meals Planned</Text>
              </View>
              <View style={styles.familyStat}>
                <Text style={styles.familyStatNumber}>{stats.worksheetsAvailable}</Text>
                <Text style={styles.familyStatLabel}>Worksheets</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#006A60',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  signOutButton: {
    borderColor: '#ffffff',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006A60',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressCard: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  recentActivityContainer: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  familyCard: {
    margin: 16,
    marginTop: 0,
  },
  familyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  familyStat: {
    alignItems: 'center',
  },
  familyStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006A60',
  },
  familyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 