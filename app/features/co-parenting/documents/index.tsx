import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';

export default function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        📄 Shared Documents
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Share important family documents with co-parents. Upload and manage files in one place.
      </Text>
      <Text variant="bodySmall" style={styles.comingSoon}>
        Document upload and sharing is coming soon.
      </Text>
      <Button mode="contained" onPress={() => router.back()} style={styles.button}>
        Back to Co-Parenting
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoon: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});
