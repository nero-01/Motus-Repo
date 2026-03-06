import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Card,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';
import { createChore } from '../../../services/supabase/chores';

export default function CreateChoreScreen() {
  const { user } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('5');
  const [category, setCategory] = useState<'cleaning' | 'laundry' | 'dishes' | 'garden' | 'other'>('cleaning');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const categories = [
    { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'laundry', label: 'Laundry', icon: '👕' },
    { value: 'dishes', label: 'Dishes', icon: '🍽️' },
    { value: 'garden', label: 'Garden', icon: '🌱' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  const difficulties = [
    { value: 1, label: 'Very Easy', color: '#4CAF50' },
    { value: 2, label: 'Easy', color: '#8BC34A' },
    { value: 3, label: 'Medium', color: '#FF9800' },
    { value: 4, label: 'Hard', color: '#FF5722' },
    { value: 5, label: 'Very Hard', color: '#F44336' },
  ];

  const handleCreateChore = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chore title');
      return;
    }

    if (!currentFamily) {
      Alert.alert('Error', 'No family found. Please try again.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please try again.');
      return;
    }

    if (!points || parseInt(points) <= 0) {
      Alert.alert('Error', 'Please enter valid points (greater than 0)');
      return;
    }

    setLoading(true);
    try {
      await createChore({
        family_id: currentFamily.id,
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        points: parseInt(points),
        is_recurring: isRecurring,
        is_active: true,
        created_by: user.id,
      });

      Alert.alert('Success', 'Chore created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      if (__DEV__) console.error('Error creating chore:', error);
      Alert.alert('Error', 'Failed to create chore. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const getDifficultyColor = (diff: number) => {
    const difficulty = difficulties.find(d => d.value === diff);
    return difficulty?.color || '#757575';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Create New Chore
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Add a new chore for your family
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="Chore Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Make Bed, Clean Room"
            />

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Describe what needs to be done..."
            />

            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Category
            </Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <Chip
                  key={cat.value}
                  selected={category === cat.value}
                  onPress={() => setCategory(cat.value as 'cleaning' | 'laundry' | 'dishes' | 'garden' | 'other')}
                  style={styles.categoryChip}
                  textStyle={styles.categoryText}
                >
                  {cat.icon} {cat.label}
                </Chip>
              ))}
            </View>

            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Difficulty Level
            </Text>
            <View style={styles.difficultiesContainer}>
              {difficulties.map((diff) => (
                <Chip
                  key={diff.value}
                  selected={difficulty === diff.value}
                  onPress={() => setDifficulty(diff.value as 1 | 2 | 3 | 4 | 5)}
                  style={[
                    styles.difficultyChip,
                    { backgroundColor: difficulty === diff.value ? diff.color : undefined }
                  ]}
                  textStyle={[
                    styles.difficultyText,
                    { color: difficulty === diff.value ? 'white' : undefined }
                  ]}
                >
                  {diff.label}
                </Chip>
              ))}
            </View>

            <View style={styles.row}>
              <TextInput
                label="Estimated Duration (minutes)"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                style={[styles.input, styles.halfInput]}
                placeholder="15"
                mode="outlined"
                keyboardType="numeric"
              />

              <TextInput
                label="Points *"
                value={points}
                onChangeText={setPoints}
                style={[styles.input, styles.halfInput]}
                placeholder="5"
                mode="outlined"
                keyboardType="numeric"
              />
            </View>

            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Recurring Chore
            </Text>
            <SegmentedButtons
              value={isRecurring ? 'yes' : 'no'}
              onValueChange={(value) => setIsRecurring(value === 'yes')}
              buttons={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              style={styles.segmentedButton}
            />
          </Card.Content>
        </Card>

        <View style={styles.previewContainer}>
          <Text variant="titleMedium" style={styles.previewTitle}>
            Preview
          </Text>
          <Card style={styles.previewCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.previewChoreTitle}>
                {title || 'Chore Title'}
              </Text>
              {description && (
                <Text variant="bodySmall" style={styles.previewDescription}>
                  {description}
                </Text>
              )}
              <View style={styles.previewMeta}>
                <Text variant="bodySmall" style={styles.previewPoints}>
                  {points || '5'} points
                </Text>
                <Text variant="bodySmall" style={styles.previewDifficulty}>
                  {difficulties.find(d => d.value === difficulty)?.label} • {categories.find(c => c.value === category)?.label}
                </Text>
                {estimatedDuration && (
                  <Text variant="bodySmall" style={styles.previewDuration}>
                    {estimatedDuration} minutes
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.actionButton}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateChore}
          style={styles.actionButton}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            'Create Chore'
          )}
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
  formCard: {
    margin: 20,
    marginTop: 10,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  segmentedButton: {
    marginBottom: 16,
  },
  previewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
  },
  previewChoreTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewDescription: {
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewPoints: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  previewDifficulty: {
    color: '#666',
    textTransform: 'capitalize',
  },
  previewDuration: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontWeight: 'bold',
  },
  difficultiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  difficultyChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  difficultyText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
}); 