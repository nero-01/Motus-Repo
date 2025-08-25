import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    setReminders(scheduled);
  };

  const handleCancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setReminders([]);
    Alert.alert('Reminders cancelled', 'All scheduled reminders have been cancelled.');
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
            </View>
          ))
        )}
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