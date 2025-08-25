import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AnimalHabitatsProps {
  onComplete: (accuracy: number) => void;
  onNext: () => void;
}

interface AnimalHabitatPair {
  animal: string;
  habitat: string;
  animalEmoji: string;
  habitatEmoji: string;
}

const animalHabitats: AnimalHabitatPair[] = [
  { animal: 'Lion', habitat: 'Savanna', animalEmoji: '🦁', habitatEmoji: '🌾' },
  { animal: 'Fish', habitat: 'Ocean', animalEmoji: '🐟', habitatEmoji: '🌊' },
  { animal: 'Bear', habitat: 'Forest', animalEmoji: '🐻', habitatEmoji: '🌲' },
  { animal: 'Camel', habitat: 'Desert', animalEmoji: '🐪', habitatEmoji: '🏜️' },
  { animal: 'Penguin', habitat: 'Arctic', animalEmoji: '🐧', habitatEmoji: '❄️' },
  { animal: 'Monkey', habitat: 'Rainforest', animalEmoji: '🐒', habitatEmoji: '🌧️' },
  { animal: 'Eagle', habitat: 'Mountains', animalEmoji: '🦅', habitatEmoji: '⛰️' },
  { animal: 'Frog', habitat: 'Pond', animalEmoji: '🐸', habitatEmoji: '💧' },
  { animal: 'Shark', habitat: 'Ocean', animalEmoji: '🦈', habitatEmoji: '🌊' },
  { animal: 'Elephant', habitat: 'Savanna', animalEmoji: '🐘', habitatEmoji: '🌾' },
  { animal: 'Polar Bear', habitat: 'Arctic', animalEmoji: '🐻‍❄️', habitatEmoji: '❄️' },
  { animal: 'Gorilla', habitat: 'Rainforest', animalEmoji: '🦍', habitatEmoji: '🌧️' },
  { animal: 'Mountain Goat', habitat: 'Mountains', animalEmoji: '🐐', habitatEmoji: '⛰️' },
  { animal: 'Duck', habitat: 'Pond', animalEmoji: '🦆', habitatEmoji: '💧' },
  { animal: 'Snake', habitat: 'Desert', animalEmoji: '🐍', habitatEmoji: '🏜️' },
  { animal: 'Deer', habitat: 'Forest', animalEmoji: '🦌', habitatEmoji: '🌲' },
];

