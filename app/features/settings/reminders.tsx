import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

async function loadNotificationsModule() {
  try {
    return await import('expo-notifications');
  } catch (error) {
    console.warn('Notifications unavailable in this environment:', error);
    return null;
  }
}

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Array<{ identifier: string; content: { title?: string; body?: string } }>>([]);
  const router = useRouter();

  useEffect(() => {
    void loadReminders();
  }, []);

  const loadReminders = async () => {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) {
      setReminders([]);
      return;
    }
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    setReminders(scheduled as Array<{ identifier: string; content: { title?: string; body?: string } }>);
  };

  const handleCancelAll = async () => {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) {
      Alert.alert('Unavailable in Expo Go', 'Notifications require a development build on SDK 53+.');
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    setReminders([]);
    Alert.alert('Reminders cancelled', 'All scheduled reminders have been cancelled.');
  };

  const handleCancelOne = async (id: string) => {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) {
      Alert.alert('Unavailable in Expo Go', 'Notifications require a development build on SDK 53+.');
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(id);
    await loadReminders();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Manage Reminders</Text>
        {reminders.length === 0 ? (
          <Text style={{ color: '#666', fontSize: 16, marginBottom: 16 }}>No reminders scheduled.</Text>
        ) : (
          reminders.map((reminder, idx) => (
            <View key={reminder.identifier || idx} style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 }}>
              <Text style={{ fontWeight: 'bold' }}>{reminder.content.title}</Text>
              <Text>{reminder.content.body}</Text>
              <Text style={{ color: '#888', marginTop: 4, fontSize: 12 }}>ID: {reminder.identifier}</Text>
              <TouchableOpacity
                style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#8E1B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }}
                onPress={() => {
                  void handleCancelOne(reminder.identifier);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <TouchableOpacity
          style={{ marginTop: 8, backgroundColor: '#006A60', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6 }}
          onPress={() => {
            void loadReminders();
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#B00020', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6 }}
          onPress={handleCancelAll}
          disabled={reminders.length === 0}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel All Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16, alignSelf: 'flex-start' }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#006A60', fontWeight: 'bold' }}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 