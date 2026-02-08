import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';
import { createRoutine, createRoutineTask } from '../../../services/supabase/routines';

interface TaskForm {
  name: string;
  description: string;
  estimatedDuration: string;
  pointsReward: string;
  isRequired: boolean;
}

export default function CreateRoutineScreen() {
  const { user } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskForm>({
    name: '',
    description: '',
    estimatedDuration: '5',
    pointsReward: '1',
    isRequired: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const addTask = () => {
    if (!currentTask.name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }
    
    setTasks([...tasks, currentTask]);
    setCurrentTask({
      name: '',
      description: '',
      estimatedDuration: '5',
      pointsReward: '1',
      isRequired: true,
    });
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (tasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task');
      return;
    }

    if (!currentFamily || !user) {
      Alert.alert('Error', 'Family or user not found');
      return;
    }

    setIsLoading(true);

    try {
      // Create the routine
      const routine = await createRoutine({
        family_id: currentFamily.id,
        name: routineName,
        description: routineDescription,
        schedule_type: scheduleType,
        schedule_data: {},
        is_active: true,
        created_by: user.id,
      });

      // Create tasks for the routine
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        await createRoutineTask({
          routine_id: routine.id,
          name: task.name,
          description: task.description,
          order_index: i,
          estimated_duration: parseInt(task.estimatedDuration) || 5,
          points_reward: parseInt(task.pointsReward) || 1,
          is_required: task.isRequired,
        });
      }

      Alert.alert(
        'Success!',
        'Routine created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      if (__DEV__) console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Create New Routine
        </Text>

        {/* Routine Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Routine Details
            </Text>

            <TextInput
              label="Routine Name"
              value={routineName}
              onChangeText={setRoutineName}
              style={styles.input}
              placeholder="e.g., Morning Routine"
            />

            <TextInput
              label="Description (Optional)"
              value={routineDescription}
              onChangeText={setRoutineDescription}
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Describe what this routine is for..."
            />

            <Text variant="bodyMedium" style={styles.label}>
              Schedule Type
            </Text>
            <View style={styles.chipGroup}>
              <Chip
                selected={scheduleType === 'daily'}
                onPress={() => setScheduleType('daily')}
                style={styles.chip}
              >
                Daily
              </Chip>
              <Chip
                selected={scheduleType === 'weekly'}
                onPress={() => setScheduleType('weekly')}
                style={styles.chip}
              >
                Weekly
              </Chip>
              <Chip
                selected={scheduleType === 'custom'}
                onPress={() => setScheduleType('custom')}
                style={styles.chip}
              >
                Custom
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Tasks */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Tasks ({tasks.length})
            </Text>

            {tasks.map((task, index) => (
              <Chip
                key={index}
                style={styles.taskChip}
                onClose={() => removeTask(index)}
                closeIcon={() => <Text style={{ fontSize: 16 }}>❌</Text>}
              >
                {task.name} ({task.estimatedDuration}min, {task.pointsReward}pts)
              </Chip>
            ))}

            <View style={styles.addTaskForm}>
              <TextInput
                label="Task Name"
                value={currentTask.name}
                onChangeText={(text) => setCurrentTask({ ...currentTask, name: text })}
                style={styles.input}
                placeholder="e.g., Brush teeth"
              />

              <TextInput
                label="Description (Optional)"
                value={currentTask.description}
                onChangeText={(text) => setCurrentTask({ ...currentTask, description: text })}
                style={styles.input}
                placeholder="Describe the task..."
              />

              <View style={styles.taskOptions}>
                <TextInput
                  label="Duration (minutes)"
                  value={currentTask.estimatedDuration}
                  onChangeText={(text) => setCurrentTask({ ...currentTask, estimatedDuration: text })}
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                />

                <TextInput
                  label="Points Reward"
                  value={currentTask.pointsReward}
                  onChangeText={(text) => setCurrentTask({ ...currentTask, pointsReward: text })}
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                />
              </View>

              <Button
                mode="outlined"
                onPress={addTask}
                style={styles.addButton}
                disabled={!currentTask.name.trim()}
              >
                Add Task
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleCreateRoutine}
          style={styles.createButton}
          loading={isLoading}
          disabled={isLoading || !routineName.trim() || tasks.length === 0}
        >
          Create Routine
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 8,
  },
  taskChip: {
    marginBottom: 8,
  },
  addTaskForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  taskOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
}); 