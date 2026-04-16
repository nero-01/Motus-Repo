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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Button,
  Chip,
  Searchbar,
  SegmentedButtons,
  Portal,
} from 'react-native-paper';
import { router } from 'expo-router';

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
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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

  const padL = 16 + insets.left;
  const padR = 16 + insets.right;
  const contentWidth = Math.max(0, windowWidth - padL - padR);
  const statGap = 8;
  const statsRowPadding = 16;
  const statCardWidth = Math.max(0, (contentWidth - statsRowPadding * 2 - statGap) / 2);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingLeft: padL, paddingRight: padR }]}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading worksheets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingLeft: padL,
            paddingRight: padR,
            paddingBottom: 24 + insets.bottom,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header — edge-to-edge background; text aligns with scroll padding */}
        <View
          style={[
            styles.header,
            {
              marginLeft: -padL,
              marginRight: -padR,
              paddingLeft: padL,
              paddingRight: padR,
            },
          ]}
        >
          <Text style={styles.title}>📚 Education Hub</Text>
          <Text style={styles.subtitle}>Fun learning activities for your child</Text>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, { width: statCardWidth, maxWidth: '100%' }]}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.totalWorksheets}</Text>
                <Text style={styles.statLabel}>Worksheets</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { width: statCardWidth, maxWidth: '100%' }]}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.averageScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { width: statCardWidth, maxWidth: '100%' }]}>
              <Card.Content>
                <Text style={styles.statNumber}>{stats.thisWeekWorksheets}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { width: statCardWidth, maxWidth: '100%' }]}>
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
            style={[styles.searchBar, { width: '100%', maxWidth: '100%' }]}
            inputStyle={styles.searchBarInput}
          />
          
          <View style={styles.filterButtons}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator
              style={styles.segmentedScrollView}
              contentContainerStyle={styles.segmentedScrollContent}
            >
              <SegmentedButtons
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                buttons={categories}
                style={styles.segmentedRow}
              />
            </ScrollView>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator
              style={styles.segmentedScrollView}
              contentContainerStyle={styles.segmentedScrollContent}
            >
              <SegmentedButtons
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
                buttons={difficulties}
                style={styles.segmentedRow}
              />
            </ScrollView>
          </View>
        </View>

        {/* Worksheets Grid */}
        <View style={styles.worksheetsContainer}>
          <Text style={styles.sectionTitle}>
            Available Worksheets ({filteredWorksheets.length})
          </Text>
          
          {filteredWorksheets.map((worksheet) => (
            <Card key={worksheet.id} style={styles.worksheetCard}>
              <Card.Content style={styles.cardContent}>
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
                      <Chip mode="outlined" compact style={styles.metaChip}>
                        {worksheet.age_range} years
                      </Chip>
                      <Chip mode="outlined" compact style={styles.metaChip}>
                        {getDifficultyStars(worksheet.difficulty)}
                      </Chip>
                      <Chip mode="outlined" compact style={styles.metaChip}>
                        {worksheet.estimated_time} min
                      </Chip>
                    </View>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained" 
                  onPress={() => openWorksheetModal(worksheet)}
                  style={styles.startButton}
                  contentStyle={styles.startButtonContent}
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
              contentStyle={styles.quickButtonContent}
              labelStyle={styles.quickButtonLabel}
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
              contentStyle={styles.quickButtonContent}
              labelStyle={styles.quickButtonLabel}
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
              contentStyle={styles.quickButtonContent}
              labelStyle={styles.quickButtonLabel}
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
              contentStyle={styles.quickButtonContent}
              labelStyle={styles.quickButtonLabel}
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
            <View style={[styles.modalContent, { maxWidth: Math.min(windowWidth - 24, 400) }]}>
              {selectedWorksheet && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleWrap}>
                      <Text style={styles.modalTitle}>{selectedWorksheet.title}</Text>
                    </View>
                    <TouchableOpacity onPress={closeWorksheetModal} style={styles.closeHit} hitSlop={12}>
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    nestedScrollEnabled
                  >
                    <Text style={styles.modalDescription}>
                      {selectedWorksheet.description}
                    </Text>
                    
                    <View style={styles.modalMeta}>
                      <Chip mode="outlined" compact style={styles.modalMetaChip}>
                        Age: {selectedWorksheet.age_range}
                      </Chip>
                      <Chip mode="outlined" compact style={styles.modalMetaChip}>
                        Time: {selectedWorksheet.estimated_time} min
                      </Chip>
                      <Chip mode="outlined" compact style={styles.modalMetaChip}>
                        Level: {getDifficultyStars(selectedWorksheet.difficulty)}
                      </Chip>
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
  scrollContent: {
    flexGrow: 1,
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
    textAlign: 'center',
    paddingHorizontal: 24,
    flexShrink: 1,
  },
  header: {
    backgroundColor: '#006A60',
    paddingTop: 12,
    paddingBottom: 20,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    maxWidth: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  statCard: {
    minWidth: 0,
    marginBottom: 8,
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006A60',
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  filtersContainer: {
    paddingTop: 8,
    paddingBottom: 0,
    flexShrink: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  searchBar: {
    marginBottom: 16,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  searchBarInput: {
    flexWrap: 'wrap',
  },
  filterButtons: {
    gap: 12,
  },
  segmentedScrollView: {
    width: '100%',
    maxWidth: '100%',
    flexGrow: 0,
    overflow: 'hidden',
  },
  segmentedScrollContent: {
    flexGrow: 0,
    paddingRight: 4,
    paddingBottom: 4,
    alignItems: 'center',
  },
  segmentedRow: {
    flexGrow: 0,
    alignSelf: 'flex-start',
  },
  worksheetsContainer: {
    paddingTop: 8,
    paddingBottom: 0,
    alignSelf: 'stretch',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  worksheetCard: {
    marginBottom: 12,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  cardContent: {
    overflow: 'hidden',
    maxWidth: '100%',
  },
  worksheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  categoryIconText: {
    fontSize: 24,
  },
  worksheetInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  worksheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  worksheetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  worksheetMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    maxWidth: '100%',
  },
  metaChip: {
    marginRight: 4,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  startButton: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
  startButtonContent: {
    flexWrap: 'wrap',
  },
  quickAccessContainer: {
    paddingTop: 8,
    alignSelf: 'stretch',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  quickAccessButtons: {
    flexDirection: 'column',
    gap: 10,
    maxWidth: '100%',
    width: '100%',
  },
  quickButton: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 0,
    alignSelf: 'stretch',
  },
  quickButtonContent: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickButtonLabel: {
    textAlign: 'center',
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  modalTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  closeHit: {
    flexShrink: 0,
    padding: 4,
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    maxHeight: 320,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  modalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    maxWidth: '100%',
  },
  modalMetaChip: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  modalInstructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flexShrink: 1,
    width: '100%',
    maxWidth: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
    alignItems: 'stretch',
  },
  modalButton: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
  },
}); 