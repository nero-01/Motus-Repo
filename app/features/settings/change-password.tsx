import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { AuthService } from '../../../src/modules/auth/services/authService';

const MIN_LENGTH = 8;

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleSave = async () => {
    if (newPassword.length < MIN_LENGTH) {
      Alert.alert(
        'Password too short',
        `Use at least ${MIN_LENGTH} characters.`
      );
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await AuthService.updatePassword(newPassword);
      Alert.alert('Password updated', 'Sign in with your new password next time on a new device if needed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.intro}>
              Choose a strong password. You must be signed in; if the session is too old, sign out and
              use Forgot password from the login screen.
            </Text>
            <Text variant="titleMedium" style={styles.label}>
              New password
            </Text>
            <TextInput
              mode="outlined"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={`At least ${MIN_LENGTH} characters`}
              secureTextEntry={secureNew}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={secureNew ? 'eye-off' : 'eye'}
                  onPress={() => setSecureNew(!secureNew)}
                />
              }
            />
            <Text variant="titleMedium" style={[styles.label, styles.mt]}>
              Confirm new password
            </Text>
            <TextInput
              mode="outlined"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={secureConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={secureConfirm ? 'eye-off' : 'eye'}
                  onPress={() => setSecureConfirm(!secureConfirm)}
                />
              }
            />
          </Card.Content>
        </Card>
        <Button
          mode="contained"
          onPress={() => void handleSave()}
          loading={saving}
          disabled={saving}
        >
          Update password
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16 },
  intro: { marginBottom: 16, opacity: 0.8 },
  label: { marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#fff' },
  mt: { marginTop: 16 },
});
