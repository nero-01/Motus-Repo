import React, { useEffect, useState } from 'react';
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
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../stores/authStore';
import { useFamilyStore } from '../../../../stores/familyStore';
import { createWeeklyMealPlan } from '../../../../services/supabase/meals';

function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CreateMealPlanScreen() {
  const { user } = useAuthStore();
  const { currentFamily, loadFamilies } = useFamilyStore();
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState(todayLocalYmd);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      void loadFamilies(user.id);
    }
  }, [user?.id, loadFamilies]);

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

    if (!startDate.trim()) {
      Alert.alert('Error', 'Please enter a start date (YYYY-MM-DD)');
      return;
    }

    if (!currentFamily?.id || !user?.id) {
      Alert.alert('Error', 'Sign in and open this screen from a family workspace.');
      return;
    }

    setLoading(true);
    try {
      await createWeeklyMealPlan({
        familyId: currentFamily.id,
        userId: user.id,
        planName: planName.trim(),
        startDateYmd: startDate.trim(),
        selectedDayIndices: selectedDays.map((d) => parseInt(d, 10)),
      });
      Alert.alert('Success', 'Meal plan saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create meal plan';
      Alert.alert('Error', message);
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