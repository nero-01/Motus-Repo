import React, { useState, useMemo, useEffect } from 'react';
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
import Svg, { Polygon, Circle, Rect, Ellipse } from 'react-native-svg';
import { playSuccessSound, playFailSound, playVictorySound, playDefeatSound } from '../../../utils/worksheetSounds';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';
import { WORKSHEETS, type Worksheet } from './worksheetsData';
import { getEducationLevel } from './educationLevel';

const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

function parseLevel(levelParam: string | undefined): number {
  if (levelParam == null) return MIN_LEVEL;
  const n = parseInt(levelParam, 10);
  return Number.isFinite(n) ? Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n)) : MIN_LEVEL;
}

function getDifficultyStars(difficulty: number) {
  return '⭐'.repeat(Math.min(5, Math.max(1, difficulty)));
}

/** Parse "a+b" and return the sum; otherwise return null. */
function parseAddition(problem: string): number | null {
  const match = problem.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10) + parseInt(match[2], 10);
}

/** Build answer options: one correct, three wrong (nearby numbers). maxSum for level scaling. */
function getAnswerOptions(correct: number, maxSum: number = 30): number[] {
  const used = new Set<number>([correct]);
  const options = [correct];
  for (let offset of [1, 2, -1, -2, 3, -3]) {
    if (options.length >= 4) break;
    const n = correct + offset;
    if (n >= 0 && n <= maxSum && !used.has(n)) {
      used.add(n);
      options.push(n);
    }
  }
  while (options.length < 4) {
    const n = Math.max(0, Math.min(maxSum, correct + (options.length - 2)));
    if (!used.has(n)) {
      used.add(n);
      options.push(n);
    } else {
      const alt = Math.max(0, Math.min(maxSum, n + 5));
      used.add(alt);
      options.push(alt);
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

/** Build addition problem pool by level: level 1–2 small numbers/few, level 9–10 larger/more. */
function getAdditionConfig(level: number): { maxAddend: number; count: number } {
  if (level <= 2) return { maxAddend: 5, count: 4 };
  if (level <= 4) return { maxAddend: 8, count: 5 };
  if (level <= 6) return { maxAddend: 10, count: 6 };
  if (level <= 8) return { maxAddend: 12, count: 7 };
  return { maxAddend: 15, count: 8 };
}

function buildAdditionPool(maxAddend: number): string[] {
  const pool: string[] = [];
  for (let a = 1; a <= maxAddend; a++) {
    for (let b = 1; b <= maxAddend; b++) {
      pool.push(`${a}+${b}`);
    }
  }
  return pool;
}

interface SimpleAdditionWorksheetProps {
  worksheet: Worksheet;
  level: number;
  onComplete: (accuracy: number) => void;
}

function SimpleAdditionWorksheet({ worksheet, level, onComplete }: SimpleAdditionWorksheetProps) {
  const [selectedByIndex, setSelectedByIndex] = useState<Record<number, number>>({});
  const [showReview, setShowReview] = useState(false);

  const { maxAddend, count } = getAdditionConfig(level);
  const problems = useMemo(() => {
    const pool = buildAdditionPool(maxAddend);
    return shuffle([...pool]).slice(0, count);
  }, [level, maxAddend, count]);

  const maxSum = maxAddend * 2;
  const problemsWithAnswers = useMemo(() => {
    return problems.map((prob) => {
      const correct = parseAddition(prob);
      return {
        problem: prob,
        correct: correct ?? 0,
        options: getAnswerOptions(correct ?? 0, maxSum),
      };
    });
  }, [problems, maxSum]);

  const handleSelect = (problemIndex: number, value: number) => {
    const problem = problemsWithAnswers[problemIndex];
    const isCorrect = problem && value === problem.correct;
    if (isCorrect) playSuccessSound();
    else playFailSound();
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
    const score = Math.round((100 * correct) / total);
    // Play victory sound for scores >= 70%, defeat sound for lower scores
    if (score >= 70) {
      playVictorySound();
    } else {
      playDefeatSound();
    }
    onComplete(score);
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
      <ScrollView
        style={styles.addScrollView}
        contentContainerStyle={styles.addScrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>
    </View>
  );
}

/** Number of sight-word prompts by level (1–10). */
function getSightWordsCount(level: number): number {
  if (level <= 2) return 4;
  if (level <= 5) return 6;
  if (level <= 8) return 8;
  return 10;
}

/** Completely different word lists per level band: higher level = different (harder) words. */
const SIGHT_WORDS_BY_LEVEL: string[][] = [
  ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from'], // 1–2
  ['said', 'each', 'she', 'how', 'when', 'some', 'come', 'would', 'could', 'should', 'there', 'their', 'what', 'about', 'out', 'many', 'then', 'them', 'these', 'so'], // 3–4
  ['other', 'into', 'more', 'make', 'than', 'first', 'been', 'its', 'who', 'now', 'people', 'my', 'made', 'over', 'did', 'down', 'only', 'way', 'find', 'use'], // 5–6
  ['water', 'long', 'little', 'very', 'after', 'words', 'called', 'just', 'where', 'most', 'know', 'get', 'through', 'back', 'much', 'before', 'right', 'means', 'old', 'any'], // 7–8
  ['same', 'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put', 'end', 'does', 'another', 'well', 'large', 'must'], // 9–10
];

function getSightWordsListForLevel(level: number): string[] {
  const band = level <= 2 ? 0 : level <= 4 ? 1 : level <= 6 ? 2 : level <= 8 ? 3 : 4;
  return SIGHT_WORDS_BY_LEVEL[band] ?? SIGHT_WORDS_BY_LEVEL[0];
}

interface SightWordsWorksheetProps {
  worksheet: Worksheet;
  level: number;
  onComplete: (accuracy: number) => void;
}

function SightWordsWorksheet({ worksheet, level, onComplete }: SightWordsWorksheetProps) {
  const wordCount = getSightWordsCount(level);
  const words = useMemo(() => {
    const list = getSightWordsListForLevel(level);
    const take = Math.max(1, Math.min(wordCount, list.length));
    return shuffle([...list]).slice(0, take);
  }, [level]);
  const [selectedByIndex, setSelectedByIndex] = useState<Record<number, string>>({});
  const [showReview, setShowReview] = useState(false);

  const promptsWithOptions = useMemo(() => {
    const shuffled = shuffle([...words]);
    return shuffled.map((word) => ({
      target: word,
      options: getWordOptions(word, words),
    }));
  }, [words]);

  const handleSelect = (questionIndex: number, word: string) => {
    const prompt = promptsWithOptions[questionIndex];
    const isCorrect = prompt && word === prompt.target;
    if (isCorrect) playSuccessSound();
    else playFailSound();
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
    const score = Math.round((100 * correct) / total);
    // Play victory sound for scores >= 70%, defeat sound for lower scores
    if (score >= 70) {
      playVictorySound();
    } else {
      playDefeatSound();
    }
    onComplete(score);
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

/** Geometry question configuration by level */
interface GeometryQuestion {
  question: string;
  correct: string;
  options: string[];
}

/** Extract shape name from question text (for visualization next to the question). */
function extractShapeFromQuestion(question: string): string | null {
  const lowerQuestion = question.toLowerCase();

  // Disambiguate before generic word match: "slanted rectangle" describes a parallelogram, not a rectangle
  if (lowerQuestion.includes('slanted rectangle')) {
    return 'parallelogram';
  }

  // Check direct shape mentions; order matters so "parallelogram" wins over "rectangle" when both could match
  const shapeOrder = ['parallelogram', 'trapezoid', 'rectangle', 'triangle', 'square', 'circle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'oval', 'ellipse', 'diamond', 'rhombus', 'star'];
  for (const shape of shapeOrder) {
    if (lowerQuestion.includes(shape)) {
      if (shape === 'ellipse') return 'oval';
      if (shape === 'rhombus') return 'diamond';
      return shape;
    }
  }
  
  // Check for specific patterns (order matters - more specific first)
  if (lowerQuestion.includes('all sides equal and all angles equal')) {
    return 'square';
  }
  if (lowerQuestion.includes('4 equal sides')) {
    return 'square';
  }
  if (lowerQuestion.includes('0 sides') || lowerQuestion.includes('no sides')) {
    return 'circle';
  }
  if (lowerQuestion.includes('3 sides') && !lowerQuestion.includes('pentagon') && !lowerQuestion.includes('hexagon')) {
    return 'triangle';
  }
  if (lowerQuestion.includes('4 corners') || (lowerQuestion.includes('4 sides') && !lowerQuestion.includes('equal'))) {
    return 'rectangle';
  }
  if (lowerQuestion.includes('5 sides') || lowerQuestion.includes('shape with 5 sides')) {
    return 'pentagon';
  }
  if (lowerQuestion.includes('6 sides')) {
    return 'hexagon';
  }
  if (lowerQuestion.includes('7 sides')) {
    return 'heptagon';
  }
  if (lowerQuestion.includes('8 sides')) {
    return 'octagon';
  }
  return null;
}

/** Get color scheme for each shape */
function getShapeColors(shape: string): { fill: string; stroke: string } {
  const colorMap: Record<string, { fill: string; stroke: string }> = {
    circle: { fill: '#FFE5E5', stroke: '#FF6B6B' }, // Red
    triangle: { fill: '#FFF4E5', stroke: '#FFA500' }, // Orange
    square: { fill: '#E5F5FF', stroke: '#4A90E2' }, // Blue
    rectangle: { fill: '#E5FFE5', stroke: '#50C878' }, // Green
    pentagon: { fill: '#F0E5FF', stroke: '#9B59B6' }, // Purple
    hexagon: { fill: '#FFE5F5', stroke: '#E91E63' }, // Pink
    heptagon: { fill: '#E5FFFF', stroke: '#00CED1' }, // Cyan
    octagon: { fill: '#FFFACD', stroke: '#FFD700' }, // Gold
    oval: { fill: '#FFE5CC', stroke: '#FF8C42' }, // Dark Orange
    diamond: { fill: '#E5E5FF', stroke: '#6A5ACD' }, // Slate Blue
    star: { fill: '#FFFFE5', stroke: '#FFD700' }, // Yellow
    trapezoid: { fill: '#E5FFE5', stroke: '#32CD32' }, // Lime Green
    parallelogram: { fill: '#FFE5F0', stroke: '#FF69B4' }, // Hot Pink
  };
  return colorMap[shape.toLowerCase()] || { fill: '#e8f5f3', stroke: '#006A60' };
}

/** Shape component to render geometric shapes */
function ShapeVisualization({ shape, size = 60 }: { shape: string | null; size?: number }) {
  if (!shape) return null;

  const center = size / 2;
  const strokeWidth = 3;
  const colors = getShapeColors(shape);
  const strokeColor = colors.stroke;
  const fillColor = colors.fill;

  switch (shape.toLowerCase()) {
    case 'circle':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={center} cy={center} r={center - strokeWidth} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'triangle':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon
            points={`${center},${strokeWidth + 5} ${size - strokeWidth - 5},${size - strokeWidth - 5} ${strokeWidth + 5},${size - strokeWidth - 5}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'square':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Rect
            x={strokeWidth + 5}
            y={strokeWidth + 5}
            width={size - (strokeWidth + 5) * 2}
            height={size - (strokeWidth + 5) * 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'rectangle':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Rect
            x={strokeWidth + 8}
            y={strokeWidth + 5}
            width={size - (strokeWidth + 8) * 2}
            height={size - (strokeWidth + 5) * 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'pentagon': {
      const points = [];
      const radius = center - strokeWidth - 5;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'hexagon': {
      const points = [];
      const radius = center - strokeWidth - 5;
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'heptagon': {
      const points = [];
      const radius = center - strokeWidth - 5;
      for (let i = 0; i < 7; i++) {
        const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'octagon': {
      const points = [];
      const radius = center - strokeWidth - 5;
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'oval':
    case 'ellipse': {
      const rx = (size - strokeWidth * 2 - 10) / 2;
      const ry = (size - strokeWidth * 2 - 20) / 2;
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Ellipse cx={center} cy={center} rx={rx} ry={ry} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'diamond':
    case 'rhombus': {
      const points = [
        `${center},${strokeWidth + 5}`,
        `${size - strokeWidth - 5},${center}`,
        `${center},${size - strokeWidth - 5}`,
        `${strokeWidth + 5},${center}`,
      ];
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'star': {
      const points = [];
      const outerRadius = center - strokeWidth - 5;
      const innerRadius = outerRadius * 0.4;
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'trapezoid': {
      const topWidth = size * 0.5;
      const bottomWidth = size * 0.8;
      const height = size * 0.7;
      const topX = (size - topWidth) / 2;
      const bottomX = (size - bottomWidth) / 2;
      const topY = strokeWidth + 5;
      const bottomY = topY + height;
      const points = [
        `${topX},${topY}`,
        `${topX + topWidth},${topY}`,
        `${bottomX + bottomWidth},${bottomY}`,
        `${bottomX},${bottomY}`,
      ];
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    case 'parallelogram': {
      const offset = size * 0.15;
      const width = size * 0.7;
      const height = size * 0.6;
      const x = strokeWidth + 5;
      const y = (size - height) / 2;
      const points = [
        `${x + offset},${y}`,
        `${x + offset + width},${y}`,
        `${x + width},${y + height}`,
        `${x},${y + height}`,
      ];
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Polygon points={points.join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );
    }
    default:
      return null;
  }
}

function getGeometryConfig(level: number): { count: number } {
  if (level <= 2) return { count: 4 };
  if (level <= 5) return { count: 6 };
  if (level <= 8) return { count: 8 };
  return { count: 10 };
}

function buildGeometryQuestions(level: number): GeometryQuestion[] {
  const questions: GeometryQuestion[] = [];
  
  // Basic shape questions (levels 1-3)
  if (level <= 3) {
    questions.push(
      {
        question: 'How many sides does a triangle have?',
        correct: '3',
        options: ['2', '3', '4', '5'],
      },
      {
        question: 'How many sides does a square have?',
        correct: '4',
        options: ['3', '4', '5', '6'],
      },
      {
        question: 'What shape has 0 sides?',
        correct: 'Circle',
        options: ['Circle', 'Triangle', 'Square', 'Rectangle'],
      },
      {
        question: 'How many corners does a rectangle have?',
        correct: '4',
        options: ['2', '3', '4', '5'],
      },
      {
        question: 'What shape looks like an egg?',
        correct: 'Oval',
        options: ['Circle', 'Oval', 'Square', 'Triangle'],
      },
      {
        question: 'What shape has 4 sides that look like a diamond?',
        correct: 'Diamond',
        options: ['Square', 'Diamond', 'Circle', 'Triangle'],
      },
    );
  }
  
  // Intermediate questions (levels 4-6)
  if (level >= 4 && level <= 6) {
    questions.push(
      {
        question: 'How many sides does a pentagon have?',
        correct: '5',
        options: ['4', '5', '6', '7'],
      },
      {
        question: 'How many sides does a hexagon have?',
        correct: '6',
        options: ['5', '6', '7', '8'],
      },
      {
        question: 'What shape has 4 equal sides?',
        correct: 'Square',
        options: ['Rectangle', 'Square', 'Triangle', 'Circle'],
      },
      {
        question: 'What shape has 3 sides?',
        correct: 'Triangle',
        options: ['Square', 'Triangle', 'Circle', 'Rectangle'],
      },
      {
        question: 'What shape has 5 points like a star?',
        correct: 'Star',
        options: ['Circle', 'Star', 'Square', 'Triangle'],
      },
      {
        question: 'What shape has 4 sides with one pair parallel?',
        correct: 'Trapezoid',
        options: ['Square', 'Trapezoid', 'Circle', 'Triangle'],
      },
      {
        question: 'What shape looks like a slanted rectangle?',
        correct: 'Parallelogram',
        options: ['Square', 'Parallelogram', 'Circle', 'Triangle'],
      },
    );
  }
  
  // Advanced questions (levels 7-10)
  if (level >= 7) {
    questions.push(
      {
        question: 'How many sides does an octagon have?',
        correct: '8',
        options: ['6', '7', '8', '9'],
      },
      {
        question: 'What shape has all sides equal and all angles equal?',
        correct: 'Square',
        options: ['Rectangle', 'Square', 'Triangle', 'Circle'],
      },
      {
        question: 'How many sides does a heptagon have?',
        correct: '7',
        options: ['6', '7', '8', '9'],
      },
      {
        question: 'What is a shape with 5 sides called?',
        correct: 'Pentagon',
        options: ['Hexagon', 'Pentagon', 'Octagon', 'Triangle'],
      },
      {
        question: 'What shape has 4 equal sides but is tilted?',
        correct: 'Diamond',
        options: ['Square', 'Diamond', 'Rectangle', 'Circle'],
      },
      {
        question: 'What shape is like a stretched circle?',
        correct: 'Oval',
        options: ['Circle', 'Oval', 'Square', 'Triangle'],
      },
      {
        question: 'What shape has 4 sides with opposite sides parallel?',
        correct: 'Parallelogram',
        options: ['Square', 'Parallelogram', 'Triangle', 'Circle'],
      },
    );
  }
  
  return shuffle(questions);
}

interface GeometryWorksheetProps {
  worksheet: Worksheet;
  level: number;
  onComplete: (accuracy: number) => void;
}

function GeometryWorksheet({ worksheet, level, onComplete }: GeometryWorksheetProps) {
  const [selectedByIndex, setSelectedByIndex] = useState<Record<number, string>>({});
  const [showReview, setShowReview] = useState(false);

  const { count } = getGeometryConfig(level);
  const questions = useMemo(() => {
    const allQuestions = buildGeometryQuestions(level);
    return allQuestions.slice(0, count);
  }, [level, count]);

  const handleSelect = (questionIndex: number, answer: string) => {
    const question = questions[questionIndex];
    const isCorrect = question && answer === question.correct;
    if (isCorrect) playSuccessSound();
    else playFailSound();
    setSelectedByIndex((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleDone = () => {
    const total = questions.length;
    if (total === 0) {
      onComplete(0);
      return;
    }
    setShowReview(true);
  };

  const handleSeeScore = () => {
    const total = questions.length;
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedByIndex[i] === q.correct) correct++;
    });
    const score = Math.round((100 * correct) / total);
    // Play victory sound for scores >= 70%, defeat sound for lower scores
    if (score >= 70) {
      playVictorySound();
    } else {
      playDefeatSound();
    }
    onComplete(score);
  };

  // Review screen
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
            {questions.map((item, i) => {
              const chosen = selectedByIndex[i];
              const isCorrect = chosen === item.correct;
              const shapeName = extractShapeFromQuestion(item.question);
              return (
                <View
                  key={i}
                  style={[
                    styles.addReviewItemWrap,
                    isCorrect ? styles.addReviewItemCorrect : styles.addReviewItemWrong,
                  ]}
                >
                  <View style={styles.geometryQuestionRow}>
                    <View style={styles.geometryShapeContainer}>
                      <ShapeVisualization shape={shapeName} size={40} />
                    </View>
                    <Text style={styles.addReviewItemProblem}>{item.question}</Text>
                  </View>
                  <Text style={styles.addReviewItemAnswer}>Answer: {item.correct}</Text>
                  <View style={styles.addReviewItemResult}>
                    {isCorrect ? (
                      <Text style={styles.addReviewCorrectText}>✓ Correct! You picked {chosen}.</Text>
                    ) : (
                      <Text style={styles.addReviewWrongText}>
                        ✗ You picked {chosen ?? '—'}. Correct answer is {item.correct}.
                      </Text>
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
      <ScrollView
        style={styles.addScrollView}
        contentContainerStyle={styles.addScrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.addTitle}>{worksheet.title}</Text>
        <Text style={styles.addInstructions}>Tap the correct answer for each question.</Text>
        <View style={styles.addList}>
          {questions.map((item, i) => {
            const shapeName = extractShapeFromQuestion(item.question);
            return (
              <View key={i} style={styles.addItemWrap}>
                <View style={styles.geometryQuestionRow}>
                  <View style={styles.geometryShapeContainer}>
                    <ShapeVisualization shape={shapeName} size={50} />
                  </View>
                  <Text style={styles.addItem}>{item.question}</Text>
                </View>
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
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.finishButton, styles.addFinishButton]}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>I'm done! ✓</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/** Letter count by level (1–10) for letter tracing: more letters at higher level. */
function getLetterTracingCount(level: number): number {
  if (level <= 2) return 5;
  if (level <= 5) return 10;
  if (level <= 8) return 20;
  return 26;
}

export default function WorksheetScreen() {
  const { id, _t, level: levelParam } = useLocalSearchParams<{ id: string; _t?: string; level?: string }>();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(() => parseLevel(levelParam));

  useEffect(() => {
    const fromParam = parseLevel(levelParam);
    if (levelParam != null && levelParam !== '') {
      setLevel(fromParam);
    } else {
      getEducationLevel().then(setLevel);
    }
  }, [levelParam]);

  const worksheet = id ? WORKSHEETS.find((w) => w.id === id) : null;
  const sessionKey = `${_t ?? id ?? '0'}-L${level}`;

  const letterToShow = useMemo(() => {
    if (!worksheet || worksheet.type !== 'letter_tracing') return 'A';
    const allLetters = (worksheet.content?.letters as string[] | undefined) ?? ['A'];
    const count = getLetterTracingCount(level);
    const pool = shuffle([...allLetters]).slice(0, Math.min(count, allLetters.length));
    return pool[0] ?? 'A';
  }, [worksheet?.id, worksheet?.type, worksheet?.content?.letters, level]);

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
          <ColorMixing level={level} onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'animal_habitats') {
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <AnimalHabitats level={level} onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'community_helpers') {
    return (
      <View key={sessionKey} style={styles.container}>
        <View style={[styles.worksheetArea, { minHeight: height - 120 }]}>
          <CommunityHelpers level={level} onComplete={handleComplete} onNext={() => {}} />
        </View>
      </View>
    );
  }

  if (type === 'math') {
    return (
      <View key={sessionKey} style={styles.container}>
        <SimpleAdditionWorksheet
          worksheet={worksheet}
          level={level}
          onComplete={handleComplete}
        />
      </View>
    );
  }

  if (type === 'geometry') {
    return (
      <View key={sessionKey} style={styles.container}>
        <GeometryWorksheet
          worksheet={worksheet}
          level={level}
          onComplete={handleComplete}
        />
      </View>
    );
  }

  if (type === 'reading') {
    return (
      <View key={sessionKey} style={styles.container}>
        <SightWordsWorksheet worksheet={worksheet} level={level} onComplete={handleComplete} />
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
  // Simple Addition – scrollable so all sums are visible
  addScrollView: {
    flex: 1,
  },
  addScrollContent: {
    padding: 12,
    paddingTop: 16,
    paddingBottom: 32,
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
    flex: 1,
  },
  geometryQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  geometryShapeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
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
