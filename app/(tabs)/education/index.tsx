import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  Avatar,
  FAB,
  Searchbar,
  SegmentedButtons,
  ProgressBar,
  Portal,
  Dialog,
} from 'react-native-paper';
import { router } from 'expo-router';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';

interface Worksheet {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  age_range: string;
  estimated_time: number;
  type: string;
  content?: any;
  image_url?: string;
}

const SUPPORTED_WORKSHEET_TYPES = new Set([
  'letter_tracing',
  'color_mixing',
  'animal_habitats',
  'community_helpers',
]);

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'math', label: 'Math' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'science', label: 'Science' },
    { value: 'art', label: 'Art' },
    { value: 'social_studies', label: 'Social Studies' },
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: '1', label: 'Level 1' },
    { value: '2', label: 'Level 2' },
    { value: '3', label: 'Level 3' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Education: Loading data...');
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockWorksheets: Worksheet[] = [
        {
          id: '1',
          title: 'Letter Tracing - ABC',
          description: 'Practice tracing uppercase and lowercase letters',
          category: 'writing',
          difficulty: 1,
          age_range: '3-5',
          estimated_time: 10,
          type: 'letter_tracing',
          content: {
            letters: ['A', 'B', 'C', 'D', 'E'],
            instructions: 'Trace each letter carefully'
          }
        },
        {
          id: '2',
          title: 'Color Mixing Fun',
          description: 'Learn about primary and secondary colors',
          category: 'art',
          difficulty: 1,
          age_range: '4-6',
          estimated_time: 15,
          type: 'color_mixing',
          content: {
            colors: ['red', 'blue', 'yellow'],
            instructions: 'Mix colors to create new ones'
          }
        },
        {
          id: '3',
          title: 'Animal Habitats',
          description: 'Learn where different animals live',
          category: 'science',
          difficulty: 2,
          age_range: '5-7',
          estimated_time: 12,
          type: 'animal_habitats',
          content: {
            animals: ['lion', 'fish', 'bird', 'bear'],
            instructions: 'Match animals to their habitats'
          }
        },
        {
          id: '4',
          title: 'Community Helpers',
          description: 'Learn about people who help our community',
          category: 'social_studies',
          difficulty: 2,
          age_range: '4-6',
          estimated_time: 10,
          type: 'community_helpers',
          content: {
            helpers: ['doctor', 'teacher', 'firefighter', 'police'],
            instructions: 'Match helpers to their tools'
          }
        },
        {
          id: '5',
          title: 'Simple Addition',
          description: 'Practice adding numbers 1-10',
          category: 'math',
          difficulty: 1,
          age_range: '5-7',
          estimated_time: 8,
          type: 'math',
          content: {
            problems: ['1+2', '3+4', '5+1', '2+3'],
            instructions: 'Solve the addition problems'
          }
        },
        {
          id: '6',
          title: 'Sight Words',
          description: 'Learn common sight words',
          category: 'reading',
          difficulty: 1,
          age_range: '4-6',
          estimated_time: 10,
          type: 'reading',
          content: {
            words: ['the', 'and', 'is', 'in', 'it'],
            instructions: 'Read and recognize these words'
          }
        }
      ];

      const mockStats: EducationStats = {
        totalWorksheets: 6,
        averageScore: 85,
        totalTimeSpent: 45,
        totalMistakes: 8,
        thisWeekWorksheets: 3,
        thisWeekTimeSpent: 25,
        currentLevel: 2,
      };

      setWorksheets(mockWorksheets);
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

  const openWorksheetModal = (worksheet: Worksheet) => {
    setSelectedWorksheet(worksheet);
    setModalVisible(true);
  };

  const closeWorksheetModal = () => {
    setModalVisible(false);
    setSelectedWorksheet(null);
  };

  const startWorksheet = () => {
    if (!selectedWorksheet) return;

    const worksheetToStart = selectedWorksheet;
    closeWorksheetModal();

    if (!SUPPORTED_WORKSHEET_TYPES.has(worksheetToStart.type)) {
      Alert.alert(
        'Worksheet coming soon',
        `${worksheetToStart.title} is not interactive yet. Please try one of the interactive worksheets.`
      );
      return;
    }

    router.push({
      pathname: '/features/worksheets',
      params: { type: worksheetToStart.type },
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
          <Text style={styles.title}>📚 Education Hub</Text>
          <Text style={styles.subtitle}>Fun learning activities for your child</Text>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.totalWorksheets}</Text>
                <Text style={styles.statLabel}>Worksheets</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.averageScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.thisWeekWorksheets}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content>
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
          
          <View style={styles.filterButtons}>
            <SegmentedButtons
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              buttons={categories}
              style={styles.categoryFilter}
            />
            
            <SegmentedButtons
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
              buttons={difficulties}
              style={styles.difficultyFilter}
            />
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
                      <Chip mode="outlined" style={styles.metaChip}>
                        {worksheet.age_range} years
                      </Chip>
                      <Chip mode="outlined" style={styles.metaChip}>
                        {getDifficultyStars(worksheet.difficulty)}
                      </Chip>
                      <Chip mode="outlined" style={styles.metaChip}>
                        {worksheet.estimated_time} min
                      </Chip>
                    </View>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => openWorksheetModal(worksheet)}
                  style={styles.startButton}
                >
                  Start Worksheet
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
              onPress={() =>
                router.push({
                  pathname: '/features/worksheets',
                  params: { type: 'letter_tracing' },
                })
              }
              style={styles.quickButton}
              icon="pencil"
            >
              Letter Tracing
            </Button>
            
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: '/features/worksheets',
                  params: { type: 'color_mixing' },
                })
              }
              style={styles.quickButton}
              icon="palette"
            >
              Color Mixing
            </Button>
            
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: '/features/worksheets',
                  params: { type: 'animal_habitats' },
                })
              }
              style={styles.quickButton}
              icon="paw"
            >
              Animal Habitats
            </Button>
            
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: '/features/worksheets',
                  params: { type: 'community_helpers' },
                })
              }
              style={styles.quickButton}
              icon="account-group"
            >
              Community Helpers
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Worksheet Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeWorksheetModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedWorksheet && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedWorksheet.title}</Text>
                    <TouchableOpacity onPress={closeWorksheetModal}>
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody}>
                    <Text style={styles.modalDescription}>
                      {selectedWorksheet.description}
                    </Text>
                    
                    <View style={styles.modalMeta}>
                      <Chip mode="outlined">Age: {selectedWorksheet.age_range}</Chip>
                      <Chip mode="outlined">Time: {selectedWorksheet.estimated_time} min</Chip>
                      <Chip mode="outlined">Level: {getDifficultyStars(selectedWorksheet.difficulty)}</Chip>
                    </View>
                    
                    <Text style={styles.modalInstructions}>
                      This worksheet will help your child develop important skills in a fun and engaging way.
                    </Text>
                  </ScrollView>
                  
                  <View style={styles.modalActions}>
                    <Button mode="outlined" onPress={closeWorksheetModal} style={styles.modalButton}>
                      Cancel
                    </Button>
                    <Button mode="contained" onPress={startWorksheet} style={styles.modalButton}>
                      Start Now
                    </Button>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </Portal>
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
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
    flexShrink: 1,
  },
  searchBar: {
    marginBottom: 16,
    flexShrink: 1,
  },
  filterButtons: {
    gap: 12,
  },
  categoryFilter: {
    marginBottom: 8,
    flexShrink: 1,
  },
  difficultyFilter: {
    marginBottom: 8,
    flexShrink: 1,
  },
  worksheetsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  worksheetCard: {
    marginBottom: 12,
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
    flexShrink: 1,
  },
  worksheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  worksheetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  worksheetMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalInstructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
}); 