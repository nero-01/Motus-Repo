import React, { useState, useEffect, useMemo } from 'react';
import { playSuccessSound, playFailSound } from '../../utils/worksheetSounds';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface CommunityHelpersProps {
  onComplete: (accuracy: number) => void;
  onNext: () => void;
}

interface HelperToolPair {
  helper: string;
  tool: string;
  helperEmoji: string;
  toolEmoji: string;
}

const communityHelpers: HelperToolPair[] = [
  { helper: 'Firefighter', tool: 'Fire Truck', helperEmoji: '🚒', toolEmoji: '🚒' },
  { helper: 'Doctor', tool: 'Stethoscope', helperEmoji: '👨‍⚕️', toolEmoji: '🩺' },
  { helper: 'Teacher', tool: 'Books', helperEmoji: '👩‍🏫', toolEmoji: '📚' },
  { helper: 'Police Officer', tool: 'Badge', helperEmoji: '👮‍♂️', toolEmoji: '🪖' },
  { helper: 'Nurse', tool: 'Medicine', helperEmoji: '👩‍⚕️', toolEmoji: '💊' },
  { helper: 'Mail Carrier', tool: 'Mail Truck', helperEmoji: '📮', toolEmoji: '🚛' },
  { helper: 'Chef', tool: 'Cooking Pot', helperEmoji: '👨‍🍳', toolEmoji: '🍳' },
  { helper: 'Dentist', tool: 'Toothbrush', helperEmoji: '🦷', toolEmoji: '🪥' },
  { helper: 'Veterinarian', tool: 'Pet Carrier', helperEmoji: '🐾', toolEmoji: '📦' },
  { helper: 'Librarian', tool: 'Library Card', helperEmoji: '📖', toolEmoji: '📇' },
  { helper: 'Garbage Collector', tool: 'Garbage Truck', helperEmoji: '🗑️', toolEmoji: '🚛' },
  { helper: 'Bus Driver', tool: 'Bus', helperEmoji: '🚌', toolEmoji: '🚌' },
  { helper: 'Construction Worker', tool: 'Hard Hat', helperEmoji: '👷‍♂️', toolEmoji: '⛑️' },
  { helper: 'Farmer', tool: 'Tractor', helperEmoji: '👨‍🌾', toolEmoji: '🚜' },
  { helper: 'Mechanic', tool: 'Wrench', helperEmoji: '🔧', toolEmoji: '🔧' },
  { helper: 'Electrician', tool: 'Light Bulb', helperEmoji: '⚡', toolEmoji: '💡' },
];

