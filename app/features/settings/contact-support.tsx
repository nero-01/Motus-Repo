import React from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SUPPORT_EMAIL } from '../../../constants/support';

export default function ContactSupportScreen() {
  const subject = encodeURIComponent('MotusTots support request');
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;

  const openMail = async () => {
    try {
      const can = await Linking.canOpenURL(mailto);
      if (can) await Linking.openURL(mailto);
      else Alert.alert('Email', `Send a message to ${SUPPORT_EMAIL}`);
    } catch {
      Alert.alert('Email', `Send a message to ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Contact support
          </Text>
          <Text variant="bodyMedium" style={styles.body}>
            Tell us what went wrong, which screen you were on, and your account email if different from
            the one you write from. We typically reply by email.
          </Text>
          <Text variant="bodySmall" style={styles.email}>
            {SUPPORT_EMAIL}
          </Text>
        </Card.Content>
      </Card>
      <Button mode="contained" onPress={() => void openMail()} style={styles.button}>
        Open email app
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16 },
  title: { marginBottom: 8, fontWeight: '600' },
  body: { lineHeight: 22, marginBottom: 12 },
  email: { fontWeight: '600', opacity: 0.85 },
  button: { marginTop: 4 },
});
