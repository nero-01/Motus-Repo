import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { Link } from 'expo-router';

export default function PlannersScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Parenting Planners
      </Text>
      
      <Text variant="bodyMedium" style={styles.subtitle}>
        Plan meals, organize chores, and track family goals
      </Text>

      <View style={styles.cardsContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Meal Planning</Text>
            <Text variant="bodyMedium">Plan weekly meals and generate shopping lists</Text>
          </Card.Content>
          <Card.Actions>
            <Link href="/(tabs)/planners/meals" asChild>
              <Button mode="contained-tonal">Plan Meals</Button>
            </Link>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Chore Organization</Text>
            <Text variant="bodyMedium">Assign and track chores for family members</Text>
          </Card.Content>
          <Card.Actions>
            <Link href="/(tabs)/planners/chores" asChild>
              <Button mode="contained-tonal">Manage Chores</Button>
            </Link>
          </Card.Actions>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    marginBottom: 8,
  },
}); 