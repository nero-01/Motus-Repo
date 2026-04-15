import React from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Card, List, Divider, Button } from 'react-native-paper';
import { HELP_CENTER_URL, SUPPORT_EMAIL } from '../../../constants/support';

const FAQS = [
  {
    q: 'How do I add a child or family member?',
    a: 'Use onboarding when you first sign up, or open Family / Settings flows from the app menu where available. More management screens are rolling out over time.',
  },
  {
    q: 'Why is my worksheet progress not saving?',
    a: 'Progress needs a selected child, matching worksheet IDs in Supabase, and the correct database policies. Check your connection and that migrations (e.g. worksheet progress constraints) are applied.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, use “Forgot password” to receive a reset email. You can also change password from Settings when signed in.',
  },
  {
    q: 'Who can see my data?',
    a: 'Data is scoped by your Supabase project and Row Level Security. Review your project policies and our privacy information for details.',
  },
];

export default function HelpFaqScreen() {
  const openHelpUrl = async () => {
    if (!HELP_CENTER_URL) {
      Alert.alert(
        'Help center',
        'A public help center URL is not configured yet. Use Contact support from Settings.'
      );
      return;
    }
    const ok = await Linking.canOpenURL(HELP_CENTER_URL);
    if (ok) await Linking.openURL(HELP_CENTER_URL);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {HELP_CENTER_URL ? (
        <Button mode="contained-tonal" onPress={() => void openHelpUrl()} style={styles.topBtn}>
          Open help center (web)
        </Button>
      ) : null}
      <Text variant="titleMedium" style={styles.section}>
        Frequently asked questions
      </Text>
      {FAQS.map((item, i) => (
        <Card key={i} style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.q}>
              {item.q}
            </Text>
            <Text variant="bodyMedium" style={styles.a}>
              {item.a}
            </Text>
          </Card.Content>
        </Card>
      ))}
      <List.Section>
        <List.Subheader>Still stuck?</List.Subheader>
        <List.Item
          title="Contact support"
          description="We reply by email"
          left={(p) => <List.Icon {...p} icon="email-outline" />}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  topBtn: { marginBottom: 16 },
  section: { marginBottom: 12, fontWeight: '600' },
  card: { marginBottom: 12 },
  q: { fontWeight: '600', marginBottom: 8 },
  a: { lineHeight: 22, opacity: 0.9 },
});
