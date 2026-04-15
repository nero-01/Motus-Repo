import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook';
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
          gradient: true,
        };
      case 'facebook':
        return {
          name: 'Facebook',
          color: '#1877F2',
          icon: 'facebook',
          backgroundColor: '#1877F2',
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

  if (provider === 'google') {
    return (
      <View style={styles.googleButtonContainer}>
        <LinearGradient
          colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.googleGradient}
        >
          <Button
            mode="contained"
            onPress={onPress}
            style={styles.googleButton}
            textColor="#ffffff"
            loading={loading}
            disabled={disabled}
            icon={({ size, color }) => (
              <MaterialCommunityIcons 
                name="google" 
                size={size} 
                color="#ffffff" 
              />
            )}
          >
            Continue with Google
          </Button>
        </LinearGradient>
      </View>
    );
  }

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
  googleButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 4,
  },
  googleGradient: {
    borderRadius: 8,
  },
  googleButton: {
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    elevation: 0,
  },
});
