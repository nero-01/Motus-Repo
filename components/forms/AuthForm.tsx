import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button, Input } from '../ui';

export interface AuthFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  type,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [validationErrors, setValidationErrors] = useState<Partial<AuthFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<AuthFormData> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (type === 'register') {
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.error} variant="bodySmall">
          {error}
        </Text>
      )}

      {type === 'register' && (
        <>
          <Input
            label="First Name"
            value={formData.firstName || ''}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            error={validationErrors.firstName}
            autoCapitalize="words"
            disabled={isLoading}
            style={styles.input}
          />
          <Input
            label="Last Name"
            value={formData.lastName || ''}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            error={validationErrors.lastName}
            autoCapitalize="words"
            disabled={isLoading}
            style={styles.input}
          />
        </>
      )}

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        error={validationErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={isLoading}
        style={styles.input}
      />

      <Input
        label="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        error={validationErrors.password}
        secureTextEntry
        disabled={isLoading}
        style={styles.input}
      />

      <Button
        onPress={handleSubmit}
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        style={styles.button}
      >
        {type === 'login' ? 'Sign In' : 'Create Account'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: '#B3261E',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default AuthForm; 