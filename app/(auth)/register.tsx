import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Text } from 'react-native-paper';
import { AuthForm, type AuthFormData } from '../../components/forms';
import { Card } from '../../components/ui';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const { signUp, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Navigate to main app if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleRegister = async (data: AuthFormData) => {
    try {
      clearError();
      
      if (!data.firstName || !data.lastName) {
        throw new Error('First name and last name are required');
      }
      
      await signUp(data.email, data.password, data.firstName, data.lastName);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Join MotusTots to manage your family's routines and activities
        </Text>

        <Card style={styles.card}>
          <AuthForm
            type="register"
            onSubmit={handleRegister}
            isLoading={isLoading}
            error={error || undefined}
          />

          <View style={styles.links}>
            <Link href="/login" asChild>
              <Text variant="bodyMedium" style={styles.link}>
                Already have an account? Sign in
              </Text>
            </Link>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    padding: 24,
  },
  links: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: theme.colors.primary,
  },
}); 