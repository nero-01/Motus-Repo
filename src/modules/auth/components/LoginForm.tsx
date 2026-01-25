import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, HelperText, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [showPassword, setShowPassword] = useState(false);

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
      Alert.alert('Error', `Failed to sign in with ${provider.name}. Please try again.`);
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
      provider={provider.id as 'google' | 'facebook' | 'twitter'}
      onPress={() => handleSocialLogin(provider)}
      loading={socialLoading === provider.id}
      disabled={isLoading || !!socialLoading}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Welcome Back
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign in to continue
        </Text>

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

          <View style={styles.passwordContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              style={styles.input}
              error={!!passwordError}
              disabled={isLoading || !!socialLoading}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading || !!socialLoading}
                />
              }
            />
          </View>
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
              style={styles.linkButton}
            >
              Forgot Password?
            </Button>
            
            <View style={styles.signupSection}>
              <Text variant="bodySmall" style={styles.signupText}>
                Don't have an account?{' '}
              </Text>
              <Button
                mode="text"
                compact
                onPress={() => router.push('/(auth)/register')}
                disabled={isLoading || !!socialLoading}
                style={styles.linkButton}
              >
                Sign Up
              </Button>
            </View>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={styles.dividerText}>
            or continue with
          </Text>
          <Divider style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          {SocialAuthService.socialProviders.map(renderSocialButton)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#006A60',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  loginButton: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#006A60',
  },
  links: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkButton: {
    minHeight: 32,
  },
  signupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signupText: {
    color: '#666',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  socialContainer: {
    gap: 8,
    marginBottom: 32,
  },
});
