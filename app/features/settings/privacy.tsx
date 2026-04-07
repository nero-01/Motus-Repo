import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Switch, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ANALYTICS = 'motustots_privacy_analytics_opt_in';
const KEY_MARKETING = 'motustots_privacy_marketing_opt_in';

export default function PrivacySettingsScreen() {
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, m] = await Promise.all([
          AsyncStorage.getItem(KEY_ANALYTICS),
          AsyncStorage.getItem(KEY_MARKETING),
        ]);
        if (!cancelled) {
          if (a !== null) setAnalytics(a === 'true');
          if (m !== null) setMarketing(m === 'true');
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  };

  if (!loaded) {
    return <View style={[styles.container, styles.centered]} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Data & preferences
      </Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="titleSmall">Usage analytics</Text>
              <Text variant="bodySmall" style={styles.desc}>
                Help improve the app with anonymous usage insights (stored on this device only until a
                backend is connected).
              </Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={(v) => {
                setAnalytics(v);
                void persist(KEY_ANALYTICS, v);
              }}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="titleSmall">Tips & updates</Text>
              <Text variant="bodySmall" style={styles.desc}>
                Product tips and feature announcements (local preference only for now).
              </Text>
            </View>
            <Switch
              value={marketing}
              onValueChange={(v) => {
                setMarketing(v);
                void persist(KEY_MARKETING, v);
              }}
            />
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.bold}>
            Your data
          </Text>
          <Text variant="bodySmall" style={styles.desc}>
            Family and child data are stored according to your Supabase project and its policies. Export
            and deletion flows can be added under Settings when ready.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { marginBottom: 12, fontWeight: 'bold' },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowText: { flex: 1, marginRight: 12 },
  desc: { marginTop: 4, opacity: 0.7 },
  divider: { marginVertical: 8 },
  bold: { fontWeight: '600', marginBottom: 8 },
});
