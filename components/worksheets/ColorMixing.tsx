import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ColorMixingProps {
  onComplete: (accuracy: number) => void;
  onNext: () => void;
}

interface ColorMix {
  color1: string;
  color2: string;
  result: string;
  emoji: string;
}

const COLOR_MIXES: ColorMix[] = [
  { color1: 'red', color2: 'blue', result: 'purple', emoji: '🟣' },
  { color1: 'red', color2: 'yellow', result: 'orange', emoji: '🟠' },
  { color1: 'blue', color2: 'yellow', result: 'green', emoji: '🟢' },
  { color1: 'red', color2: 'white', result: 'pink', emoji: '🌸' },
  { color1: 'blue', color2: 'white', result: 'light blue', emoji: '💙' },
];

function shuffleColorMixes<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const colorMap: { [key: string]: string } = {
  red: '#FF0000',
  blue: '#0000FF',
  yellow: '#FFFF00',
  green: '#00FF00',
  purple: '#800080',
  orange: '#FFA500',
  pink: '#FFC0CB',
  'light blue': '#ADD8E6',
  white: '#FFFFFF',
  black: '#000000',
};

interface DraggableColor {
  id: string;
  color: string;
  position: Animated.ValueXY;
  scale: Animated.Value;
  isDragging: boolean;
  originalPosition: { x: number; y: number };
}

