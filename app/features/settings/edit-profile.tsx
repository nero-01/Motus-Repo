import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../src/modules/auth/store/authStore';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const getCurrentUser = useAuthStore((s) => s.getCurrentUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      Alert.alert('Saved', 'Your profile was updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.label}>
              Display name
            </Text>
            <TextInput
              mode="outlined"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
              style={styles.input}
            />
            <Text variant="titleMedium" style={[styles.label, styles.mt]}>
              Email
            </Text>
            <TextInput
              mode="outlined"
              value={email}
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="lock" />}
            />
            <Text variant="bodySmall" style={styles.hint}>
              To change your email, use account recovery or contact support.
            </Text>
          </Card.Content>
        </Card>
        <Button
          mode="contained"
          onPress={() => void handleSave()}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
        >
          Save changes
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 16 },
  label: { marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#fff' },
  mt: { marginTop: 16 },
  hint: { marginTop: 8, opacity: 0.65 },
  saveBtn: { marginTop: 8 },
});
