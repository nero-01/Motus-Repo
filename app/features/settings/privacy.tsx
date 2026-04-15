import React from 'react';
import { ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Card, List, Text, Divider } from 'react-native-paper';
import { HELP_CENTER_URL, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../../../constants/support';

export default function PrivacySettingsScreen() {
  const openUrl = async (url: string, title: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(title, 'Unable to open link on this device right now.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error(`Failed to open ${title} URL:`, error);
      Alert.alert(title, 'Something went wrong while opening this link.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Privacy & Data Safety
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            MotusTots keeps family data scoped to authenticated users. This page provides quick access to
            policy documents and support channels used for store compliance.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <List.Item
            title="Privacy policy"
            description="Read how we collect, store, and process data"
            left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
            onPress={() => void openUrl(PRIVACY_POLICY_URL, 'Privacy policy')}
          />
          <Divider />
          <List.Item
            title="Help center"
            description={HELP_CENTER_URL ? 'Open documentation and help guides' : 'Help center URL not configured'}
            left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
            onPress={() => {
              if (!HELP_CENTER_URL) {
                Alert.alert('Help center', 'Help center URL is not configured for this environment yet.');
                return;
              }
              void openUrl(HELP_CENTER_URL, 'Help center');
            }}
          />
          <Divider />
          <List.Item
            title="Contact support"
            description={SUPPORT_EMAIL}
            left={(props) => <List.Icon {...props} icon="email-outline" />}
            onPress={() => void openUrl(`mailto:${SUPPORT_EMAIL}`, 'Contact support')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Data safety summary
          </Text>
          <Text variant="bodyMedium" style={styles.bullet}>
            - Account data is used for authentication and profile management.
          </Text>
          <Text variant="bodyMedium" style={styles.bullet}>
            - Family and child data is used to enable routines, reminders, and progress tracking features.
          </Text>
          <Text variant="bodyMedium" style={styles.bullet}>
            - You can request support through email and export app data from Settings.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    color: '#555',
    lineHeight: 22,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  bullet: {
    marginBottom: 6,
    lineHeight: 21,
  },
});
