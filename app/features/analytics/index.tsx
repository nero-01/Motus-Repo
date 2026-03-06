import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  List,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';

interface AnalyticsData {
  totalRoutines: number;
  completedRoutines: number;
  totalChores: number;
  completedChores: number;
  totalWorksheets: number;
  completedWorksheets: number;
  totalPoints: number;
  averageScore: number;
  weeklyProgress: number;
  monthlyProgress: number;
  streakDays: number;
  mostActiveChild: string;
  mostCompletedActivity: string;
  timeSpentLearning: number;
  timeSpentChores: number;
}

interface ChildStats {
  id: string;
  name: string;
  routinesCompleted: number;
  choresCompleted: number;
  worksheetsCompleted: number;
  pointsEarned: number;
  averageScore: number;
  streakDays: number;
}

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const { currentFamily, children } = useFamilyStore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRoutines: 0,
    completedRoutines: 0,
    totalChores: 0,
    completedChores: 0,
    totalWorksheets: 0,
    completedWorksheets: 0,
    totalPoints: 0,
    averageScore: 0,
    weeklyProgress: 0,
    monthlyProgress: 0,
    streakDays: 0,
    mostActiveChild: '',
    mostCompletedActivity: '',
    timeSpentLearning: 0,
    timeSpentChores: 0,
  });
  const [childStats, setChildStats] = useState<ChildStats[]>([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate loading real data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock analytics data based on children count
      const mockAnalytics: AnalyticsData = {
        totalRoutines: children.length * 5,
        completedRoutines: Math.floor(children.length * 5 * 0.8),
        totalChores: children.length * 8,
        completedChores: Math.floor(children.length * 8 * 0.7),
        totalWorksheets: children.length * 3,
        completedWorksheets: Math.floor(children.length * 3 * 0.9),
        totalPoints: children.length * 150,
        averageScore: 85,
        weeklyProgress: Math.floor(Math.random() * 30) + 70,
        monthlyProgress: Math.floor(Math.random() * 20) + 80,
        streakDays: Math.floor(Math.random() * 7) + 3,
        mostActiveChild: children[0]?.name || 'Emma',
        mostCompletedActivity: 'Morning Routine',
        timeSpentLearning: children.length * 120, // minutes
        timeSpentChores: children.length * 45, // minutes
      };
      
      const mockChildStats: ChildStats[] = children.map((child, index) => ({
        id: child.id,
        name: child.name,
        routinesCompleted: Math.floor(Math.random() * 10) + 5,
        choresCompleted: Math.floor(Math.random() * 15) + 8,
        worksheetsCompleted: Math.floor(Math.random() * 5) + 2,
        pointsEarned: Math.floor(Math.random() * 200) + 100,
        averageScore: Math.floor(Math.random() * 20) + 80,
        streakDays: Math.floor(Math.random() * 7) + 1,
      }));
      
      setAnalyticsData(mockAnalytics);
      setChildStats(mockChildStats);
    } catch (error) {
      if (__DEV__) console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [children]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!currentFamily) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineSmall" style={styles.title}>
          📊 Family Analytics
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Insights and progress tracking for {currentFamily.name}
        </Text>
      </Surface>

      {/* Time Range Selector */}
      <Card style={styles.timeRangeCard}>
        <Card.Content>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        </Card.Content>
      </Card>

      {/* Overview Stats */}
      <Card style={styles.overviewCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Overview
          </Text>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {analyticsData.weeklyProgress}%
              </Text>
              <Text variant="bodySmall">Weekly Progress</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {analyticsData.streakDays}
              </Text>
              <Text variant="bodySmall">Day Streak</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {analyticsData.totalPoints}
              </Text>
              <Text variant="bodySmall">Total Points</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text variant="headlineSmall" style={styles.overviewNumber}>
                {analyticsData.averageScore}%
              </Text>
              <Text variant="bodySmall">Avg Score</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Activity Completion */}
      <Card style={styles.completionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Activity Completion
          </Text>
          
          <View style={styles.completionItem}>
            <View style={styles.completionHeader}>
              <Text variant="bodyMedium">Routines</Text>
              <Text variant="bodyMedium">
                {analyticsData.completedRoutines}/{analyticsData.totalRoutines}
              </Text>
            </View>
            <ProgressBar 
              progress={getCompletionRate(analyticsData.completedRoutines, analyticsData.totalRoutines) / 100} 
              style={styles.progressBar}
              color="#4CAF50"
            />
            <Text variant="bodySmall" style={styles.completionRate}>
              {getCompletionRate(analyticsData.completedRoutines, analyticsData.totalRoutines)}% completed
            </Text>
          </View>
          
          <Divider style={styles.completionDivider} />
          
          <View style={styles.completionItem}>
            <View style={styles.completionHeader}>
              <Text variant="bodyMedium">Chores</Text>
              <Text variant="bodyMedium">
                {analyticsData.completedChores}/{analyticsData.totalChores}
              </Text>
            </View>
            <ProgressBar 
              progress={getCompletionRate(analyticsData.completedChores, analyticsData.totalChores) / 100} 
              style={styles.progressBar}
              color="#FF9800"
            />
            <Text variant="bodySmall" style={styles.completionRate}>
              {getCompletionRate(analyticsData.completedChores, analyticsData.totalChores)}% completed
            </Text>
          </View>
          
          <Divider style={styles.completionDivider} />
          
          <View style={styles.completionItem}>
            <View style={styles.completionHeader}>
              <Text variant="bodyMedium">Worksheets</Text>
              <Text variant="bodyMedium">
                {analyticsData.completedWorksheets}/{analyticsData.totalWorksheets}
              </Text>
            </View>
            <ProgressBar 
              progress={getCompletionRate(analyticsData.completedWorksheets, analyticsData.totalWorksheets) / 100} 
              style={styles.progressBar}
              color="#2196F3"
            />
            <Text variant="bodySmall" style={styles.completionRate}>
              {getCompletionRate(analyticsData.completedWorksheets, analyticsData.totalWorksheets)}% completed
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Time Tracking */}
      <Card style={styles.timeCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Time Spent
          </Text>
          
          <View style={styles.timeGrid}>
            <View style={styles.timeItem}>
              <Text variant="headlineSmall" style={styles.timeNumber}>
                {formatTime(analyticsData.timeSpentLearning)}
              </Text>
              <Text variant="bodySmall">Learning</Text>
            </View>
            <View style={styles.timeItem}>
              <Text variant="headlineSmall" style={styles.timeNumber}>
                {formatTime(analyticsData.timeSpentChores)}
              </Text>
              <Text variant="bodySmall">Chores</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Child Performance */}
      <Card style={styles.childrenCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Child Performance
          </Text>
          
          {childStats.map((child, index) => (
            <React.Fragment key={child.id}>
              <List.Item
                title={child.name}
                description={`${child.pointsEarned} points • ${child.averageScore}% avg score`}
                left={() => (
                  <View style={styles.childStats}>
                    <Text variant="titleMedium" style={styles.childStatNumber}>
                      {child.routinesCompleted + child.choresCompleted + child.worksheetsCompleted}
                    </Text>
                    <Text variant="bodySmall">Activities</Text>
                  </View>
                )}
                right={() => (
                  <Chip mode="flat" style={styles.streakChip}>
                    🔥 {child.streakDays} days
                  </Chip>
                )}
              />
              {index < childStats.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card.Content>
      </Card>

      {/* Insights */}
      <Card style={styles.insightsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Insights
          </Text>
          
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightTitle}>
              Most Active Child
            </Text>
            <Text variant="bodySmall" style={styles.insightText}>
              {analyticsData.mostActiveChild} has been the most active this week
            </Text>
          </View>
          
          <Divider style={styles.insightDivider} />
          
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightTitle}>
              Most Completed Activity
            </Text>
            <Text variant="bodySmall" style={styles.insightText}>
              {analyticsData.mostCompletedActivity} is the most completed activity
            </Text>
          </View>
          
          <Divider style={styles.insightDivider} />
          
          <View style={styles.insightItem}>
            <Text variant="bodyMedium" style={styles.insightTitle}>
              Current Streak
            </Text>
            <Text variant="bodySmall" style={styles.insightText}>
              Family has maintained a {analyticsData.streakDays}-day activity streak
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  timeRangeCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  overviewCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  completionCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  completionItem: {
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  completionRate: {
    marginTop: 4,
    color: '#666',
  },
  completionDivider: {
    marginVertical: 16,
  },
  timeCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  childrenCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  childStats: {
    alignItems: 'center',
    marginRight: 16,
  },
  childStatNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  streakChip: {
    alignSelf: 'center',
  },
  insightsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
  },
  insightItem: {
    marginBottom: 16,
  },
  insightTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    color: '#666',
  },
  insightDivider: {
    marginVertical: 16,
  },
}); 