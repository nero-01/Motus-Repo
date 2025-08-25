import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useFamilyStore } from '../../stores/familyStore';
import { getCurrentFamily } from '../../services/supabase/family';
import { testSupabaseConnection, testDatabaseSchema, supabase } from '../../services/supabase/client';

interface ChildForm {
  name: string;
  birthDate: string;
}

export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const { addChildToFamily, isLoading, error, clearError } = useFamilyStore();
  
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [children, setChildren] = useState<ChildForm[]>([]);
  const [currentChild, setCurrentChild] = useState<ChildForm>({ name: '', birthDate: '' });

  const handleNext = () => {
    if (step === 1 && !familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addChild = () => {
    if (!currentChild.name.trim() || !currentChild.birthDate) {
      Alert.alert('Error', 'Please fill in all child information');
      return;
    }
    
    setChildren([...children, currentChild]);
    setCurrentChild({ name: '', birthDate: '' });
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      console.log('=== ONBOARDING DEBUG START ===');
      console.log('User object:', {
        id: user.id,
        email: user.email,
        isMock: user.id.startsWith('mock-'),
        user_metadata: user.user_metadata
      });
      console.log('Family data:', {
        name: familyName,
        description: familyDescription,
        childrenCount: children.length
      });
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const connectionTest = await testSupabaseConnection();
      console.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        console.error('Supabase connection test failed:', connectionTest.error);
        
        // Check if this is a mock user (for testing without database)
        if (user.id.startsWith('mock-')) {
          console.log('Using mock mode for onboarding');
          Alert.alert(
            'Mock Mode',
            'Database not available. Using mock mode for testing.',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)'),
              },
            ]
          );
          return;
        }
        
        Alert.alert('Connection Error', 'Unable to connect to the database. Please check your internet connection and try again.');
        return;
      }
      console.log('Supabase connection test passed');
      
      // Test user authentication
      console.log('Testing user authentication...');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('Auth test result:', { user: currentUser?.id, error: authError });
      
      if (authError || !currentUser) {
        console.error('Authentication test failed:', authError);
        Alert.alert('Authentication Error', 'User authentication failed. Please sign in again.');
        return;
      }
      
      // Test database schema
      console.log('Testing database schema...');
      const schemaTest = await testDatabaseSchema();
      console.log('Schema test result:', schemaTest);
      
      if (!schemaTest.success) {
        console.error('Database schema test failed:', schemaTest.error);
        Alert.alert('Database Error', 'Unable to connect to the database. Please check your database setup.');
        return;
      }
      console.log('Database schema test passed');
      
      // Check if user profile exists in database
      console.log('Checking user profile in database...');
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('User profile check result:', { profile: userProfile, error: profileError });
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('User profile check failed:', profileError);
        Alert.alert('Profile Error', 'Unable to verify user profile. Please try signing in again.');
        return;
      }
      
      if (!userProfile) {
        console.log('User profile not found, this might be expected for new users');
      }
      
      // Get current family (should exist from user creation)
      console.log('Getting current family');
      const family = await getCurrentFamily();
      
      if (!family) {
        console.log('No family found, creating mock family for demo');
        // For demo purposes, we'll just proceed without a family
        Alert.alert(
          'Demo Mode',
          'No family found. You can add children later in the settings.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
        return;
      }
      
      console.log('Family found:', family.id);

      // Add children if family exists
      console.log('Adding children:', children.length);
      for (const child of children) {
        console.log('Adding child:', child.name);
        await addChildToFamily({
          family_id: family.id,
          name: child.name,
          birth_date: child.birthDate,
          preferences: {},
        });
        console.log('Child added successfully:', child.name);
      }

      console.log('Onboarding completed successfully');
      console.log('=== ONBOARDING DEBUG END ===');

      Alert.alert(
        'Success!',
        'Your family has been set up successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('=== ONBOARDING ERROR DEBUG ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : 'No message');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Error keys:', Object.keys(error || {}));
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      console.error('User context:', {
        id: user?.id,
        email: user?.email,
        isMock: user?.id?.startsWith('mock-')
      });
      console.error('Family context:', {
        name: familyName,
        description: familyDescription,
        childrenCount: children.length
      });
      console.error('=== END ERROR DEBUG ===');
      
      let errorMessage = 'Failed to set up family. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your database setup.';
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'A family with this name already exists.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Database tables not found. Please run the database setup first.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle non-Error objects
        const errorStr = JSON.stringify(error);
        if (errorStr.includes('permission')) {
          errorMessage = 'Permission denied. Please check your database setup.';
        } else if (errorStr.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = `Unknown error: ${errorStr}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderStep1 = () => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.stepTitle}>
          Step 1: Family Information
        </Text>
        <Text style={styles.stepDescription}>
          Let's start by setting up your family profile
        </Text>

        <TextInput
          label="Family Name"
          value={familyName}
          onChangeText={setFamilyName}
          style={styles.input}
          placeholder="e.g., The Smith Family"
        />

        <TextInput
          label="Description (Optional)"
          value={familyDescription}
          onChangeText={setFamilyDescription}
          style={styles.input}
          placeholder="Tell us about your family"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.stepTitle}>
          Step 2: Add Children
        </Text>
        <Text style={styles.stepDescription}>
          Add your children to the family
        </Text>

        {children.map((child, index) => (
          <React.Fragment key={`child-${index}`}>
            <View style={styles.childChip}>
              <Text style={styles.childChipText}>
                {child.name} - {child.birthDate}
              </Text>
              <TouchableOpacity
                onPress={() => removeChild(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </React.Fragment>
        ))}

        <View style={styles.addChildForm}>
          <TextInput
            label="Child's Name"
            value={currentChild.name}
            onChangeText={(text) => setCurrentChild({ ...currentChild, name: text })}
            style={styles.input}
            placeholder="e.g., Emma"
          />

          <TextInput
            label="Birth Date"
            value={currentChild.birthDate}
            onChangeText={(text) => setCurrentChild({ ...currentChild, birthDate: text })}
            style={styles.input}
            placeholder="YYYY-MM-DD"
          />

          <TouchableOpacity
            onPress={addChild}
            style={[styles.addButton, !currentChild.name.trim() || !currentChild.birthDate ? styles.addButtonDisabled : null]}
            disabled={!currentChild.name.trim() || !currentChild.birthDate}
          >
            <Text style={[styles.addButtonText, !currentChild.name.trim() || !currentChild.birthDate ? styles.addButtonTextDisabled : null]}>
              Add Child
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.stepTitle}>
          Step 3: Review & Complete
        </Text>
        <Text style={styles.stepDescription}>
          Review your family information before completing setup
        </Text>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>
            Family: {familyName}
          </Text>
          {familyDescription && (
            <Text style={styles.reviewDescription}>
              {familyDescription}
            </Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>
            Children ({children.length})
          </Text>
          {children.map((child, index) => (
            <React.Fragment key={`review-child-${index}`}>
              <View style={styles.reviewChild}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{child.name.charAt(0)}</Text>
                </View>
                <View style={styles.reviewChildInfo}>
                  <Text style={styles.reviewChildName}>{child.name}</Text>
                  <Text style={styles.reviewChildDate}>
                    Born: {child.birthDate}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome to MotusTots!
          </Text>
          <Text style={styles.subtitle}>
            Let's set up your family profile
          </Text>
        </View>

        <View style={styles.progress}>
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={`progress-${stepNumber}`}>
              <View
                style={[
                  styles.progressDot,
                  stepNumber === step && styles.progressDotActive,
                  stepNumber < step && styles.progressDotCompleted,
                ]}
              />
            </React.Fragment>
          ))}
        </View>

        {renderCurrentStep()}

        {error && (
          <View style={styles.errorCard}>
            <View style={styles.cardContent}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.footerButton, styles.backButton]}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.footerButton, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleComplete}
              style={[styles.footerButton, styles.primaryButton, isLoading ? styles.primaryButtonDisabled : null]}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  childChipText: {
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addChildForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    color: '#999',
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  reviewChild: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewChildInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewChildName: {
    fontSize: 16,
    fontWeight: '500',
  },
  reviewChildDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 