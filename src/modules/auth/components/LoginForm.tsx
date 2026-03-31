import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { SocialAuthService } from '../services/socialAuthService';
import { SocialLoginProvider } from '../types';
import SocialLoginButton from './SocialLoginButton';

const CREDENTIAL_SCALE = 1.06;

export default function LoginForm() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const spring = (toValue: number) =>
      Animated.spring(scaleAnim, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 70,
      }).start();

    const subShow = Keyboard.addListener(show, () => spring(CREDENTIAL_SCALE));
    const subHide = Keyboard.addListener(hide, () => spring(1));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [scaleAnim]);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <View style={styles.socialContainer}>
            {SocialAuthService.socialProviders.map(renderSocialButton)}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text variant="bodyMedium" style={styles.dividerText}>
              or continue with email
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <Animated.View style={[styles.formWrap, { transform: [{ scale: scaleAnim }] }]}>
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
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  formWrap: {
    width: '100%',
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
