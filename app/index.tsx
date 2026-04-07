import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/MotusTots-splash-v2.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay for better text readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.gradientOverlay}
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* App Title and Tagline */}
            <View style={styles.headerSection}>
              <Text style={styles.appTitle}>MotusTots</Text>
              <Text style={styles.tagline}>Empowering families through meaningful activities</Text>
            </View>

            {/* Bottom Section with Buttons */}
            <View style={styles.bottomSection}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleGetStarted}
                  style={styles.getStartedButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  compact={false}
                >
                  Get Started
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleSignIn}
                  style={styles.signInButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.signInButtonLabel}
                  compact={false}
                >
                  I have an account
                </Button>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    paddingBottom: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  getStartedButton: {
    borderRadius: 12,
    backgroundColor: '#006A60',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  signInButton: {
    borderRadius: 12,
    borderColor: '#ffffff',
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0,
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  signInButtonLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0,
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
}); 