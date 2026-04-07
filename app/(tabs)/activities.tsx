import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { ActivityIndicator, Chip, Searchbar, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { ActivityService } from '../../src/modules/activities/services/activityService';
import { Activity, ActivityFilter, ActivityStats } from '../../src/modules/activities/types';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilter>({});
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'completed'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Activities: Loading data...');
      
      const [activitiesData, statsData] = await Promise.all([
        ActivityService.getActivities(),
        ActivityService.getActivityStats(),
      ]);
      
      setActivities(activitiesData);
      setFilteredActivities(activitiesData);
      setStats(statsData);
      console.log('Activities: Data loaded successfully');
    } catch (error) {
      console.error('Activities: Error loading data:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, selectedFilter, activeTab]);

  const filterActivities = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'favorites':
        filtered = filtered.filter(activity => activity.isFavorite);
        break;
      case 'completed':
        filtered = filtered.filter(activity => activity.isCompleted);
        break;
    }

    // Apply additional filters
    if (selectedFilter.type?.length) {
      filtered = filtered.filter(activity => selectedFilter.type!.includes(activity.type));
    }

    if (selectedFilter.category?.length) {
      filtered = filtered.filter(activity => selectedFilter.category!.includes(activity.category));
    }

    if (selectedFilter.difficulty?.length) {
      filtered = filtered.filter(activity => selectedFilter.difficulty!.includes(activity.difficulty));
    }

    setFilteredActivities(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActivityPress = (activity: Activity) => {
    Alert.alert(
      'Activity Details',
      `Viewing details for: ${activity.title}`,
      [
        { text: 'OK' },
        { 
          text: 'Start Activity', 
          onPress: () => handleStartActivity(activity) 
        }
      ]
    );
  };

  const handleToggleFavorite = async (activityId: string) => {
    try {
      await ActivityService.toggleFavorite(activityId);
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, isFavorite: !activity.isFavorite }
            : activity
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  };

  const handleStartActivity = async (activity: Activity) => {
    try {
      await ActivityService.startActivitySession(activity.id);
      Alert.alert(
        'Activity Started!',
        `You've started: ${activity.title}`,
        [
          { 
            text: 'Continue', 
            onPress: () => {
              // Here you would typically navigate to the activity session
              // For now, we'll just show a success message
              Alert.alert('Great!', 'Activity session is now active. Track your progress!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error starting activity:', error);
      Alert.alert('Error', 'Failed to start activity session.');
    }
  };

  const renderActivityCard = ({ item: activity }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => handleActivityPress(activity)}
    >
      <View style={styles.activityHeader}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(activity.id)}
        >
          <Text style={[styles.favoriteIcon, activity.isFavorite && styles.favoriteActive]}>
            {activity.isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityMeta}>
        <Chip icon="clock" style={styles.chip}>
          {activity.duration} min
        </Chip>
        <Chip icon="star" style={styles.chip}>
          {activity.difficulty}
        </Chip>
        <Chip icon="account-group" style={styles.chip}>
          {activity.ageRange}
        </Chip>
      </View>

      <View style={styles.activityTags}>
        {activity.tags.slice(0, 3).map((tag, index) => (
          <Chip key={index} compact style={styles.tagChip}>
            {tag}
          </Chip>
        ))}
      </View>

      <View style={styles.activityActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.startButton]}
          onPress={() => handleStartActivity(activity)}
        >
          <Text style={styles.startButtonText}>Start Activity</Text>
        </TouchableOpacity>
        
        {activity.isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Completed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.favoriteActivities}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalTimeSpent}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFilterChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      <Chip
        selected={activeTab === 'all'}
        onPress={() => setActiveTab('all')}
        style={styles.filterChip}
      >
        All Activities
      </Chip>
      <Chip
        selected={activeTab === 'favorites'}
        onPress={() => setActiveTab('favorites')}
        style={styles.filterChip}
      >
        Favorites
      </Chip>
      <Chip
        selected={activeTab === 'completed'}
        onPress={() => setActiveTab('completed')}
        style={styles.filterChip}
      >
        Completed
      </Chip>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Activities Hub</Text>
        <Text style={styles.subtitle}>
          Discover fun and educational activities for your child
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCard()}
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search activities..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {renderFilterChips()}

        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'all' && 'All Activities'}
            {activeTab === 'favorites' && 'Favorite Activities'}
            {activeTab === 'completed' && 'Completed Activities'}
            {' '}({filteredActivities.length})
          </Text>

          {filteredActivities.length > 0 ? (
            <FlatList
              data={filteredActivities}
              renderItem={renderActivityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.activitiesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>No activities found</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start by exploring different categories'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Coming Soon', 'Activity creation feature will be available soon!')}
        label="New Activity"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006A60',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
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
  statsCard: {
    margin: 20,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    borderRadius: 8,
    elevation: 1,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  activitiesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  favoriteActive: {
    color: '#e91e63',
  },
  activityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#f0f0f0',
  },
  activityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#e3f2fd',
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  startButton: {
    backgroundColor: '#006A60',
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#006A60',
  },
}); 