export default function CommunityHelpers({ onComplete, onNext }: CommunityHelpersProps) {
  const [selectedPairs, setSelectedPairs] = useState<HelperToolPair[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [questionTools, setQuestionTools] = useState<string[][]>([]);

  // Select 5 random pairs in random order each time the worksheet loads
  useEffect(() => {
    const shuffled = shuffle([...communityHelpers]);
    const selected = shuffled.slice(0, 5);
    setSelectedPairs(selected);

    const allTools = [...new Set(communityHelpers.map(pair => pair.tool))];
    const toolsForQuestions = selected.map(pair => {
      const correctTool = pair.tool;
      const otherTools = allTools.filter(tool => tool !== correctTool);
      const shuffledOtherTools = shuffle([...otherTools]).slice(0, 3);
      return shuffle([correctTool, ...shuffledOtherTools]);
    });

    setQuestionTools(toolsForQuestions);
    setIsLoading(false);
  }, []);

  // Don't render until pairs are selected
  if (isLoading || selectedPairs.length === 0 || questionTools.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Getting ready... 👷</Text>
      </View>
    );
  }

  const currentPair = selectedPairs[currentQuestionNumber];
  const currentTools = questionTools[currentQuestionNumber];
  
  // Additional safety check
  if (!currentPair || !currentTools) {
    return (
      <View style={styles.container}>
        <Text>Error: No helper data available</Text>
      </View>
    );
  }

  const handleToolSelect = (tool: string) => {
    if (hasAnswered) return;
    
    setSelectedTool(tool);
    setHasAnswered(true);
    
    const isCorrect = tool === currentPair.tool;
    if (isCorrect) playSuccessSound();
    else playFailSound();
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setAccuracy(Math.round(((correctAnswers + 1) / (currentQuestionNumber + 1)) * 100));
      setFeedback('correct');
      
      // Auto-advance after 4 seconds
      setTimeout(() => {
        handleNext();
      }, 4000);
    } else {
      setAccuracy(Math.round((correctAnswers / (currentQuestionNumber + 1)) * 100));
      setFeedback('incorrect');
      
      // Show feedback for 4 seconds, then reset for retry
      setTimeout(() => {
        resetQuestion();
      }, 4000);
    }
  };

  const handleNext = () => {
    if (currentQuestionNumber < selectedPairs.length - 1) {
      setCurrentQuestionNumber(prev => prev + 1);
      setSelectedTool(null);
      setHasAnswered(false);
      setFeedback(null);
    } else {
      // All questions completed
      const finalAccuracy = Math.round((correctAnswers / selectedPairs.length) * 100);
      onComplete(finalAccuracy);
    }
  };

  const resetQuestion = () => {
    setSelectedTool(null);
    setHasAnswered(false);
    setFeedback(null);
  };

  const getToolEmoji = (tool: string) => {
    const pair = communityHelpers.find(p => p.tool === tool);
    return pair?.toolEmoji || '🔧';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Question {currentQuestionNumber + 1} of 5
      </Text>

      <Text style={styles.question}>
        What does a {currentPair.helper} use? {currentPair.helperEmoji}
      </Text>

      {/* Helper Display */}
      <View style={styles.helperContainer}>
        <Text style={styles.helperEmoji}>{currentPair.helperEmoji}</Text>
        <Text style={styles.helperName}>{currentPair.helper}</Text>
      </View>

      {/* Tool Options */}
      <View style={styles.toolsContainer}>
        {currentTools.map((tool, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.toolButton,
              selectedTool === tool && styles.toolButtonSelected,
              hasAnswered && tool === currentPair.tool && styles.toolButtonCorrect,
              hasAnswered && selectedTool === tool && tool !== currentPair.tool && styles.toolButtonIncorrect,
            ]}
            onPress={() => handleToolSelect(tool)}
            disabled={hasAnswered}
          >
            <Text style={styles.toolEmoji}>{getToolEmoji(tool)}</Text>
            <Text style={[
              styles.toolText,
              selectedTool === tool && styles.toolTextSelected,
              hasAnswered && tool === currentPair.tool && styles.toolTextCorrect,
              hasAnswered && selectedTool === tool && tool !== currentPair.tool && styles.toolTextIncorrect,
            ]}>
              {tool}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasAnswered && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>
            Accuracy: {accuracy}%
          </Text>
        </View>
      )}

      {/* Overlay Feedback - Positioned in center */}
      {feedback && (
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            <View style={[
              styles.feedbackContainer,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect
            ]}>
              <Text style={styles.feedbackText}>
                {feedback === 'correct' ? '✅ Correct!' : '❌ Try Again!'}
              </Text>
              {feedback === 'correct' && (
                <Text style={styles.feedbackSubtext}>
                  A {currentPair.helper} uses a {currentPair.tool}!
                </Text>
              )}
              {feedback === 'incorrect' && (
                <Text style={styles.feedbackSubtext}>
                  The correct answer is {currentPair.tool}
                </Text>
              )}
              
              {/* Show the correct pair visually */}
              {feedback === 'incorrect' && (
                <View style={styles.correctPairDisplay}>
                  <View style={styles.correctPairItem}>
                    <Text style={styles.correctPairEmoji}>{currentPair.helperEmoji}</Text>
                    <Text style={styles.correctPairText}>{currentPair.helper}</Text>
                  </View>
                  <Text style={styles.correctPairArrow}>→</Text>
                  <View style={styles.correctPairItem}>
                    <Text style={styles.correctPairEmoji}>{currentPair.toolEmoji}</Text>
                    <Text style={styles.correctPairText}>{currentPair.tool}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
    marginTop: 40,
    fontWeight: '600',
  },
  progress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  helperContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  helperEmoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  helperName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  toolsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 48,
  },
  toolButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  toolButtonCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  toolButtonIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  toolEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toolTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  toolTextCorrect: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  toolTextIncorrect: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContainer: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 2,
  },
  feedbackCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  feedbackIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  feedbackSubtext: {
    fontSize: 18,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  correctPairDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  correctPairItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  correctPairEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  correctPairText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  correctPairArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 10,
  },
  feedback: {
    alignItems: 'center',
    marginTop: 20,
  },
}); 