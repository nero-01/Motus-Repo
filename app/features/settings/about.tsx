import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Card, List, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { PRIVACY_POLICY_URL } from './supportConstants';

function appVersion(): string {
  return (
    Constants.expoConfig?.version ||
    Constants.nativeApplicationVersion ||
    '1.0.0'
  );
}

export default function AboutScreen() {
  const version = appVersion();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.brand}>
            MotusTots
          </Text>
          <Text variant="bodyMedium" style={styles.tagline}>
            Family routines, learning, and co-parenting in one place.
          </Text>
          <Text variant="labelLarge" style={styles.version}>
            Version {version}
          </Text>
        </Card.Content>
      </Card>
      <List.Section>
        <List.Item
          title="Privacy policy"
          description="How we handle your data"
          left={(p) => <List.Icon {...p} icon="shield-account-outline" />}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        />
        <Divider />
        <List.Item
          title="Help & FAQ"
          description="Answers to common questions"
          left={(p) => <List.Icon {...p} icon="help-circle-outline" />}
          onPress={() => router.push('/features/settings/help')}
        />
      </List.Section>
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.muted}>
          © {new Date().getFullYear()} MotusTots
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 8 },
  brand: { fontWeight: '700', marginBottom: 4 },
  tagline: { marginBottom: 12, lineHeight: 22, opacity: 0.9 },
  version: { opacity: 0.8 },
  footer: { marginTop: 24, alignItems: 'center' },
  muted: { opacity: 0.6 },
});
