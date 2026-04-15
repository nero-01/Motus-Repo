import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share, Alert, Platform } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../../services/supabase/client';

export default function ExportDataScreen() {
  const [loading, setLoading] = useState(false);

  const buildExportPayload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      exportedAt: new Date().toISOString(),
      app: 'MotusTots',
      note:
        'This is a minimal export of your signed-in account. A full family data export (children, routines, etc.) may require a server-side job — ask support if you need everything.',
      user: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          }
        : null,
    };
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const payload = await buildExportPayload();
      const body = JSON.stringify(payload, null, 2);
      const result = await Share.share(
        {
          message: body,
          title: 'MotusTots data export',
        },
        Platform.select({
          ios: { subject: 'MotusTots data export' },
          default: {},
        })
      );
      if (result.action === Share.sharedAction) {
        /* optional toast */
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Export your data
          </Text>
          <Text variant="bodyMedium" style={styles.body}>
            We will prepare a JSON snapshot you can save or send via your device share sheet (email,
            Files, Drive, etc.). Sign in is required.
          </Text>
          <Text variant="bodySmall" style={styles.disclaimer}>
            Large datasets (full family history) may need a future server-side export. Contact support
            if this export is not enough for your needs.
          </Text>
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        onPress={() => void handleExport()}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Preparing…' : 'Share export'}
      </Button>
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16 },
  title: { marginBottom: 8, fontWeight: '600' },
  body: { marginBottom: 12, lineHeight: 22 },
  disclaimer: { opacity: 0.75, lineHeight: 20 },
  button: { marginTop: 4 },
  row: { marginTop: 16, alignItems: 'center' },
});
