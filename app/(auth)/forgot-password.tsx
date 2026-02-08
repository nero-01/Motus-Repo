import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Text, TextInput } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { Card, Input, Button } from '../../components/ui';
import { authService } from '../../services/supabase/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;

    try {
      setIsLoading(true);
      setError(undefined);
      setSuccess(false);
      
      const { error: resetError } = await authService.resetPassword(email);
      
      if (resetError) {
        setError(resetError.message);
        return;
      }
      
      setSuccess(true);
    } catch (err) {
      if (__DEV__) console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Reset Password
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter your email to receive password reset instructions
        </Text>

        <Card style={styles.card}>
          {success ? (
            <View style={styles.successContainer}>
              <Text variant="bodyLarge" style={styles.successText}>
                Check your email for password reset instructions.
              </Text>
              <Link href="/login" asChild>
                <Text variant="bodyMedium" style={styles.link}>
                  Return to Sign In
                </Text>
              </Link>
            </View>
          ) : (
            <>
              {error && (
                <Text style={styles.error} variant="bodySmall">
                  {error}
                </Text>
              )}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={isLoading}
                style={styles.input}
              />

              <Button
                onPress={handleSubmit}
                variant="primary"
                loading={isLoading}
                disabled={!email || isLoading}
                fullWidth
                style={styles.button}
              >
                Reset Password
              </Button>

              <View style={styles.links}>
                <Link href="/login" asChild>
                  <Text variant="bodyMedium" style={styles.link}>
                    Back to Sign In
                  </Text>
                </Link>
              </View>
            </>
          )}
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
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  links: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: theme.colors.primary,
  },
  error: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successText: {
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
}); 