import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button, Checkbox, Chip, Surface } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import {
  getRoutineTasks,
  completeRoutineTask,
  type RoutineTask,
} from '../../../services/supabase/routines';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  points?: number;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  totalPoints: number;
  earnedPoints: number;
}

function parseParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export default function RoutineDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; childId?: string | string[] }>();
  const id = parseParam(params.id);
  const childIdFromUrl = parseParam(params.childId);

  const { user } = useAuthStore();
  const { currentFamily, children, loadFamilies } = useFamilyStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const effectiveChildId = useMemo(() => {
    if (!children.length) return null;
    if (selectedChildId && children.some((c) => c.id === selectedChildId)) {
      return selectedChildId;
    }
    return children[0].id;
  }, [children, selectedChildId]);

  useEffect(() => {
    if (user?.id) {
      void loadFamilies(user.id);
    }
  }, [user?.id, loadFamilies]);

  useEffect(() => {
    if (children.length === 0) {
      setSelectedChildId(null);
      return;
    }
    if (childIdFromUrl && children.some((c) => c.id === childIdFromUrl)) {
      setSelectedChildId(childIdFromUrl);
      return;
    }
    setSelectedChildId((prev) => {
      if (prev && children.some((c) => c.id === prev)) return prev;
      return children[0].id;
    });
  }, [children, childIdFromUrl]);

  const [routine, setRoutine] = useState<Routine>({
    id: (id ?? '') as string,
    name: 'Loading...',
    description: 'Loading routine details...',
    tasks: [],
    totalPoints: 0,
    earnedPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutineData = async () => {
      if (!id) {
        setError('Missing routine');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const tasks = await getRoutineTasks(id);
        // For now, we'll use mock routine data since we don't have a getRoutineById function
        // In a real app, you'd fetch the routine details separately
        setRoutine(prev => ({
          ...prev,
          name: 'Morning Routine', // This would come from routine data
          description: 'Start the day with healthy habits',
          tasks: tasks.map((task: RoutineTask) => ({
            id: task.id,
            title: task.name,
            completed: false, // You'd check task_completions table for this
            points: task.points_reward ?? 1,
          })),
          totalPoints: tasks.reduce((sum, task) => sum + (task.points_reward ?? 1), 0),
          earnedPoints: 0, // Calculate from task_completions
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to load routine tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutineData();
  }, [id]);

  const toggleTask = async (taskId: string) => {
    if (!effectiveChildId) {
      Alert.alert(
        'No child selected',
        'Add at least one child to your family (Settings → Children) so routine completions can be saved.'
      );
      return;
    }
    try {
      await completeRoutineTask({ taskId, childId: effectiveChildId });
      
      // Update local state
      setRoutine(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, completed: !task.completed }
            : task
        ),
      }));
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      // You might want to show an error toast here
    }
  };

  const getCompletionPercentage = () => {
    if (routine.tasks.length === 0) return 0;
    const completed = routine.tasks.filter(task => task.completed).length;
    return Math.round((completed / routine.tasks.length) * 100);
  };

  const getEarnedPoints = () => {
    return routine.tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + (task.points || 0), 0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center', margin: 20 }}>
          {error}
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  if (!currentFamily) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', margin: 24 }}>
          Select a family to track routines.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyChildContainer}>
          <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
            No children in this family
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7, marginBottom: 16 }}>
            Add a child under Settings so you can complete routine tasks for them.
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Back to Routines
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {children.length > 1 ? (
          <View style={styles.childPicker}>
            <Text variant="labelLarge" style={styles.childPickerLabel}>
              Completing for
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.childChips}>
                {children.map((c) => (
                  <Chip
                    key={c.id}
                    mode={effectiveChildId === c.id ? 'flat' : 'outlined'}
                    selected={effectiveChildId === c.id}
                    onPress={() => setSelectedChildId(c.id)}
                    style={styles.childChip}
                  >
                    {c.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall">{routine.name}</Text>
          <Text variant="bodyMedium" style={styles.description}>
            {routine.description}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text variant="titleLarge">{getCompletionPercentage()}%</Text>
              <Text variant="bodySmall">Complete</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">{getEarnedPoints()}</Text>
              <Text variant="bodySmall">Points Earned</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">{routine.tasks.length}</Text>
              <Text variant="bodySmall">Total Tasks</Text>
            </View>
          </View>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Today's Tasks
        </Text>

        {routine.tasks.length === 0 ? (
          <Text style={{ textAlign: 'center', marginVertical: 20 }}>
            No tasks found for this routine.
          </Text>
        ) : (
          <View style={styles.tasksContainer}>
            {routine.tasks.map((task) => (
              <Card key={task.id} style={styles.taskCard}>
                <Card.Content>
                  <View style={styles.taskRow}>
                    <Checkbox
                      status={task.completed ? 'checked' : 'unchecked'}
                      onPress={() => toggleTask(task.id)}
                    />
                    <View style={styles.taskContent}>
                      <Text 
                        variant="bodyLarge" 
                        style={[
                          styles.taskTitle,
                          task.completed && styles.completedTask
                        ]}
                      >
                        {task.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.taskPoints}>
                        {task.points} points
                      </Text>
                    </View>
                    <Chip 
                      mode={task.completed ? "flat" : "outlined"}
                      compact
                    >
                      {task.completed ? 'Done' : 'Pending'}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={() => {
              // TODO: Reset routine for next day
              console.log('Reset routine');
            }}
          >
            Reset for Tomorrow
          </Button>
          
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            onPress={() => router.back()}
          >
            Back to Routines
          </Button>
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
  emptyChildContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  childPicker: {
    marginBottom: 12,
  },
  childPickerLabel: {
    marginBottom: 8,
  },
  childChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 12,
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  tasksContainer: {
    gap: 12,
    marginBottom: 24,
  },
  taskCard: {
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskPoints: {
    opacity: 0.6,
    marginTop: 2,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 8,
  },
}); 