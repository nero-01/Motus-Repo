import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button, HelperText, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { SocialAuthService } from '../services/socialAuthService';
import { SocialLoginProvider } from '../types';
import SocialLoginButton from './SocialLoginButton';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const validateForm = () => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      clearError();
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    }
  };

  const handleSocialLogin = async (provider: SocialLoginProvider) => {
    try {
      setSocialLoading(provider.id);
      clearError();
      await SocialAuthService.signInWithProvider(provider.id);
      router.replace('/(tabs)');
    } catch (err) {
      console.error(`${provider.name} login error:`, err);
      const message =
        err instanceof Error ? err.message : `Failed to sign in with ${provider.name}. Please try again.`;
      if (message.toLowerCase().includes('cancelled')) {
        return;
      }
      Alert.alert('Error', message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
  };

  const renderSocialButton = (provider: SocialLoginProvider) => (
    <SocialLoginButton
      key={provider.id}
      provider={provider.id}
      onPress={() => handleSocialLogin(provider)}
      loading={socialLoading === provider.id}
      disabled={isLoading || !!socialLoading}
    />
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue
          </Text>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            {SocialAuthService.socialProviders.map(renderSocialButton)}
          </View>

          <Divider style={styles.divider}>
            <Text variant="bodyMedium" style={styles.dividerText}>
              or continue with email
            </Text>
          </Divider>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!emailError}
              disabled={isLoading || !!socialLoading}
            />
            {emailError ? (
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            ) : null}

            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              style={styles.input}
              error={!!passwordError}
              disabled={isLoading || !!socialLoading}
            />
            {passwordError ? (
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            ) : null}

            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoading || !!socialLoading}
              loading={isLoading}
            >
              Sign In
            </Button>

            <View style={styles.links}>
              <Button
                mode="text"
                compact
                onPress={() => router.push('/(auth)/forgot-password')}
                disabled={isLoading || !!socialLoading}
              >
                Forgot Password?
              </Button>
              
              <View style={styles.signupSection}>
                <Text variant="bodyMedium" style={styles.signupText}>
                  Don't have an account?{' '}
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={() => router.push('/(auth)/register')}
                  disabled={isLoading || !!socialLoading}
                >
                  Sign Up
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#006A60',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 24,
  },
  dividerText: {
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#006A60',
  },
  links: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    color: '#666',
  },
});
