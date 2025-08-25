import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'apple' | 'twitter';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function SocialLoginButton({ 
  provider, 
  onPress, 
  loading = false, 
  disabled = false 
}: SocialLoginButtonProps) {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          color: '#4285F4',
          icon: 'google',
          backgroundColor: '#ffffff',
          textColor: '#4285F4',
        };
      case 'facebook':
        return {
          name: 'Facebook',
          color: '#1877F2',
          icon: 'facebook',
          backgroundColor: '#1877F2',
          textColor: '#ffffff',
        };
      case 'apple':
        return {
          name: 'Apple',
          color: '#000000',
          icon: 'apple',
          backgroundColor: '#000000',
          textColor: '#ffffff',
        };
      case 'twitter':
        return {
          name: 'Twitter',
          color: '#1DA1F2',
          icon: 'twitter',
          backgroundColor: '#1DA1F2',
          textColor: '#ffffff',
        };
      default:
        return {
          name: 'Social',
          color: '#666666',
          icon: 'account',
          backgroundColor: '#ffffff',
          textColor: '#666666',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <Button
      mode="outlined"
      onPress={onPress}
      style={[
        styles.socialButton,
        {
          borderColor: config.color,
          backgroundColor: config.backgroundColor,
        }
      ]}
      textColor={config.textColor}
      loading={loading}
      disabled={disabled}
      icon={({ size, color }) => (
        <MaterialCommunityIcons 
          name={config.icon as any} 
          size={size} 
          color={color} 
        />
      )}
    >
      Continue with {config.name}
    </Button>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
