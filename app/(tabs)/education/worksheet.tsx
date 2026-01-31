import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';
import { WORKSHEETS, type Worksheet } from './worksheetsData';

function getDifficultyStars(difficulty: number) {
  return '⭐'.repeat(difficulty);
}

export default function WorksheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [score, setScore] = useState<number | null>(null);

  const worksheet = id ? WORKSHEETS.find((w) => w.id === id) : null;

  const handleComplete = (accuracy: number) => {
    setScore(accuracy);
  };

  const handleDone = () => {
    router.back();
  };

  if (!worksheet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Worksheet not found.</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.doneButton}>
          Go back
        </Button>
      </View>
    );
  }

  if (score !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>Nice work!</Text>
          <Text style={styles.resultScore}>Score: {score}%</Text>
          <Text style={styles.resultSubtitle}>You did great. Tap Done to go back.</Text>
          <TouchableOpacity
            style={styles.doneButtonBig}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const type = worksheet.type;

  if (type === 'letter_tracing') {
    const letters = (worksheet.content?.letters as string[] | undefined) ?? ['A'];
    const firstLetter = letters[0] ?? 'A';
    return (
      <View style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <LetterTracing
            letter={firstLetter}
            onComplete={handleComplete}
            onNext={() => {}}
          />
        </View>
      </View>
    );
  }

  if (type === 'color_mixing') {
    return (
      <View style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <ColorMixing onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'animal_habitats') {
    return (
      <View style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <AnimalHabitats onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'community_helpers') {
    return (
      <View style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <CommunityHelpers onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'math' || type === 'reading') {
    const instructions =
      (worksheet.content?.instructions as string | undefined) ?? 'Complete the activity.';
    const items =
      type === 'math'
        ? ((worksheet.content?.problems as string[] | undefined) ?? [])
        : ((worksheet.content?.words as string[] | undefined) ?? []);
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.simpleScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.simpleTitle}>{worksheet.title}</Text>
          <Text style={styles.simpleInstructions}>{instructions}</Text>
          {items.length > 0 && (
            <View style={styles.simpleList}>
              {items.map((item, i) => (
                <View key={i} style={styles.simpleItemWrap}>
                  <Text style={styles.simpleItem}>
                    {type === 'math' ? `${item} = ?` : item}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => handleComplete(85)}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>I'm done! ✓</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>This worksheet type is not supported yet.</Text>
      <Button mode="contained" onPress={() => router.back()} style={styles.doneButton}>
        Go back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  worksheetArea: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  doneButton: {
    marginTop: 24,
    marginHorizontal: 24,
  },
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 28,
    fontWeight: '700',
    color: '#006A60',
    marginBottom: 12,
  },
  resultSubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButtonBig: {
    backgroundColor: '#006A60',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 28,
    minWidth: 180,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  simpleScrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  simpleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  simpleInstructions: {
    fontSize: 18,
    color: '#444',
    lineHeight: 26,
    marginBottom: 24,
  },
  simpleList: {
    marginBottom: 32,
  },
  simpleItemWrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  simpleItem: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#006A60',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignSelf: 'center',
    minWidth: 200,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
});
