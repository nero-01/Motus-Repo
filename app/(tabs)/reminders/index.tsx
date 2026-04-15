import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import ParentSheetImage from '../../../assets/parent_involvement_sheet_winter.png';
import * as ImagePicker from 'expo-image-picker';

export default function RemindersTabScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [plannerImage, setPlannerImage] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const activeScanControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Set up notification handler
  useEffect(() => {
    // Configure how notifications are handled when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (activeScanControllerRef.current) {
        activeScanControllerRef.current.abort();
      }
    };
  }, []);

  // Activities for the week (for notifications)
  const weekActivities = [
    { day: 'Monday', activity: null },
    { day: 'Tuesday', activity: 'Bring along a poster / object relating to the theme. Karate' },
    { day: 'Wednesday', activity: 'Speech & Drama' },
    { day: 'Thursday', activity: null },
    { day: 'Friday', activity: null },
  ];

  const handleEnableReminders = async () => {
    try {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in your settings.');
        return;
      }

      console.log('Scheduling notifications...');
      const now = new Date();
      let scheduledCount = 0;
      
      for (let i = 0; i < weekActivities.length; i++) {
        const { day, activity } = weekActivities[i];
        if (!activity) continue;
        
        const dayOfWeek = i + 1; // Monday=1, Sunday=0
        let notificationDate = new Date(now);
        // Calculate the day before the activity (dayOfWeek - 1)
        let dayBefore = dayOfWeek - 1;
        if (dayBefore === 0) dayBefore = 7; // Sunday becomes 7
        notificationDate.setDate(now.getDate() + ((dayBefore + 7 - now.getDay()) % 7));
        notificationDate.setHours(20, 0, 0, 0); // 8:00 PM
        
        // If the time has already passed today, schedule for next week
        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 7);
        }
        
        console.log(`Scheduling notification for ${day} (day before) at ${notificationDate.toLocaleString()}`);
        
                // Calculate seconds from now until the notification time
        const secondsFromNow = Math.max(1, Math.floor((notificationDate.getTime() - Date.now()) / 1000));
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${day}`,
            body: activity,
            sound: true,
          },
          trigger: {
            seconds: secondsFromNow,
          } as any,
        });
        
        console.log(`Notification scheduled with ID: ${notificationId}`);
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
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in your settings.');
        return;
      }

      // Schedule a test notification for 5 seconds from now
      const testDate = new Date(Date.now() + 5000);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from MotusTots!',
          sound: true,
        },
        trigger: {
          seconds: 5,
        } as any,
      });
      
      console.log('Test notification scheduled with ID:', notificationId);
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
    Alert.alert('State Reset', 'Reminders state has been reset. You can now enable reminders again.');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      setPlannerImage(selectedAsset.uri);
      await handleScanImage(selectedAsset.base64 ?? null);
    }
  };

  const handleScanImage = async (imageBase64: string | null) => {
    if (!imageBase64) {
      Alert.alert('Scan unavailable', 'Could not read the selected image for scanning.');
      return;
    }

    const googleVisionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
    if (!googleVisionApiKey) {
      Alert.alert(
        'Google Vision not configured',
        'Set EXPO_PUBLIC_GOOGLE_VISION_API_KEY to enable planner image scanning.'
      );
      return;
    }

    const controller = new AbortController();
    activeScanControllerRef.current = controller;
    setIsScanningImage(true);

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageBase64 },
                features: [{ type: 'TEXT_DETECTION' }],
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Vision request failed (${response.status})`);
      }

      const data = await response.json();
      const extractedText: string | undefined =
        data?.responses?.[0]?.fullTextAnnotation?.text || data?.responses?.[0]?.textAnnotations?.[0]?.description;

      if (extractedText?.trim()) {
        Alert.alert('Scan complete', 'Image text detected successfully.');
      } else {
        Alert.alert('Scan complete', 'No readable text detected in this image.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Vision scan error:', error);
      Alert.alert('Scan failed', 'Could not scan the image. Please try again.');
    } finally {
      if (activeScanControllerRef.current === controller) {
        activeScanControllerRef.current = null;
      }
      setIsScanningImage(false);
    }
  };

  const handleCancelScan = () => {
    if (activeScanControllerRef.current) {
      activeScanControllerRef.current.abort();
      activeScanControllerRef.current = null;
    }
    setIsScanningImage(false);
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Image
            source={plannerImage ? { uri: plannerImage } : ParentSheetImage}
            style={{ width: 320, height: 430, resizeMode: 'contain', borderRadius: 12 }}
          />
          <TouchableOpacity
            style={{ marginTop: 10, backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
            onPress={() => void handlePickImage()}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Weekly Planner</Text>
          </TouchableOpacity>
        </View>
        {/* Show list of reminders for the week */}
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
        {/* Bottom buttons section */}
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

      <Modal visible={isScanningImage} transparent animationType="fade">
        <View style={styles.scanOverlay}>
          <View style={styles.scanCard}>
            <ActivityIndicator size="large" color="#006A60" />
            <Text style={styles.scanTitle}>Scanning image…</Text>
            <Text style={styles.scanSubtitle}>Extracting text from your weekly planner</Text>
            <TouchableOpacity style={styles.cancelScanButton} onPress={handleCancelScan}>
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scanCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  scanTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  scanSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  cancelScanButton: {
    marginTop: 20,
    backgroundColor: '#B00020',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelScanText: {
    color: '#fff',
    fontWeight: '700',
  },
});