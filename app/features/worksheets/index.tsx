import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';

export default function WorksheetsScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [currentWorksheet, setCurrentWorksheet] = useState<string | null>(type || null);

  const renderWorksheet = () => {
    switch (currentWorksheet) {
      case 'letter_tracing':
        return (
          <LetterTracing
            letter="A"
            onComplete={(accuracy) => {
              console.log('Letter Tracing completed with accuracy:', accuracy);
              // Handle completion
            }}
            onNext={() => {
              setCurrentWorksheet(null);
              router.back();
            }}
          />
        );
      
      case 'color_mixing':
        return (
          <ColorMixing
            onComplete={(accuracy) => {
              console.log('Color Mixing completed with accuracy:', accuracy);
              // Handle completion
            }}
            onNext={() => {
              setCurrentWorksheet(null);
              router.back();
            }}
          />
        );
      
      case 'animal_habitats':
        return (
          <AnimalHabitats
            onComplete={(accuracy) => {
              console.log('Animal Habitats completed with accuracy:', accuracy);
              // Handle completion
            }}
            onNext={() => {
              setCurrentWorksheet(null);
              router.back();
            }}
          />
        );
      
      case 'community_helpers':
        return (
          <CommunityHelpers
            onComplete={(accuracy) => {
              console.log('Community Helpers completed with accuracy:', accuracy);
              // Handle completion
            }}
            onNext={() => {
              setCurrentWorksheet(null);
              router.back();
            }}
          />
        );
      
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Worksheets</Text>
            <Text style={styles.subtitle}>Select a worksheet to begin</Text>
            
            <ScrollView style={styles.worksheetsList}>
              <Card style={styles.worksheetCard}>
                <Card.Content>
                  <Text style={styles.worksheetTitle}>Letter Tracing</Text>
                  <Text style={styles.worksheetDescription}>
                    Practice tracing uppercase and lowercase letters
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => setCurrentWorksheet('letter_tracing')}
                  >
                    Start
                  </Button>
                </Card.Actions>
              </Card>
              
              <Card style={styles.worksheetCard}>
                <Card.Content>
                  <Text style={styles.worksheetTitle}>Color Mixing</Text>
                  <Text style={styles.worksheetDescription}>
                    Learn about primary and secondary colors
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => setCurrentWorksheet('color_mixing')}
                  >
                    Start
                  </Button>
                </Card.Actions>
              </Card>
              
              <Card style={styles.worksheetCard}>
                <Card.Content>
                  <Text style={styles.worksheetTitle}>Animal Habitats</Text>
                  <Text style={styles.worksheetDescription}>
                    Learn where different animals live
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => setCurrentWorksheet('animal_habitats')}
                  >
                    Start
                  </Button>
                </Card.Actions>
              </Card>
              
              <Card style={styles.worksheetCard}>
                <Card.Content>
                  <Text style={styles.worksheetTitle}>Community Helpers</Text>
                  <Text style={styles.worksheetDescription}>
                    Learn about people who help our community
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => setCurrentWorksheet('community_helpers')}
                  >
                    Start
                  </Button>
                </Card.Actions>
              </Card>
            </ScrollView>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderWorksheet()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006A60',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  worksheetsList: {
    flex: 1,
  },
  worksheetCard: {
    marginBottom: 16,
  },
  worksheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  worksheetDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
