import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import LetterTracing from '../../../components/worksheets/LetterTracing';
import ColorMixing from '../../../components/worksheets/ColorMixing';
import AnimalHabitats from '../../../components/worksheets/AnimalHabitats';
import CommunityHelpers from '../../../components/worksheets/CommunityHelpers';
import { saveProgress } from '../../../services/supabase/education';
import { useFamilyStore } from '../../../src/modules/family/store/familyStore';
import { WORKSHEET_TYPE_TO_CATALOG_ID } from '../../../utils/worksheetCatalog';

export default function WorksheetsScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [currentWorksheet, setCurrentWorksheet] = useState<string | null>(type || null);
  const currentFamily = useFamilyStore((s) => s.currentFamily);
  const selectedChildId = useFamilyStore((s) => s.selectedChildId);

  const persistWorksheetScore = useCallback(
    async (accuracy: number, sheetType: string) => {
      const worksheet_id = WORKSHEET_TYPE_TO_CATALOG_ID[sheetType];
      if (!worksheet_id) return;
      const familyId = currentFamily?.id;
      const childId = selectedChildId ?? currentFamily?.children?.[0]?.id;
      if (!familyId || !childId) {
        if (__DEV__) console.warn('Worksheet progress not saved: no family or child selected.');
        return;
      }
      await saveProgress({
        worksheet_id,
        child_id: childId,
        family_id: familyId,
        score: Math.round(accuracy),
        time_spent: 0,
        mistakes: 0,
        details: { source: 'features/worksheets', type: sheetType },
        completed_at: new Date().toISOString(),
      });
    },
    [currentFamily, selectedChildId]
  );

  const renderWorksheet = () => {
    switch (currentWorksheet) {
      case 'letter_tracing':
        return (
          <LetterTracing
            letter="A"
            onComplete={(accuracy) => {
              void persistWorksheetScore(accuracy, 'letter_tracing');
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
              void persistWorksheetScore(accuracy, 'color_mixing');
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
              void persistWorksheetScore(accuracy, 'animal_habitats');
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
              void persistWorksheetScore(accuracy, 'community_helpers');
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
