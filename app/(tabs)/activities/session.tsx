import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityService } from '../../../src/modules/activities/services/activityService';
import type { Activity, ActivitySession } from '../../../src/modules/activities/types';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActivitySessionScreen() {
  const { id: activityId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [session, setSession] = useState<ActivitySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!activityId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const [activityData, sessionData] = await Promise.all([
          ActivityService.getActivityById(activityId),
          ActivityService.startActivitySession(activityId),
        ]);
        if (mounted) {
          setActivity(activityData ?? null);
          setSession(sessionData);
          startTimeRef.current = Date.now();
        }
      } catch {
        if (mounted) setActivity(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activityId]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleComplete = () => {
    if (!activity || !session) return;
    Alert.alert(
      'Complete activity?',
      `Mark "${activity.title}" as completed? You can add a quick rating.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            setCompleting(true);
            ActivityService.endActivitySession(session.id);
            ActivityService.markAsCompleted(activity.id)
              .then(() => {
                Alert.alert('Done!', 'Activity completed. Great job!', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              })
              .catch(() => {
                setCompleting(false);
                Alert.alert('Error', 'Could not save completion.');
              });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Starting activity…</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Activity not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const durationMinutes = activity.duration ?? 0;
  const targetSeconds = durationMinutes * 60;
  const isOverTime = targetSeconds > 0 && elapsedSeconds >= targetSeconds;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Time</Text>
          <Text style={[styles.timerValue, isOverTime && styles.timerOver]}>
            {formatElapsed(elapsedSeconds)}
          </Text>
          {durationMinutes > 0 && (
            <Text style={styles.timerGoal}>Goal: {durationMinutes} min</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.description}>{activity.description}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{activity.duration} min</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{activity.difficulty}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>Ages {activity.ageRange}</Text>
          </View>
        </View>

        {(activity.materials?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What you need</Text>
            {activity.materials!.map((item, i) => (
              <Text key={i} style={styles.listItem}>• {item}</Text>
            ))}
          </View>
        )}

        {(activity.instructions?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {activity.instructions!.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={completing}
          activeOpacity={0.8}
        >
          <Text style={styles.completeBtnText}>
            {completing ? 'Saving…' : 'Complete activity'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#006A60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  timerCard: {
    backgroundColor: '#006A60',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
  },
  timerOver: {
    color: '#FFE082',
  },
  timerGoal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#006A60',
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  completeBtn: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomPad: {
    height: 24,
  },
});
