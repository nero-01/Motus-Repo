import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';
import { getChoresByFamily, completeChore, assignChore, ChoreWithAssignment } from '../../../services/supabase/chores';

export default React.memo(function ChoresScreen() {
  const { user } = useAuthStore();
  const { currentFamily, children } = useFamilyStore();
  const [chores, setChores] = useState<ChoreWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedChore, setSelectedChore] = useState<ChoreWithAssignment | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const loadChores = useCallback(async () => {
    try {
      setError(null);
      if (!currentFamily) {
        setChores([]);
        return;
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const choresPromise = getChoresByFamily(currentFamily.id);
      const data = await Promise.race([choresPromise, timeoutPromise]) as any;
      setChores(data || []);
    } catch (err) {
      if (__DEV__) console.error('Error loading chores:', err);
      setError('Failed to load chores. Using demo data.');
      // Fallback to mock data for demo
      setChores([
        {
          id: '1',
          family_id: currentFamily?.id || '',
          title: 'Make Bed',
          description: 'Straighten sheets and fluff pillows',
          category: 'cleaning',
          difficulty: 1,
          points: 5,
          is_recurring: true,
          is_active: true,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          assignment: {
            id: '1',
            chore_id: '1',
            child_id: '1',
            assigned_by: user?.id || '',
            assigned_at: new Date().toISOString(),
            points_earned: 0,
          },
          child: {
            id: '1',
            name: children[0]?.name || 'Emma',
            avatar_url: children[0]?.avatar_url,
          },
        },
        {
          id: '2',
          family_id: currentFamily?.id || '',
          title: 'Clean Room',
          description: 'Put away toys and organize desk',
          category: 'cleaning',
          difficulty: 3,
          points: 10,
          is_recurring: true,
          is_active: true,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          assignment: {
            id: '2',
            chore_id: '2',
            child_id: '2',
            assigned_by: user?.id || '',
            assigned_at: new Date().toISOString(),
            points_earned: 0,
          },
          child: {
            id: '2',
            name: children[1]?.name || 'Liam',
            avatar_url: children[1]?.avatar_url,
          },
        },
        {
          id: '3',
          family_id: currentFamily?.id || '',
          title: 'Set Table',
          description: 'Help prepare dinner table',
          category: 'dishes',
          difficulty: 1,
          points: 3,
          is_recurring: true,
          is_active: true,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          family_id: currentFamily?.id || '',
          title: 'Take Out Trash',
          description: 'Empty bedroom trash can',
          category: 'cleaning',
          difficulty: 2,
          points: 8,
          is_recurring: false,
          is_active: true,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
        },
        {
          id: '5',
          family_id: currentFamily?.id || '',
          title: 'Water Plants',
          description: 'Water indoor plants',
          category: 'garden',
          difficulty: 1,
          points: 4,
          is_recurring: true,
          is_active: true,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFamily, user?.id, children]);

  useEffect(() => {
    loadChores();
  }, [currentFamily, loadChores]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChores();
  }, [loadChores]);

  const handleCompleteChore = useCallback(async (choreId: string, childId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      await completeChore({ 
        choreId, 
        childId, 
        completedBy: user.id,
        notes: 'Completed via app'
      });
      Alert.alert('Success', 'Chore completed! Points earned!');
      loadChores(); // Refresh the list
    } catch (err) {
      if (__DEV__) console.error('Error completing chore:', err);
      Alert.alert('Error', 'Failed to complete chore. Please try again.');
    }
  }, [user?.id, loadChores]);

  const handleAssignChore = useCallback(async () => {
    if (!selectedChore || !selectedChildId || !user?.id) return;
    
    try {
      await assignChore({ 
        choreId: selectedChore.id, 
        childId: selectedChildId,
        assignedBy: user.id,
      });
      setAssignModalVisible(false);
      setSelectedChore(null);
      setSelectedChildId('');
      Alert.alert('Success', 'Chore assigned successfully!');
      loadChores(); // Refresh the list
    } catch (err) {
      if (__DEV__) console.error('Error assigning chore:', err);
      Alert.alert('Error', 'Failed to assign chore. Please try again.');
    }
  }, [selectedChore, selectedChildId, user?.id, loadChores]);

  const getDifficultyColor = useCallback((difficulty: number) => {
    const colors = {
      1: '#4CAF50',
      2: '#8BC34A',
      3: '#FFC107',
      4: '#FF9800',
      5: '#F44336',
    };
    return colors[difficulty as keyof typeof colors] || '#757575';
  }, []);

  const getCategoryIcon = useCallback((category: string) => {
    const icons = {
      cleaning: '🧹',
      dishes: '🍽️',
      laundry: '👕',
      garden: '🌱',
      pet_care: '🐕',
      homework: '📚',
      other: '📋',
    };
    return icons[category as keyof typeof icons] || '📋';
  }, []);

  const getChildName = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown';
  }, [children]);

  const getChildAvatar = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.avatar_url || undefined;
  }, [children]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading chores...</Text>
      </View>
    );
  }

  if (error && chores.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadChores} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Family Chores
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage and track household tasks
          </Text>
        </View>

        {chores.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No chores yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Create your first chore to get started!
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/features/chores/create')}
                style={styles.createButton}
              >
                Create Chore
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.choresContainer}>
            {chores.map((chore) => (
              <Card key={chore.id} style={styles.choreCard}>
                <Card.Content>
                  <View style={styles.choreHeader}>
                    <View style={styles.choreInfo}>
                      <Text variant="titleMedium" style={styles.choreTitle}>
                        {chore.title}
                      </Text>
                      {chore.description && (
                        <Text variant="bodySmall" style={styles.choreDescription}>
                          {chore.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.choreMeta}>
                      <Chip
                        style={[
                          styles.difficultyChip,
                          { backgroundColor: getDifficultyColor(chore.difficulty) }
                        ]}
                        textStyle={styles.difficultyText}
                      >
                        {chore.difficulty}/5
                      </Chip>
                      <Text variant="bodySmall" style={styles.pointsText}>
                        {chore.points} pts
                      </Text>
                    </View>
                  </View>

                  <View style={styles.choreDetails}>
                    <Chip style={styles.categoryChip}>
                      {getCategoryIcon(chore.category)} {chore.category}
                    </Chip>
                    {chore.is_recurring && (
                      <Chip style={styles.recurringChip}>
                        🔄 Recurring
                      </Chip>
                    )}
                  </View>

                  {chore.assignment ? (
                    <View style={styles.assignmentInfo}>
                      <View style={styles.assignedTo}>
                        <Avatar.Text size={32} label={getChildAvatar(chore.assignment.child_id) || '👤'} />
                        <Text variant="bodyMedium" style={styles.assignedText}>
                          Assigned to {getChildName(chore.assignment.child_id)}
                        </Text>
                      </View>
                      {!chore.assignment.completed_at && (
                        <Button
                          mode="contained"
                          onPress={() => handleCompleteChore(chore.id, chore.assignment!.child_id)}
                          style={styles.completeButton}
                        >
                          Complete
                        </Button>
                      )}
                      {chore.assignment.completed_at && (
                        <Chip style={styles.completedChip}>
                          ✅ Completed
                        </Chip>
                      )}
                    </View>
                  ) : (
                    <View style={styles.unassignedActions}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setSelectedChore(chore);
                          setAssignModalVisible(true);
                        }}
                        style={styles.assignButton}
                      >
                        Assign
                      </Button>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAssignScroll}>
                        {children.map((child) => (
                          <Chip
                            key={child.id}
                            avatar={<Avatar.Image size={24} source={{ uri: child.avatar_url }} />}
                            onPress={() => {
                              setSelectedChore(chore);
                              setSelectedChildId(child.id);
                              handleAssignChore();
                            }}
                            style={styles.quickAssignChip}
                          >
                            {child.name}
                          </Chip>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={assignModalVisible}
          onDismiss={() => setAssignModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Assign Chore
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            {selectedChore?.title}
          </Text>

          <Text variant="bodyMedium" style={styles.modalLabel}>
            Assign to:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenList}>
            {children.map((child) => (
              <Chip
                key={child.id}
                selected={selectedChildId === child.id}
                onPress={() => setSelectedChildId(child.id)}
                avatar={<Avatar.Image size={24} source={{ uri: child.avatar_url }} />}
                style={styles.childChip}
                textStyle={styles.childChipText}
              >
                {child.name}
              </Chip>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setAssignModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAssignChore}
              style={styles.modalButton}
              disabled={!selectedChildId}
            >
              Assign
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => router.push('/features/chores/create')}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  emptyCard: {
    margin: 20,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 16,
  },
  choresContainer: {
    padding: 20,
  },
  choreCard: {
    marginBottom: 12,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  choreInfo: {
    flex: 1,
    marginRight: 12,
  },
  choreTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  choreDescription: {
    color: '#666',
    lineHeight: 18,
  },
  choreMeta: {
    alignItems: 'flex-end',
  },
  difficultyChip: {
    marginBottom: 8,
  },
  difficultyText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  choreDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  recurringChip: {
    marginRight: 8,
  },
  assignmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedTo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    flex: 1,
    color: '#666',
  },
  completeButton: {
    marginLeft: 8,
  },
  unassignedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignButton: {
    marginLeft: 8,
  },
  completedChip: {
    backgroundColor: '#4CAF50',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  modalLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  childrenList: {
    flexDirection: 'row',
    marginBottom: 20,
    maxHeight: 40,
  },
  childChip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  childChipText: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  quickAssignScroll: {
    marginLeft: 8,
    flexGrow: 0,
    maxHeight: 40,
  },
  quickAssignChip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
  },
}); 