import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PRIMARY = '#006A60';
const LABEL_WHITE = '#FFFFFF';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
            <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleGetStarted}
                  buttonColor={PRIMARY}
                  textColor={LABEL_WHITE}
                  style={styles.getStartedButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Get Started
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleSignIn}
                  textColor={LABEL_WHITE}
                  theme={{ colors: { outline: 'rgba(255, 255, 255, 0.95)' } }}
                  style={styles.signInButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.signInButtonLabel}
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
    paddingBottom: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  buttonContainer: {
    gap: 16,
  },
  getStartedButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  signInButton: {
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    paddingVertical: 16,
    height: 64,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signInButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
}); 