export default function ColorMixing({ onComplete, onNext }: ColorMixingProps) {
  const [currentMixIndex, setCurrentMixIndex] = useState(0);
  const [draggableColors, setDraggableColors] = useState<DraggableColor[]>([]);
  const [mixedColor, setMixedColor] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [mixingAreaPosition, setMixingAreaPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const mixingAreaRef = useRef<View>(null);
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const draggableColorsRef = useRef<DraggableColor[]>([]);
  const mixingAreaPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const colorMixes = useMemo(() => shuffleColorMixes(COLOR_MIXES), []);
  const currentMix = colorMixes[currentMixIndex];

  // Keep refs in sync so pan responder callbacks always see latest state
  draggableColorsRef.current = draggableColors;
  mixingAreaPositionRef.current = mixingAreaPosition;

  // Initialize draggable colors with scale animation
  useEffect(() => {
    const colors = [
      { 
        id: 'color1', 
        color: currentMix.color1, 
        position: new Animated.ValueXY({ x: 0, y: 0 }), 
        scale: new Animated.Value(1),
        isDragging: false,
        originalPosition: { x: 0, y: 0 }
      },
      { 
        id: 'color2', 
        color: currentMix.color2, 
        position: new Animated.ValueXY({ x: 0, y: 0 }), 
        scale: new Animated.Value(1),
        isDragging: false,
        originalPosition: { x: 0, y: 0 }
      },
    ];
    setDraggableColors(colors);
    setMixedColor(null);
    setIsMixing(false);
    setFeedback(null);
    setSelectedColors([]);
    resultOpacity.setValue(0);
  }, [currentMixIndex]);

  // Get mixing area position (ref updated immediately for drop detection)
  useEffect(() => {
    if (mixingAreaRef.current) {
      mixingAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
        const rect = { x: pageX, y: pageY, width, height };
        mixingAreaPositionRef.current = rect;
        setMixingAreaPosition(rect);
      });
    }
  }, []);

  // Create PanResponder for each color with drag animations (uses refs to avoid stale closures)
  const createPanResponder = (colorId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const color = draggableColorsRef.current.find(c => c.id === colorId);
        if (color) {
          Animated.spring(color.scale, {
            toValue: 1.25,
            useNativeDriver: false,
            friction: 6,
            tension: 100,
          }).start();
        }
        setDraggableColors(prev =>
          prev.map(c => (c.id === colorId ? { ...c, isDragging: true } : c))
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        const color = draggableColorsRef.current.find(c => c.id === colorId);
        if (color) {
          color.position.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const pos = mixingAreaPositionRef.current;
        const dropX = gestureState.moveX;
        const dropY = gestureState.moveY;
        const isInMixingArea =
          pos.width > 0 &&
          pos.height > 0 &&
          dropX >= pos.x &&
          dropX <= pos.x + pos.width &&
          dropY >= pos.y &&
          dropY <= pos.y + pos.height;

        if (isInMixingArea) {
          try {
            handleColorDropped(colorId);
          } catch (err) {
            console.error('ColorMixing handleColorDropped:', err);
          }
        }

        const color = draggableColorsRef.current.find(c => c.id === colorId);
        if (color) {
          Animated.spring(color.scale, {
            toValue: 1,
            useNativeDriver: false,
            friction: 6,
            tension: 100,
          }).start();
          Animated.spring(color.position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          setDraggableColors(prev =>
            prev.map(c => (c.id === colorId ? { ...c, isDragging: false } : c))
          );
        }
      },
    });
  };

  const handleColorDropped = (colorId: string) => {
    if (isMixing) return;

    const droppedColor = draggableColorsRef.current.find(c => c.id === colorId);
    if (!droppedColor) return;
    
    // Add to selected colors if not already selected (use functional update for latest state)
    setSelectedColors(prev => {
      if (prev.includes(droppedColor.color)) return prev;
      const newSelectedColors = [...prev, droppedColor.color];
      
      // If we have 2 colors, start mixing
      if (newSelectedColors.length === 2) {
        setIsMixing(true);
        setTotalAttempts(t => t + 1);
        const colorsToMix = newSelectedColors;
        // Animate mixing: short delay then reveal result with fade-in
        setTimeout(() => {
          const resultColor = getMixedColor(colorsToMix);
          setMixedColor(resultColor);
          resultOpacity.setValue(0);
          Animated.timing(resultOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();

          const isCorrect = resultColor === colorMap[currentMix.result];
          if (isCorrect) {
            setScore(s => s + 1);
            setFeedback('correct');
            setTimeout(() => handleNext(), 2500);
          } else {
            setFeedback('incorrect');
            setShowHint(true);
            setTimeout(() => {
              setMixedColor(null);
              setFeedback(null);
              setShowHint(false);
              setIsMixing(false);
              setSelectedColors([]);
              resultOpacity.setValue(0);
            }, 2500);
          }
        }, 800);
      }
      return newSelectedColors;
    });
  };

  const getMixedColor = (colors: string[]) => {
    if (colors.length !== 2) return null;
    const [color1, color2] = [...colors].sort();
    
    if ((color1 === 'red' && color2 === 'blue') || (color1 === 'blue' && color2 === 'red')) {
      return colorMap.purple;
    } else if ((color1 === 'red' && color2 === 'yellow') || (color1 === 'yellow' && color2 === 'red')) {
      return colorMap.orange;
    } else if ((color1 === 'blue' && color2 === 'yellow') || (color1 === 'yellow' && color2 === 'blue')) {
      return colorMap.green;
    } else if ((color1 === 'red' && color2 === 'white') || (color1 === 'white' && color2 === 'red')) {
      return colorMap.pink;
    } else if ((color1 === 'blue' && color2 === 'white') || (color1 === 'white' && color2 === 'blue')) {
      return colorMap['light blue'];
    }
    
    return null;
  };

  const handleNext = () => {
    if (currentMixIndex < colorMixes.length - 1) {
      setCurrentMixIndex(prev => prev + 1);
    } else {
      const finalAccuracy = Math.round((score / colorMixes.length) * 100);
      onComplete(finalAccuracy);
    }
  };

  const resetCurrentMix = () => {
    setMixedColor(null);
    setFeedback(null);
    setShowHint(false);
    setIsMixing(false);
    setSelectedColors([]);
    resultOpacity.setValue(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Color Mixing Magic!</Text>
        <Text style={styles.progress}>Mix {currentMixIndex + 1} of {colorMixes.length}</Text>
        <Text style={styles.score}>Stars: {score} ⭐</Text>
      </View>

      {/* Question - don't give away the result */}
      <View style={styles.questionContainer}>
        <Text style={styles.question}>
          Mix {currentMix.color1} and {currentMix.color2} to make…?
        </Text>
        <Text style={styles.emoji}>{currentMix.emoji}</Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Draggable Colors */}
        <View style={styles.colorsContainer}>
          <Text style={styles.instruction}>👆 Drag the colors into the bowl!</Text>
          <View style={styles.draggableColors}>
            {draggableColors.map((color) => (
              <Animated.View
                key={color.id}
                style={[
                  styles.draggableColor,
                  {
                    transform: [
                      { translateX: color.position.x },
                      { translateY: color.position.y },
                      { scale: color.scale },
                    ],
                    zIndex: color.isDragging ? 1000 : 1,
                    elevation: color.isDragging ? 12 : 4,
                    shadowOpacity: color.isDragging ? 0.4 : 0.2,
                  },
                ]}
                {...createPanResponder(color.id).panHandlers}
              >
                <View style={[styles.colorCircle, { backgroundColor: colorMap[color.color] }]}>
                  <Text style={styles.colorName}>{color.color}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Mixing Area */}
        <View style={styles.mixingAreaContainer}>
          <Text style={styles.mixingTitle}>🥣 Mixing Bowl</Text>
          <View 
            ref={mixingAreaRef}
            style={[
              styles.mixingArea,
              mixedColor && { backgroundColor: mixedColor },
              isMixing && !mixedColor && styles.mixingActive,
            ]}
            onLayout={() => {
              if (mixingAreaRef.current) {
                mixingAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
                  const rect = { x: pageX, y: pageY, width, height };
                  mixingAreaPositionRef.current = rect;
                  setMixingAreaPosition(rect);
                });
              }
            }}
          >
            {!mixedColor && !isMixing && (
              <Text style={styles.mixingPlaceholder}>
                {selectedColors.length === 0 ? 'Drop colors here! 👇' : 'Drop another color! 👇'}
              </Text>
            )}
            {isMixing && !mixedColor && (
              <View style={styles.mixingAnimation}>
                <Text style={styles.mixingText}>Mixing...</Text>
              </View>
            )}
            {mixedColor && (
              <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
                <Text style={styles.resultText}>
                  {currentMix.result.charAt(0).toUpperCase() + currentMix.result.slice(1)}!
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Inline feedback below bowl - never covers the result */}
          {feedback && (
            <View style={[
              styles.inlineFeedback,
              feedback === 'correct' ? styles.inlineFeedbackCorrect : styles.inlineFeedbackIncorrect,
            ]}>
              <Text style={styles.inlineFeedbackEmoji}>
                {feedback === 'correct' ? '🎉' : '😅'}
              </Text>
              <Text style={styles.inlineFeedbackText}>
                {feedback === 'correct'
                  ? `You made ${currentMix.result}!`
                  : `Try again! Mix ${currentMix.color1} + ${currentMix.color2}`}
              </Text>
            </View>
          )}
        </View>

        {/* Selected Colors Display */}
        {selectedColors.length > 0 && (
          <View style={styles.selectedColorsContainer}>
            <Text style={styles.selectedColorsTitle}>Selected Colors:</Text>
            <View style={styles.selectedColorsList}>
              {selectedColors.map((color, index) => (
                <View key={index} style={styles.selectedColorItem}>
                  <View style={[styles.selectedColorCircle, { backgroundColor: colorMap[color] }]} />
                  <Text style={styles.selectedColorName}>{color}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetButton} onPress={resetCurrentMix}>
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
        {showHint && (
          <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(false)}>
            <Text style={styles.hintButtonText}>💡 Hide Hint</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hint - below controls, does not cover bowl */}
      {showHint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            💡 Try mixing {currentMix.color1} and {currentMix.color2} to make {currentMix.result}!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  question: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 32,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  colorsContainer: {
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
  },
  draggableColors: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  draggableColor: {
    alignItems: 'center',
  },
  colorCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  colorName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mixingAreaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mixingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mixingArea: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  mixingActive: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
  },
  mixingPlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  mixingAnimation: {
    alignItems: 'center',
  },
  mixingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedColorsContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedColorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  selectedColorsList: {
    flexDirection: 'row',
    gap: 12,
  },
  selectedColorItem: {
    alignItems: 'center',
  },
  selectedColorCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedColorName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    elevation: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  hintButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    elevation: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  hintButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 18,
  },
  hintContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  hintText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  inlineFeedback: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  inlineFeedbackCorrect: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  inlineFeedbackIncorrect: {
    backgroundColor: '#f8d7da',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  inlineFeedbackEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  inlineFeedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
}); 