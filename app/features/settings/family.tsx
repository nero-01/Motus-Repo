import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../../services/supabase/client';
import { createFamilyWithOwner } from '../../../services/supabase/family';
import { useFamilyStore } from '../../../stores/familyStore';

export default function FamilySetupScreen() {
  const { currentFamily, familyMembers, isLoading, error, loadFamilies } = useFamilyStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await loadFamilies(user.id);
      }
    })();
  }, [loadFamilies]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Family name', 'Please enter a name for your family.');
      return;
    }
    setSubmitting(true);
    try {
      const family = await createFamilyWithOwner({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (!family) {
        Alert.alert(
          'Could not create family',
          'Check that you are signed in and your profile exists. If this continues, try again after restarting the app.'
        );
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await loadFamilies(user.id);
      }
      setName('');
      setDescription('');
      Alert.alert('Family created', 'You can add children from Manage Children and explore Co-Parenting.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong creating your family.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !currentFamily) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">Loading family…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.lead}>
        Your family workspace holds children, routines, and co-parenting tools. Create one family per
        household.
      </Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {currentFamily ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.familyName}>
              {currentFamily.name}
            </Text>
            {currentFamily.description ? (
              <Text variant="bodyMedium" style={styles.muted}>
                {currentFamily.description}
              </Text>
            ) : null}

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionLabel}>
              People in this family ({familyMembers.length})
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              Each person signs in with their own account. Invite-by-email from the app is coming
              soon; for now another parent can use Co-Parenting after they register and you add them
              in the database, or use the same account for testing.
            </Text>

            {familyMembers.length === 0 ? (
              <Text variant="bodyMedium" style={styles.hint}>
                No members loaded yet. Pull to refresh from Settings, or open Home and return.
              </Text>
            ) : (
              familyMembers.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <Text variant="bodyLarge">
                    {m.user?.first_name || m.user?.email || 'Member'}
                    {m.user?.last_name ? ` ${m.user.last_name}` : ''}
                  </Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    {m.user?.email ?? ''}
                  </Text>
                  <Text variant="labelLarge" style={styles.role}>
                    {m.role.replace('_', ' ')}
                  </Text>
                </View>
              ))
            )}

            <Button
              mode="contained"
              style={styles.button}
              onPress={() => router.push('/features/settings/children')}
            >
              Manage children
            </Button>
            <Button
              mode="outlined"
              style={styles.button}
              onPress={() => router.push('/features/settings/family-dashboard')}
            >
              Open family dashboard
            </Button>
            <Button mode="outlined" style={styles.button} onPress={() => router.push('/features/co-parenting')}>
              Open co-parenting
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Create your family
            </Text>
            <TextInput
              label="Family name *"
              mode="outlined"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.input}
            />
            <Button
              mode="contained"
              loading={submitting}
              disabled={submitting}
              onPress={() => void handleCreate()}
              style={styles.button}
            >
              Create family
            </Button>
          </Card.Content>
        </Card>
      )}
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
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lead: {
    marginBottom: 16,
    lineHeight: 22,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    marginBottom: 12,
  },
  familyName: {
    marginBottom: 4,
  },
  muted: {
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  hint: {
    marginVertical: 8,
    color: '#666',
  },
  memberRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  role: {
    marginTop: 4,
    color: '#006A60',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 12,
  },
});
