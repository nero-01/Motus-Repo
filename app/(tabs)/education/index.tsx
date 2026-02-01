import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { router } from 'expo-router';
import { WORKSHEETS, type Worksheet } from './worksheetsData';

interface EducationStats {
  totalWorksheets: number;
  averageScore: number;
  totalTimeSpent: number;
  totalMistakes: number;
  thisWeekWorksheets: number;
  thisWeekTimeSpent: number;
  currentLevel: number;
}

export default function EducationScreen() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [stats, setStats] = useState<EducationStats | null>(null);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'math', label: 'Math' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'science', label: 'Science' },
    { value: 'art', label: 'Art' },
    { value: 'social_studies', label: 'Social' },
  ];

  const difficulties = [
    { value: 'all', label: 'All' },
    { value: '1', label: 'Level 1' },
    { value: '2', label: 'Level 2' },
    { value: '3', label: 'Level 3' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Education: Loading data...');
      
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockStats: EducationStats = {
        totalWorksheets: 6,
        averageScore: 85,
        totalTimeSpent: 45,
        totalMistakes: 8,
        thisWeekWorksheets: 3,
        thisWeekTimeSpent: 25,
        currentLevel: 2,
      };

      setWorksheets(WORKSHEETS);
      setStats(mockStats);
      console.log('Education: Data loaded successfully');
    } catch (error) {
      console.error('Education: Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredWorksheets = worksheets.filter(worksheet => {
    const matchesSearch = worksheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worksheet.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || worksheet.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || worksheet.difficulty.toString() === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math': return '🔢';
      case 'reading': return '📖';
      case 'writing': return '✏️';
      case 'science': return '🔬';
      case 'art': return '🎨';
      case 'social_studies': return '🌍';
      default: return '📚';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'math': return '#FF6B6B';
      case 'reading': return '#4ECDC4';
      case 'writing': return '#45B7D1';
      case 'science': return '#96CEB4';
      case 'art': return '#FFEAA7';
      case 'social_studies': return '#DDA0DD';
      default: return '#95A5A6';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty);
  };

  const openWorksheet = (worksheet: Worksheet) => {
    router.push({
      pathname: '/education/worksheet',
      params: { id: worksheet.id, _t: String(Date.now()) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading worksheets...</Text>
      </View>
    );
  }

  const renderFilterChips = (
    items: { value: string; label: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChipRow}
    >
      {items.map((item) => {
        const isActive = item.value === selectedValue;
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={() => onSelect(item.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📚 Education Hub</Text>
          <Text style={styles.subtitle}>Fun learning activities for your child</Text>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.totalWorksheets}</Text>
                <Text style={styles.statLabel}>Worksheets</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.averageScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.thisWeekWorksheets}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>Level {stats.currentLevel}</Text>
                <Text style={styles.statLabel}>Current Level</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search worksheets..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            {renderFilterChips(categories, selectedCategory, setSelectedCategory)}
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Difficulty</Text>
            {renderFilterChips(difficulties, selectedDifficulty, setSelectedDifficulty)}
          </View>
        </View>

        {/* Worksheets Grid */}
        <View style={styles.worksheetsContainer}>
          <Text style={styles.sectionTitle}>
            Available Worksheets ({filteredWorksheets.length})
          </Text>
          
          {filteredWorksheets.map((worksheet) => (
            <Card key={worksheet.id} style={styles.worksheetCard}>
              <Card.Content>
                <View style={styles.worksheetHeader}>
                  <View style={[
                    styles.categoryIcon, 
                    { backgroundColor: getCategoryColor(worksheet.category) }
                  ]}>
                    <Text style={styles.categoryIconText}>
                      {getCategoryIcon(worksheet.category)}
                    </Text>
                  </View>
                  <View style={styles.worksheetInfo}>
                    <Text style={styles.worksheetTitle}>{worksheet.title}</Text>
                    <Text style={styles.worksheetDescription}>{worksheet.description}</Text>
                    <View style={styles.worksheetMeta}>
                      <Chip mode="outlined" style={styles.metaChip} compact>
                        {worksheet.age_range} years
                      </Chip>
                      <Chip mode="outlined" style={styles.metaChip} compact>
                        {getDifficultyStars(worksheet.difficulty)}
                      </Chip>
                      <Chip mode="outlined" style={styles.metaChip} compact>
                        {worksheet.estimated_time} min
                      </Chip>
                    </View>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => openWorksheet(worksheet)}
                  style={styles.startButton}
                  compact
                >
                  Start
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          <View style={styles.quickAccessButtons}>
            <Button
              mode="contained"
              onPress={() => {
                const w = worksheets.find(ws => ws.type === 'letter_tracing');
                if (w) openWorksheet(w); else Alert.alert('Letter Tracing', 'Worksheet not found.');
              }}
              style={styles.quickButton}
              icon="pencil"
              compact
            >
              Letter Tracing
            </Button>
            
            <Button
              mode="contained"
              onPress={() => {
                const w = worksheets.find(ws => ws.type === 'color_mixing');
                if (w) openWorksheet(w); else Alert.alert('Color Mixing', 'Worksheet not found.');
              }}
              style={styles.quickButton}
              icon="palette"
              compact
            >
              Color Mixing
            </Button>
            
            <Button
              mode="contained"
              onPress={() => {
                const w = worksheets.find(ws => ws.type === 'animal_habitats');
                if (w) openWorksheet(w); else Alert.alert('Animal Habitats', 'Worksheet not found.');
              }}
              style={styles.quickButton}
              icon="paw"
              compact
            >
              Animal Habitats
            </Button>
            
            <Button
              mode="contained"
              onPress={() => {
                const w = worksheets.find(ws => ws.type === 'community_helpers');
                if (w) openWorksheet(w); else Alert.alert('Community Helpers', 'Worksheet not found.');
              }}
              style={styles.quickButton}
              icon="account-group"
              compact
            >
              Community Helpers
            </Button>
          </View>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006A60',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    borderColor: '#006A60',
    backgroundColor: 'rgba(0, 106, 96, 0.1)',
  },
  filterChipText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#006A60',
  },
  worksheetsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  worksheetCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  worksheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 24,
  },
  worksheetInfo: {
    flex: 1,
  },
  worksheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  worksheetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  worksheetMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaChip: {
    marginRight: 4,
  },
  startButton: {
    marginTop: 8,
  },
  quickAccessContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
}); 