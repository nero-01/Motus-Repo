import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import * as ImagePicker from 'expo-image-picker';

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const router = useRouter();

  // Set up notification handler
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const sub1 = Notifications.addNotificationReceivedListener(() => {});
    const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const ensureNotificationPermission = async () => {
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.status === 'granted') {
        return true;
      }

      if (!existing.canAskAgain) {
        Alert.alert(
          'Notifications disabled',
          'Notifications are turned off for MotusTots. You can enable them in your device Settings if you want to receive reminders.'
        );
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Notifications were not enabled. You can update this later from Settings.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      Alert.alert('Error', 'Unable to check notification permissions right now.');
      return false;
    }
  };

  // Activities for the week (for notifications)
  const weekActivities = [
    { day: 'Monday', activity: null as string | null },
    { day: 'Tuesday', activity: 'Bring along a poster / object relating to the theme. Karate' },
    { day: 'Wednesday', activity: 'Speech & Drama' },
    { day: 'Thursday', activity: null },
    { day: 'Friday', activity: null },
  ];

  const handleEnableReminders = async () => {
    try {
      const hasPermission = await ensureNotificationPermission();
      if (!hasPermission) return;

      const now = new Date();
      let scheduledCount = 0;

      for (let i = 0; i < weekActivities.length; i++) {
        const { day, activity } = weekActivities[i];
        if (!activity) continue;

        const dayOfWeek = i + 1;
        let notificationDate = new Date(now);
        let dayBefore = dayOfWeek - 1;
        if (dayBefore === 0) dayBefore = 7;
        notificationDate.setDate(now.getDate() + ((dayBefore + 7 - now.getDay()) % 7));
        notificationDate.setHours(20, 0, 0, 0);

        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 7);
        }

        const secondsFromNow = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${day}`,
            body: activity,
            sound: true,
          },
          trigger: {
            seconds: secondsFromNow,
          } as any,
        });

        scheduledCount++;
      }

      setRemindersEnabled(true);
      Alert.alert('Reminders enabled', `Successfully scheduled ${scheduledCount} reminders for the week.`);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      const hasPermission = await ensureNotificationPermission();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from MotusTots!',
          sound: true,
        },
        trigger: {
          seconds: 5,
        } as any,
      });

      Alert.alert('Test Notification', 'A test notification will appear in 5 seconds.');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Currently scheduled notifications:', scheduled);
      Alert.alert('Scheduled Notifications', `Found ${scheduled.length} scheduled notifications. Check console for details.`);
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      Alert.alert('Error', 'Failed to check scheduled notifications.');
    }
  };

  const resetRemindersState = () => {
    setRemindersEnabled(false);
    Notifications.cancelAllScheduledNotificationsAsync()
      .then(() => {
        Alert.alert(
          'Reminders cleared',
          'All scheduled reminders have been cancelled. You can enable them again at any time.'
        );
      })
      .catch((error) => {
        console.error('Error cancelling notifications:', error);
        Alert.alert('Error', 'Failed to clear scheduled reminders.');
      });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPlannerImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Image
          source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
          style={{ width: 320, height: 430, resizeMode: 'contain', borderRadius: 12 }}
        />
        <TouchableOpacity
          style={{ marginTop: 10, backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
          onPress={handlePickImage}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>This Week's Reminders</Text>
        {weekActivities.map(({ day, activity }) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ fontWeight: '600', width: 90 }}>{day}:</Text>
            <Text style={{ color: activity ? '#222' : '#bbb', flex: 1, flexWrap: 'wrap' }} numberOfLines={3} ellipsizeMode="tail">{activity || 'No reminder'}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={{ marginTop: 12, alignSelf: 'flex-end', backgroundColor: '#006A60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
          onPress={() => router.push('/features/settings/reminders')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage Reminders</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 20, marginHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: remindersEnabled ? '#bdbdbd' : '#006A60',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 6,
            marginBottom: 10,
          }}
          onPress={handleEnableReminders}
          disabled={remindersEnabled}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
            {remindersEnabled ? 'Reminders Enabled' : 'Enable Reminders for the Week'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#FF9800', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
          onPress={handleTestNotification}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Test Notification (5s)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#9C27B0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
          onPress={checkScheduledNotifications}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Check Scheduled</Text>
        </TouchableOpacity>
        {remindersEnabled && (
          <TouchableOpacity
            style={{ backgroundColor: '#FF5722', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
            onPress={resetRemindersState}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Reset State</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
