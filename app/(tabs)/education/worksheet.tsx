import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import * as Speech from 'expo-speech';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';
import { WORKSHEETS, type Worksheet } from './worksheetsData';

function getDifficultyStars(difficulty: number) {
  return '⭐'.repeat(difficulty);
}

/** Parse "a+b" and return the sum; otherwise return null. */
function parseAddition(problem: string): number | null {
  const match = problem.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10) + parseInt(match[2], 10);
}

/** Build answer options: one correct, three wrong (nearby numbers). */
function getAnswerOptions(correct: number): number[] {
  const used = new Set<number>([correct]);
  const options = [correct];
  for (let offset of [1, 2, -1, -2, 3, -3]) {
    if (options.length >= 4) break;
    const n = correct + offset;
    if (n >= 0 && n <= 20 && !used.has(n)) {
      used.add(n);
      options.push(n);
    }
  }
  while (options.length < 4) {
    const n = Math.max(0, correct + (options.length - 2));
    if (!used.has(n)) {
      used.add(n);
      options.push(n);
    } else {
      used.add(n + 5);
      options.push(n + 5);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

/** Build word options: one correct + three wrong from the same list. */
function getWordOptions(correctWord: string, allWords: string[]): string[] {
  const others = allWords.filter((w) => w !== correctWord);
  const wrong = others.length >= 3 ? others.sort(() => Math.random() - 0.5).slice(0, 3) : others;
  return [correctWord, ...wrong].sort(() => Math.random() - 0.5);
}

/** Shuffle array in place and return it. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pool of simple addition problems (1–5 + 1–5) for random selection each attempt. */
const ADDITION_PROBLEM_POOL: string[] = [];
for (let a = 1; a <= 5; a++) {
  for (let b = 1; b <= 5; b++) {
    ADDITION_PROBLEM_POOL.push(`${a}+${b}`);
  }
}

interface SimpleAdditionWorksheetProps {
  worksheet: Worksheet;
  onComplete: (accuracy: number) => void;
}

function SimpleAdditionWorksheet({ worksheet, onComplete }: SimpleAdditionWorksheetProps) {
  const [selectedByIndex, setSelectedByIndex] = useState<Record<number, number>>({});
  const [showReview, setShowReview] = useState(false);

  const problems = useMemo(
    () => shuffle([...ADDITION_PROBLEM_POOL]).slice(0, 4),
    []
  );

  const problemsWithAnswers = useMemo(() => {
    return problems.map((prob) => {
      const correct = parseAddition(prob);
      return {
        problem: prob,
        correct: correct ?? 0,
        options: getAnswerOptions(correct ?? 0),
      };
    });
  }, [problems]);

  const handleSelect = (problemIndex: number, value: number) => {
    setSelectedByIndex((prev) => ({ ...prev, [problemIndex]: value }));
  };

  const handleDone = () => {
    const total = problemsWithAnswers.length;
    if (total === 0) {
      onComplete(0);
      return;
    }
    setShowReview(true);
  };

  const handleSeeScore = () => {
    const total = problemsWithAnswers.length;
    let correct = 0;
    problemsWithAnswers.forEach((p, i) => {
      if (selectedByIndex[i] === p.correct) correct++;
    });
    onComplete(Math.round((100 * correct) / total));
  };

  // Review screen: show right/wrong for each problem, then "See my score"
  if (showReview) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.addReviewScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.addReviewTitle}>Check your answers</Text>
          <Text style={styles.addReviewSubtitle}>Here's what was right and wrong.</Text>
          <View style={styles.addReviewList}>
            {problemsWithAnswers.map((item, i) => {
              const chosen = selectedByIndex[i];
              const isCorrect = chosen === item.correct;
              return (
                <View
                  key={i}
                  style={[
                    styles.addReviewItemWrap,
                    isCorrect ? styles.addReviewItemCorrect : styles.addReviewItemWrong,
                  ]}
                >
                  <Text style={styles.addReviewItemProblem}>{item.problem} = {item.correct}</Text>
                  <View style={styles.addReviewItemResult}>
                    {isCorrect ? (
                      <Text style={styles.addReviewCorrectText}>✓ Correct! You picked {chosen}.</Text>
                    ) : (
                      <>
                        <Text style={styles.addReviewWrongText}>
                          ✗ You picked {chosen ?? '—'}. Correct answer is {item.correct}.
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.finishButton, styles.addFinishButton]}
            onPress={handleSeeScore}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>See my score</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addScrollContent}>
        <Text style={styles.addTitle}>{worksheet.title}</Text>
        <Text style={styles.addInstructions}>Tap the correct answer for each.</Text>
        <View style={styles.addList}>
          {problemsWithAnswers.map((item, i) => (
            <View key={i} style={styles.addItemWrap}>
              <Text style={styles.addItem}>{item.problem} = ?</Text>
              <View style={styles.addOptions}>
                {item.options.map((opt) => {
                  const selected = selectedByIndex[i] === opt;
                  const correct = item.correct === opt;
                  const showCorrect = selectedByIndex[i] != null;
                  const isRightAnswer = showCorrect && selected && correct;
                  const isWrongAnswer = showCorrect && selected && !correct;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.addOptionBtn,
                        selected && styles.addOptionBtnSelected,
                        isRightAnswer && styles.addOptionBtnCorrect,
                        isWrongAnswer && styles.addOptionBtnWrong,
                      ]}
                      onPress={() => handleSelect(i, opt)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.addOptionText,
                          selected && styles.addOptionTextSelected,
                          isRightAnswer && styles.addOptionTextCorrect,
                          isWrongAnswer && styles.addOptionTextWrong,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.finishButton, styles.addFinishButton]}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>I'm done! ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SightWordsWorksheetProps {
  worksheet: Worksheet;
  onComplete: (accuracy: number) => void;
}

function SightWordsWorksheet({ worksheet, onComplete }: SightWordsWorksheetProps) {
  const words = (worksheet.content?.words as string[] | undefined) ?? [];
  const [selectedByIndex, setSelectedByIndex] = useState<Record<number, string>>({});
  const [showReview, setShowReview] = useState(false);

  const [promptsWithOptions] = useState(() => {
    const shuffled = shuffle([...words]);
    return shuffled.map((word) => ({
      target: word,
      options: getWordOptions(word, words),
    }));
  });

  const handleSelect = (questionIndex: number, word: string) => {
    setSelectedByIndex((prev) => ({ ...prev, [questionIndex]: word }));
  };

  const handleDone = () => {
    if (promptsWithOptions.length === 0) {
      onComplete(0);
      return;
    }
    setShowReview(true);
  };

  const handleSeeScore = () => {
    const total = promptsWithOptions.length;
    let correct = 0;
    promptsWithOptions.forEach((p, i) => {
      if (selectedByIndex[i] === p.target) correct++;
    });
    onComplete(Math.round((100 * correct) / total));
  };

  if (showReview) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.sightScroll}
          contentContainerStyle={styles.sightReviewScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sightReviewTitle}>Check your answers</Text>
          <Text style={styles.sightReviewSubtitle}>Here's what was right and wrong.</Text>
          <View style={styles.sightReviewList}>
            {promptsWithOptions.map((item, i) => {
              const chosen = selectedByIndex[i];
              const isCorrect = chosen === item.target;
              return (
                <View
                  key={i}
                  style={[
                    styles.sightReviewItemWrap,
                    isCorrect ? styles.sightReviewItemCorrect : styles.sightReviewItemWrong,
                  ]}
                >
                  <Text style={styles.sightReviewItemPrompt}>Word: "{item.target}"</Text>
                  {isCorrect ? (
                    <Text style={styles.sightReviewCorrectText}>✓ Correct! You picked "{chosen}".</Text>
                  ) : (
                    <Text style={styles.sightReviewWrongText}>
                      ✗ You picked "{chosen ?? '—'}". Correct: "{item.target}".
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.sightBottomBar}>
          <TouchableOpacity
            style={[styles.finishButton, styles.sightFinishButton]}
            onPress={handleSeeScore}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>See my score</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const speakWord = (word: string) => {
    Speech.speak(word, { language: 'en', rate: 0.9 });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.sightScroll}
        contentContainerStyle={styles.sightScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sightTitle}>{worksheet.title}</Text>
        <Text style={styles.sightInstructions}>
          Tap the speaker to hear the word, then tap the word you hear.
        </Text>
        <View style={styles.sightList}>
          {promptsWithOptions.map((item, i) => (
            <View key={i} style={styles.sightItemWrap}>
              <Text style={styles.sightItemPrompt}>Tap the word you hear:</Text>
              <TouchableOpacity
                style={styles.sightHearButton}
                onPress={() => speakWord(item.target)}
                activeOpacity={0.8}
              >
                <Text style={styles.sightHearButtonText}>🔊 Hear word</Text>
              </TouchableOpacity>
              <View style={styles.sightOptions}>
                {item.options.map((opt) => {
                  const selected = selectedByIndex[i] === opt;
                  const isCorrect = item.target === opt;
                  const showResult = selectedByIndex[i] != null;
                  const isRight = showResult && selected && isCorrect;
                  const isWrong = showResult && selected && !isCorrect;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.sightOptionBtn,
                        selected && styles.sightOptionBtnSelected,
                        isRight && styles.sightOptionBtnCorrect,
                        isWrong && styles.sightOptionBtnWrong,
                      ]}
                      onPress={() => handleSelect(i, opt)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sightOptionText,
                          selected && styles.sightOptionTextSelected,
                          isRight && styles.sightOptionTextCorrect,
                          isWrong && styles.sightOptionTextWrong,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.sightBottomBar}>
        <TouchableOpacity
          style={[styles.finishButton, styles.sightFinishButton]}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>I'm done! ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WorksheetScreen() {
  const { id, _t } = useLocalSearchParams<{ id: string; _t?: string }>();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [score, setScore] = useState<number | null>(null);

  const worksheet = id ? WORKSHEETS.find((w) => w.id === id) : null;
  const sessionKey = _t ?? id ?? '0';

  const letterToShow = useMemo(() => {
    if (!worksheet || worksheet.type !== 'letter_tracing') return 'A';
    const letters = (worksheet.content?.letters as string[] | undefined) ?? ['A'];
    return shuffle([...letters])[0] ?? 'A';
  }, []);

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
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <LetterTracing
            letter={letterToShow}
            onComplete={handleComplete}
            onNext={() => {}}
          />
        </View>
      </View>
    );
  }

  if (type === 'color_mixing') {
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <ColorMixing onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'animal_habitats') {
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <AnimalHabitats onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'community_helpers') {
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <CommunityHelpers onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'math') {
    return (
      <View key={sessionKey} style={styles.container}>
        <SimpleAdditionWorksheet
          worksheet={worksheet}
          onComplete={handleComplete}
        />
      </View>
    );
  }

  if (type === 'reading') {
    return (
      <View key={sessionKey} style={styles.container}>
        <SightWordsWorksheet worksheet={worksheet} onComplete={handleComplete} />
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
  // Simple Addition – compact, no scroll
  addScrollContent: {
    flex: 1,
    padding: 12,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  addTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  addInstructions: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  addList: {
    marginBottom: 10,
  },
  addItemWrap: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  addItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  addOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  addOptionBtn: {
    minWidth: 48,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  addOptionBtnSelected: {
    borderColor: '#006A60',
    backgroundColor: '#e8f5f3',
  },
  addOptionBtnCorrect: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  addOptionBtnWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  addOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  addOptionTextSelected: {
    color: '#006A60',
  },
  addOptionTextCorrect: {
    color: '#28a745',
  },
  addOptionTextWrong: {
    color: '#dc3545',
  },
  addFinishButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 160,
  },
  // Simple Addition – review (right/wrong) before score
  addReviewScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  addReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  addReviewSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  addReviewList: {
    marginBottom: 24,
  },
  addReviewItemWrap: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  addReviewItemCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  addReviewItemWrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  addReviewItemProblem: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  addReviewItemResult: {},
  addReviewCorrectText: {
    fontSize: 15,
    color: '#155724',
    fontWeight: '600',
  },
  addReviewWrongText: {
    fontSize: 15,
    color: '#721c24',
    fontWeight: '600',
  },
  // Sight Words – compact, tappable, bottom button always visible
  sightScroll: {
    flex: 1,
  },
  sightScrollContent: {
    padding: 12,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sightBottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sightTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  sightInstructions: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  sightList: {
    marginBottom: 12,
  },
  sightItemWrap: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sightItemPrompt: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  sightItemTarget: {
    fontWeight: '700',
    color: '#006A60',
  },
  sightHearButton: {
    backgroundColor: '#006A60',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sightHearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  sightOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  sightOptionBtn: {
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  sightOptionBtnSelected: {
    borderColor: '#006A60',
    backgroundColor: '#e8f5f3',
  },
  sightOptionBtnCorrect: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  sightOptionBtnWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  sightOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  sightOptionTextSelected: {
    color: '#006A60',
  },
  sightOptionTextCorrect: {
    color: '#28a745',
  },
  sightOptionTextWrong: {
    color: '#dc3545',
  },
  sightFinishButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 160,
  },
  // Sight Words – review
  sightReviewScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  sightReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  sightReviewSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  sightReviewList: {
    marginBottom: 24,
  },
  sightReviewItemWrap: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  sightReviewItemCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  sightReviewItemWrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  sightReviewItemPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  sightReviewCorrectText: {
    fontSize: 15,
    color: '#155724',
    fontWeight: '600',
  },
  sightReviewWrongText: {
    fontSize: 15,
    color: '#721c24',
    fontWeight: '600',
  },
});