export default function AnimalHabitats({ onComplete, onNext }: AnimalHabitatsProps) {
  const [selectedAnimals, setSelectedAnimals] = useState<AnimalHabitatPair[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [selectedHabitat, setSelectedHabitat] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Select 5 random animals for this worksheet session
  useEffect(() => {
    const shuffled = [...animalHabitats].sort(() => Math.random() - 0.5);
    setSelectedAnimals(shuffled.slice(0, 5));
    setIsLoading(false);
  }, []);

  // Don't render until animals are selected
  if (isLoading || selectedAnimals.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const currentPair = selectedAnimals[currentQuestionNumber];
  
  // Additional safety check
  if (!currentPair) {
    return (
      <View style={styles.container}>
        <Text>Error: No animal data available</Text>
      </View>
    );
  }

  const allHabitats = [...new Set(animalHabitats.map(pair => pair.habitat))];
  const correctHabitat = currentPair.habitat;
  const otherHabitats = allHabitats.filter(habitat => habitat !== correctHabitat);
  const shuffledOtherHabitats = otherHabitats.sort(() => Math.random() - 0.5).slice(0, 3);
  const shuffledHabitats = [correctHabitat, ...shuffledOtherHabitats].sort(() => Math.random() - 0.5);

  const handleHabitatSelect = (habitat: string) => {
    if (hasAnswered) return;
    
    setSelectedHabitat(habitat);
    setHasAnswered(true);
    
    const isCorrect = habitat === currentPair.habitat;
    setAccuracy(isCorrect ? 100 : 0);
    
    // Track correct answers
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
    
    // Show feedback briefly before moving to next question
    setTimeout(() => {
      if (isCorrect) {
        handleNext();
      } else {
        // Reset for retry
        setSelectedHabitat(null);
        setHasAnswered(false);
        setAccuracy(0);
      }
    }, 2000);
  };

  const handleNext = () => {
    if (currentQuestionNumber < 4) { // 5 questions total (0-4)
      setCurrentQuestionNumber(currentQuestionNumber + 1);
      setSelectedHabitat(null);
      setHasAnswered(false);
      setAccuracy(0);
      onNext(); // Call the education screen's onNext to update question counter
    } else {
      // All questions completed
      const finalAccuracy = Math.round((100 * correctAnswers) / 5);
      onComplete(finalAccuracy);
    }
  };

  const getHabitatEmoji = (habitat: string) => {
    const pair = animalHabitats.find(p => p.habitat === habitat);
    return pair?.habitatEmoji || '🌍';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Question {currentQuestionNumber + 1} of 5
      </Text>

      <Text style={styles.question}>
        Where does a {currentPair.animal} live?
      </Text>

      {/* Animal Display */}
      <View style={styles.animalContainer}>
        <Text style={styles.animalEmoji}>{currentPair.animalEmoji}</Text>
        <Text style={styles.animalName}>{currentPair.animal}</Text>
      </View>

      {/* Habitat Options */}
      <View style={styles.habitatsContainer}>
        {shuffledHabitats.map((habitat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.habitatButton,
              selectedHabitat === habitat && styles.habitatButtonSelected,
              hasAnswered && habitat === currentPair.habitat && styles.habitatButtonCorrect,
              hasAnswered && selectedHabitat === habitat && habitat !== currentPair.habitat && styles.habitatButtonIncorrect,
            ]}
            onPress={() => handleHabitatSelect(habitat)}
            disabled={hasAnswered}
          >
            <Text style={styles.habitatEmoji}>{getHabitatEmoji(habitat)}</Text>
            <Text style={[
              styles.habitatText,
              selectedHabitat === habitat && styles.habitatTextSelected,
              hasAnswered && habitat === currentPair.habitat && styles.habitatTextCorrect,
              hasAnswered && selectedHabitat === habitat && habitat !== currentPair.habitat && styles.habitatTextIncorrect,
            ]}>
              {habitat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overlay Feedback - Positioned in center */}
      {hasAnswered && (
        <View style={styles.overlayContainer}>
          <View style={[
            styles.feedbackContainer,
            accuracy === 100 ? styles.feedbackCorrect : styles.feedbackIncorrect
          ]}>
            <Text style={styles.feedbackText}>
              {accuracy === 100 ? '✅ Correct!' : '❌ Try Again!'}
            </Text>
            {accuracy === 100 && (
              <Text style={styles.feedbackSubtext}>
                {currentPair.animal} lives in the {currentPair.habitat}!
              </Text>
            )}
            {accuracy === 0 && (
              <Text style={styles.feedbackSubtext}>
                {currentPair.animal} actually lives in the {currentPair.habitat}!
              </Text>
            )}
          </View>
          
          {/* Correct Answer Display */}
          {accuracy === 0 && (
            <View style={styles.correctAnswerContainer}>
              <Text style={styles.correctAnswerTitle}>Correct Answer:</Text>
              <View style={styles.correctAnswerDisplay}>
                <Text style={styles.correctAnswerEmoji}>{currentPair.animalEmoji}</Text>
                <Text style={styles.correctAnswerText}>{currentPair.animal}</Text>
                <Text style={styles.correctAnswerArrow}>→</Text>
                <Text style={styles.correctAnswerEmoji}>{currentPair.habitatEmoji}</Text>
                <Text style={styles.correctAnswerText}>{currentPair.habitat}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  progress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  animalContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  animalEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  animalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  habitatsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  habitatButton: {
    width: '45%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 100,
    justifyContent: 'center',
  },
  habitatButtonSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  habitatButtonCorrect: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  habitatButtonIncorrect: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  habitatEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  habitatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  habitatTextSelected: {
    color: '#007bff',
  },
  habitatTextCorrect: {
    color: '#28a745',
  },
  habitatTextIncorrect: {
    color: '#dc3545',
  },
  feedbackContainer: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feedbackSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  correctAnswerContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  correctAnswerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  correctAnswerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  correctAnswerEmoji: {
    fontSize: 30,
    marginHorizontal: 5,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 5,
  },
  correctAnswerArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginHorizontal: 10,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
}); 