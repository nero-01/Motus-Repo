import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  showSpinner?: boolean;
}

export default function Loading({ 
  message = 'Loading...', 
  size = 'large', 
  color = '#006A60',
  showSpinner = true 
}: LoadingProps) {
  return (
    <View style={styles.container}>
      {showSpinner && (
        <ActivityIndicator size={size} color={color} style={styles.spinner} />
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 