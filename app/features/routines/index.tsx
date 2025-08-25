import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button, FAB, Chip } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { getRoutinesByFamily } from '../../../services/supabase/routines';
import { useFamilyStore } from '../../../stores/familyStore';

export default function RoutinesScreen() {
  const { currentFamily } = useFamilyStore();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!currentFamily) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getRoutinesByFamily(currentFamily.id);
        setRoutines(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load routines');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutines();
  }, [currentFamily]);

  const getCompletionPercentage = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((task: any) => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (!currentFamily) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Family Selected
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Please select a family to view routines.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Daily Routines
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Track your family's daily activities and build healthy habits
        </Text>

        {loading && <ActivityIndicator size="large" style={{ marginVertical: 32 }} />}
        {error && <Text style={{ color: 'red', marginVertical: 16 }}>{error}</Text>}

        {!loading && !error && routines.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No routines found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Create your first routine to get started!
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/features/routines/create')}
              style={styles.createButton}
            >
              Create First Routine
            </Button>
          </View>
        )}

        {!loading && !error && routines.map((routine) => (
          <Card key={routine.id} style={styles.routineCard}>
            <Card.Content>
              <View style={styles.routineHeader}>
                <Text variant="titleMedium">{routine.name}</Text>
                <Chip mode="outlined">
                  {/* Completion % will be 0 until tasks are fetched per routine */}
                  0% Complete
                </Chip>
              </View>
              {routine.description && (
                <Text variant="bodyMedium" style={styles.routineDescription}>
                  {routine.description}
                </Text>
              )}
              <View style={styles.routineMeta}>
                <Chip mode="flat" style={styles.metaChip}>
                  {routine.schedule_type}
                </Chip>
                <Text variant="bodySmall" style={styles.metaText}>
                  Created {new Date(routine.created_at).toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Link href={`/features/routines/${routine.id}`} asChild>
                <Button mode="contained-tonal">
                  View Details
                </Button>
              </Link>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => router.push('/features/routines/create')}
      />
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
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
  },
  routineCard: {
    marginBottom: 16,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineDescription: {
    marginBottom: 12,
    opacity: 0.7,
  },
  routineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaChip: {
    backgroundColor: '#E3F2FD',
  },
  metaText: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 