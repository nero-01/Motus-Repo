import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface LetterTracingProps {
  letter: string;
  onComplete: (accuracy: number) => void;
  onNext: () => void;
}

interface Point {
  x: number;
  y: number;
}

export default function LetterTracing({ letter, onComplete, onNext }: LetterTracingProps) {
  const [userPath, setUserPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setUserPath([{ x: locationX, y: locationY }]);
      setIsDrawing(true);
      setHasStarted(true);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing) return;
      const { locationX, locationY } = evt.nativeEvent;
      
      // Add distance threshold to reduce sensitivity
      const lastPoint = userPath[userPath.length - 1];
      if (lastPoint) {
        const distance = Math.sqrt(
          Math.pow(locationX - lastPoint.x, 2) + Math.pow(locationY - lastPoint.y, 2)
        );
        
        // Only add point if moved at least 8 pixels (increased from 5)
        if (distance > 8) {
          setUserPath(prev => [...prev, { x: locationX, y: locationY }]);
        }
      }
    },
    onPanResponderRelease: () => {
      setIsDrawing(false);
      calculateAccuracy();
    },
  });

  const calculateAccuracy = () => {
    // More sophisticated accuracy calculation
    if (userPath.length < 3) {
      setAccuracy(0);
      return;
    }

    // Calculate path length
    let pathLength = 0;
    for (let i = 1; i < userPath.length; i++) {
      const dx = userPath[i].x - userPath[i-1].x;
      const dy = userPath[i].y - userPath[i-1].y;
      pathLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate coverage area (how much of the letter area was covered)
    const minX = Math.min(...userPath.map(p => p.x));
    const maxX = Math.max(...userPath.map(p => p.x));
    const minY = Math.min(...userPath.map(p => p.y));
    const maxY = Math.max(...userPath.map(p => p.y));
    
    const coverageWidth = maxX - minX;
    const coverageHeight = maxY - minY;
    const coverageArea = coverageWidth * coverageHeight;
    
    // Ideal letter area (approximate)
    const idealArea = 100 * 100; // 100x100 pixels for a letter
    const areaCoverage = Math.min(100, (coverageArea / idealArea) * 100);

    // Path smoothness (fewer direction changes = better)
    let directionChanges = 0;
    for (let i = 2; i < userPath.length; i++) {
      const prev = userPath[i-2];
      const curr = userPath[i-1];
      const next = userPath[i];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      const angleDiff = Math.abs(angle1 - angle2);
      
      if (angleDiff > 0.5) { // More than ~30 degrees
        directionChanges++;
      }
    }
    
    const smoothnessScore = Math.max(0, 100 - (directionChanges * 10));

    // Combine factors for final accuracy
    const pathScore = Math.min(40, (userPath.length / 20) * 40); // Up to 40 points for good path
    const lengthScore = Math.min(20, (pathLength / 200) * 20); // Up to 20 points for sufficient length
    const coverageScore = Math.min(20, areaCoverage * 0.2); // Up to 20 points for good coverage
    const smoothnessScoreFinal = Math.min(20, smoothnessScore * 0.2); // Up to 20 points for smoothness
    
    const finalAccuracy = Math.min(100, pathScore + lengthScore + coverageScore + smoothnessScoreFinal);
    
    setAccuracy(Math.round(finalAccuracy));
  };

  const resetTracing = () => {
    setUserPath([]);
    setIsDrawing(false);
    setHasStarted(false);
    setAccuracy(0);
  };

  const handleComplete = () => {
    if (!hasStarted) {
      Alert.alert('Start Tracing', 'Please trace the letter first!');
      return;
    }
    
    // Call the onComplete function with the accuracy
    onComplete(accuracy);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Letter',
      'Are you sure you want to skip this letter?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            // Give a minimum accuracy for skipping
            onComplete(Math.max(30, accuracy));
          },
        },
      ]
    );
  };

  const renderLetterTemplate = () => {
    // Simple letter templates using basic shapes - FIXED ORIENTATION
    const letterStyles = getLetterTemplate(letter);
    return letterStyles;
  };

  const getLetterTemplate = (letter: string) => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: '#e0e0e0', // Lighter gray for better visibility
    };

    switch (letter.toUpperCase()) {
      case 'A':
        return [
          <View key="line1" style={[baseStyle, { width: 3, height: 60, left: 85, top: 30, transform: [{ rotate: '-15deg' }] }]} />,
          <View key="line2" style={[baseStyle, { width: 3, height: 60, left: 115, top: 30, transform: [{ rotate: '15deg' }] }]} />,
          <View key="cross" style={[baseStyle, { width: 40, height: 3, left: 85, top: 60 }]} />,
        ];
      case 'B':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="top" style={[baseStyle, { width: 40, height: 3, left: 70, top: 20, borderRadius: 20 }]} />,
          <View key="middle" style={[baseStyle, { width: 40, height: 3, left: 70, top: 50, borderRadius: 20 }]} />,
          <View key="bottom" style={[baseStyle, { width: 40, height: 3, left: 70, top: 80, borderRadius: 20 }]} />,
        ];
      case 'C':
        return [
          <View key="curve" style={[baseStyle, { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
        ];
      case 'D':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="curve" style={[baseStyle, { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
        ];
      case 'E':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="top" style={[baseStyle, { width: 50, height: 3, left: 70, top: 20 }]} />,
          <View key="middle" style={[baseStyle, { width: 35, height: 3, left: 70, top: 50 }]} />,
          <View key="bottom" style={[baseStyle, { width: 50, height: 3, left: 70, top: 80 }]} />,
        ];
      case 'F':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="top" style={[baseStyle, { width: 50, height: 3, left: 70, top: 20 }]} />,
          <View key="middle" style={[baseStyle, { width: 35, height: 3, left: 70, top: 50 }]} />,
        ];
      case 'G':
        return [
          <View key="curve" style={[baseStyle, { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
          <View key="tail" style={[baseStyle, { width: 3, height: 25, left: 125, top: 45 }]} />,
          <View key="cross" style={[baseStyle, { width: 15, height: 3, left: 110, top: 55 }]} />,
        ];
      case 'H':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 80, left: 120, top: 20 }]} />,
          <View key="cross" style={[baseStyle, { width: 50, height: 3, left: 70, top: 50 }]} />,
        ];
      case 'I':
        return [
          <View key="top" style={[baseStyle, { width: 50, height: 3, left: 75, top: 20 }]} />,
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 97, top: 20 }]} />,
          <View key="bottom" style={[baseStyle, { width: 50, height: 3, left: 75, top: 80 }]} />,
        ];
      case 'J':
        return [
          <View key="top" style={[baseStyle, { width: 50, height: 3, left: 75, top: 20 }]} />,
          <View key="vertical" style={[baseStyle, { width: 3, height: 60, left: 120, top: 20 }]} />,
          <View key="curve" style={[baseStyle, { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 90, top: 60 }]} />,
        ];
      case 'K':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="top" style={[baseStyle, { width: 3, height: 35, left: 70, top: 20, transform: [{ rotate: '45deg' }] }]} />,
          <View key="bottom" style={[baseStyle, { width: 3, height: 35, left: 70, top: 65, transform: [{ rotate: '-45deg' }] }]} />,
        ];
      case 'L':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="bottom" style={[baseStyle, { width: 50, height: 3, left: 70, top: 80 }]} />,
        ];
      case 'M':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="middle" style={[baseStyle, { width: 3, height: 50, left: 95, top: 30, transform: [{ rotate: '45deg' }] }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 80, left: 120, top: 20 }]} />,
        ];
      case 'N':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="diagonal" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20, transform: [{ rotate: '45deg' }] }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 80, left: 120, top: 20 }]} />,
        ];
      case 'O':
        return [
          <View key="circle" style={[baseStyle, { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
        ];
      case 'P':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="curve" style={[baseStyle, { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
        ];
      case 'Q':
        return [
          <View key="circle" style={[baseStyle, { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
          <View key="tail" style={[baseStyle, { width: 3, height: 25, left: 125, top: 65, transform: [{ rotate: '45deg' }] }]} />,
        ];
      case 'R':
        return [
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20 }]} />,
          <View key="curve" style={[baseStyle, { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 20 }]} />,
          <View key="tail" style={[baseStyle, { width: 3, height: 35, left: 110, top: 45, transform: [{ rotate: '45deg' }] }]} />,
        ];
      case 'S':
        return [
          <View key="curve1" style={[baseStyle, { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 85, top: 20 }]} />,
          <View key="curve2" style={[baseStyle, { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 85, top: 50 }]} />,
        ];
      case 'T':
        return [
          <View key="top" style={[baseStyle, { width: 60, height: 3, left: 70, top: 20 }]} />,
          <View key="vertical" style={[baseStyle, { width: 3, height: 80, left: 97, top: 20 }]} />,
        ];
      case 'U':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 60, left: 70, top: 20 }]} />,
          <View key="curve" style={[baseStyle, { width: 60, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#e0e0e0', backgroundColor: 'transparent', left: 70, top: 50 }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 60, left: 120, top: 20 }]} />,
        ];
      case 'V':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 50, left: 85, top: 20, transform: [{ rotate: '15deg' }] }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 50, left: 115, top: 20, transform: [{ rotate: '-15deg' }] }]} />,
        ];
      case 'W':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 70, left: 70, top: 20 }]} />,
          <View key="middle1" style={[baseStyle, { width: 3, height: 35, left: 95, top: 35, transform: [{ rotate: '45deg' }] }]} />,
          <View key="middle2" style={[baseStyle, { width: 3, height: 35, left: 95, top: 35, transform: [{ rotate: '-45deg' }] }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 70, left: 120, top: 20 }]} />,
        ];
      case 'X':
        return [
          <View key="diagonal1" style={[baseStyle, { width: 3, height: 80, left: 70, top: 20, transform: [{ rotate: '45deg' }] }]} />,
          <View key="diagonal2" style={[baseStyle, { width: 3, height: 80, left: 120, top: 20, transform: [{ rotate: '-45deg' }] }]} />,
        ];
      case 'Y':
        return [
          <View key="left" style={[baseStyle, { width: 3, height: 40, left: 85, top: 20, transform: [{ rotate: '15deg' }] }]} />,
          <View key="right" style={[baseStyle, { width: 3, height: 40, left: 115, top: 20, transform: [{ rotate: '-15deg' }] }]} />,
          <View key="vertical" style={[baseStyle, { width: 3, height: 50, left: 97, top: 40 }]} />,
        ];
      case 'Z':
        return [
          <View key="top" style={[baseStyle, { width: 60, height: 3, left: 70, top: 20 }]} />,
          <View key="diagonal" style={[baseStyle, { width: 3, height: 60, left: 70, top: 20, transform: [{ rotate: '45deg' }] }]} />,
          <View key="bottom" style={[baseStyle, { width: 60, height: 3, left: 70, top: 80 }]} />,
        ];
      default:
        return [
          <View key="default" style={[baseStyle, { width: 3, height: 80, left: 97, top: 20 }]} />,
        ];
    }
  };

  const renderUserPath = () => {
    if (userPath.length < 2) return null;
    
    // Create a smoother line by connecting points with better styling
    const pathSegments = [];
    for (let i = 1; i < userPath.length; i++) {
      const prev = userPath[i - 1];
      const curr = userPath[i];
      
      const length = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      
      pathSegments.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            left: prev.x - 2, // Center the line
            top: prev.y - 2,
            width: length,
            height: 4, // Thicker line for better visibility
            backgroundColor: '#007AFF',
            borderRadius: 2, // Rounded corners
            transform: [{ rotate: `${angle}rad` }],
            transformOrigin: '0 0',
          }}
        />
      );
    }
    
    return pathSegments;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Trace the letter "{letter}" below
      </Text>
      
      <View style={styles.tracingArea} {...panResponder.panHandlers}>
        {/* Letter template */}
        {renderLetterTemplate()}
        
        {/* Start indicator */}
        {!hasStarted && (
          <View style={styles.startIndicator}>
            <Text style={styles.startIndicatorText}>Start here</Text>
          </View>
        )}
        
        {/* User's tracing - solid marker */}
        {renderUserPath()}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetButton} onPress={resetTracing}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>

      {hasStarted && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>
            Accuracy: {accuracy}%
          </Text>
          <Text style={styles.feedbackText}>
            Points: {userPath.length}
          </Text>
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
  instruction: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tracingArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 20,
    position: 'relative',
  },
  controls: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  feedback: {
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    marginBottom: 5,
  },
  startIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -10 }],
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  startIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 