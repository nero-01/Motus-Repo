import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Surface,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../stores/authStore';
import { useFamilyStore } from '../../../../stores/familyStore';

export default function CreateMealPlanScreen() {
  const { user } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { value: '0', label: 'Sun' },
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' },
  ];

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement createMealPlan from service
      Alert.alert(
        'Success', 
        'Meal plan created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create meal plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>
            🍽️ Create Meal Plan
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Plan your family's meals for the week
          </Text>
        </Surface>

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="Plan Name"
              value={planName}
              onChangeText={setPlanName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Start Date"
              value={startDate}
              onChangeText={setStartDate}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Days
            </Text>
            
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => (
                <Chip
                  key={day.value}
                  selected={selectedDays.includes(day.value)}
                  onPress={() => toggleDay(day.value)}
                  style={styles.dayChip}
                  mode="outlined"
                >
                  {day.label}
                </Chip>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleCreatePlan}
                loading={loading}
                disabled={loading}
                style={styles.createButton}
              >
                Create Meal Plan
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
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
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  formCard: {
    margin: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  dayChip: {
    margin: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  createButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
}); 