import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, StatusBar, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

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

      <ImageBackground
        source={require('../assets/MotusTots-splash-v2.png')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageImage}
        resizeMode="contain"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.headerSection}>
                <Text style={styles.appTitle}>MotusTots</Text>
                <Text style={styles.tagline}>Empowering families through meaningful activities</Text>
              </View>

      <View style={styles.bottomSection}>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleGetStarted}
                    style={styles.getStartedButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Get Started
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={handleSignIn}
                    style={styles.signInButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.signInButtonLabel}
                  >
                    I have an account
                  </Button>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
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
    width: '100%',
    height: '100%',
  },
  backgroundImageImage: {
    width: width,
    height: height,
    alignSelf: 'center',
    transform: [{ translateY: -40 }],
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: height - 80,
  },
  headerSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
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
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonContainer: {
    width: '100%',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  signInButton: {
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  signInButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
}); 