import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  IconButton,
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons
} from 'react-native-paper';
import { useFamilyStore } from '../store/familyStore';
import { useAuthStore } from '../../auth/store/authStore';
import { Child, Parent } from '../types';
import { FamilyService } from '../services/familyService';

interface FamilyDashboardProps {
  onNavigateToChild?: (childId: string) => void;
  onNavigateToSettings?: () => void;
  onNavigateToAnalytics?: () => void;
}

export default function FamilyDashboard({ 
  onNavigateToChild, 
  onNavigateToSettings,
  onNavigateToAnalytics
}: FamilyDashboardProps) {
  const {
    currentFamily,
    childStats,
    isLoading,
    error,
    loadFamilies,
    loadFamily,
    refreshAllChildStats,
    addChild,
    removeChild,
    clearError
  } = useFamilyStore();

  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildData, setNewChildData] = useState({
    name: '',
    age: '',
    gender: 'other' as 'male' | 'female' | 'other',
    interests: [] as string[]
  });
  const [showInviteParentModal, setShowInviteParentModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'parent' | 'guardian'>('parent');

  useEffect(() => {
    if (user?.id) {
      void loadFamilies(user.id);
      return;
    }
    // Fallback for standalone module usage where auth store is not wired.
    void loadFamily('1');
  }, [user?.id, loadFamilies, loadFamily]);

  useEffect(() => {
    if (currentFamily) {
      refreshAllChildStats();
    }
  }, [currentFamily]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadFamilies(user.id);
      if (currentFamily) {
        await refreshAllChildStats();
      }
    }
    setRefreshing(false);
  };

  const handleAddChild = async () => {
    if (!currentFamily || !newChildData.name || !newChildData.age) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addChild(currentFamily.id, {
        name: newChildData.name,
        age: parseInt(newChildData.age),
        birthDate: new Date().toISOString(), // Simplified for demo
        gender: newChildData.gender,
        interests: newChildData.interests
      });
      
      setShowAddChildModal(false);
      setNewChildData({ name: '', age: '', gender: 'other', interests: [] });
      Alert.alert('Success', 'Child added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add child');
    }
  };

  const handleRemoveChild = (child: Child) => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (currentFamily) {
              try {
                await removeChild(currentFamily.id, child.id);
                Alert.alert('Success', 'Child removed successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to remove child');
              }
            }
          }
        }
      ]
    );
  };

  const handleInviteParent = async () => {
    if (!currentFamily) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (currentFamily.parents.some((p) => p.email.toLowerCase() === email)) {
      Alert.alert('Already added', 'This parent is already part of the family.');
      return;
    }
    try {
      await FamilyService.inviteParent(currentFamily.id, email, inviteRole);
      setShowInviteParentModal(false);
      setInviteEmail('');
      setInviteRole('parent');
      Alert.alert('Invite sent', `Invitation sent to ${email}.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send invite');
    }
  };

  const handleViewAnalytics = () => {
    if (onNavigateToAnalytics) {
      onNavigateToAnalytics();
      return;
    }
    Alert.alert(
      'Analytics',
      'Analytics view is available from the main app analytics screen.'
    );
  };

  const getAgeGroup = (age: number) => {
    if (age < 2) return 'Infant';
    if (age < 5) return 'Toddler';
    if (age < 8) return 'Preschool';
    if (age < 12) return 'School Age';
    return 'Pre-teen';
  };

  const getProgressColor = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          {error}
        </Text>
        <Button mode="contained" onPress={clearError}>
          Try Again
        </Button>
      </View>
    );
  }

  if (!currentFamily) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall">No family found</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Please set up your family profile to get started.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Family Header */}
        <Card style={styles.familyCard}>
          <Card.Content>
            <View style={styles.familyHeader}>
              <View>
                <Text variant="headlineSmall">{currentFamily.name}</Text>
                <Text variant="bodyMedium" style={styles.familySubtitle}>
                  {currentFamily.children.length} children • {currentFamily.parents.length} parents
                </Text>
              </View>
              <IconButton
                icon="cog"
                size={24}
                onPress={onNavigateToSettings}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Children Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Children</Text>
            <Button
              mode="text"
              onPress={() => setShowAddChildModal(true)}
              icon="plus"
            >
              Add Child
            </Button>
          </View>

          {currentFamily.children.map((child) => {
            const stats = childStats[child.id];
            return (
              <Card key={child.id} style={styles.childCard}>
                <Card.Content>
                  <View style={styles.childHeader}>
                    <Avatar.Text 
                      size={50} 
                      label={child.name.substring(0, 2).toUpperCase()} 
                    />
                    <View style={styles.childInfo}>
                      <Text variant="titleMedium">{child.name}</Text>
                      <Text variant="bodyMedium">
                        {child.age} years old • {getAgeGroup(child.age)}
                      </Text>
                      <View style={styles.interestsContainer}>
                        {child.interests.slice(0, 3).map((interest, index) => (
                          <Chip key={index} compact style={styles.interestChip}>
                            {interest}
                          </Chip>
                        ))}
                        {child.interests.length > 3 && (
                          <Chip compact>+{child.interests.length - 3}</Chip>
                        )}
                      </View>
                    </View>
                    <View style={styles.childActions}>
                      <IconButton
                        icon="account-edit"
                        size={20}
                        onPress={() => onNavigateToChild?.(child.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleRemoveChild(child)}
                      />
                    </View>
                  </View>

                  {stats && (
                    <View style={styles.statsContainer}>
                      <Divider style={styles.divider} />
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text variant="titleLarge" style={{ color: getProgressColor(stats.completedActivities, stats.totalActivities) }}>
                            {stats.completedActivities}
                          </Text>
                          <Text variant="bodySmall">Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text variant="titleLarge">{stats.streakDays}</Text>
                          <Text variant="bodySmall">Day Streak</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text variant="titleLarge">{Math.round(stats.averageRating * 10) / 10}</Text>
                          <Text variant="bodySmall">Avg Rating</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text variant="titleLarge">{Math.round(stats.totalTimeSpent / 60)}</Text>
                          <Text variant="bodySmall">Hours</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </View>

        {/* Parents Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Parents & Guardians</Text>
          {currentFamily.parents.map((parent) => (
            <Card key={parent.id} style={styles.parentCard}>
              <Card.Content>
                <View style={styles.parentHeader}>
                  <Avatar.Text 
                    size={40} 
                    label={parent.name.substring(0, 2).toUpperCase()} 
                  />
                  <View style={styles.parentInfo}>
                    <Text variant="titleMedium">{parent.name}</Text>
                    <Text variant="bodyMedium">{parent.email}</Text>
                    <Chip compact style={styles.roleChip}>
                      {parent.role}
                    </Chip>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="plus"
              style={styles.actionButton}
              onPress={() => setShowAddChildModal(true)}
            >
              Add Child
            </Button>
            <Button
              mode="outlined"
              icon="account-multiple-plus"
              style={styles.actionButton}
              onPress={() => setShowInviteParentModal(true)}
            >
              Invite Parent
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              style={styles.actionButton}
              onPress={handleViewAnalytics}
            >
              View Analytics
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Add Child Modal */}
      <Portal>
        <Modal
          visible={showInviteParentModal}
          onDismiss={() => setShowInviteParentModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Invite Parent</Text>
          <TextInput
            label="Parent Email"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Text variant="bodyMedium" style={styles.label}>Role</Text>
          <SegmentedButtons
            value={inviteRole}
            onValueChange={(value) => setInviteRole(value as 'parent' | 'guardian')}
            buttons={[
              { value: 'parent', label: 'Parent' },
              { value: 'guardian', label: 'Guardian' }
            ]}
            style={styles.segmentedButtons}
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowInviteParentModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleInviteParent}
              style={styles.modalButton}
            >
              Send Invite
            </Button>
          </View>
        </Modal>

        <Modal
          visible={showAddChildModal}
          onDismiss={() => setShowAddChildModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Add Child</Text>
          
          <TextInput
            label="Name"
            value={newChildData.name}
            onChangeText={(text) => setNewChildData({ ...newChildData, name: text })}
            style={styles.input}
          />
          
          <TextInput
            label="Age"
            value={newChildData.age}
            onChangeText={(text) => setNewChildData({ ...newChildData, age: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Text variant="bodyMedium" style={styles.label}>Gender</Text>
          <SegmentedButtons
            value={newChildData.gender}
            onValueChange={(value) => setNewChildData({ ...newChildData, gender: value as 'male' | 'female' | 'other' })}
            buttons={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAddChildModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddChild}
              style={styles.modalButton}
              loading={isLoading}
            >
              Add Child
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
  },
  familyCard: {
    margin: 16,
    elevation: 2,
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familySubtitle: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  childCard: {
    marginBottom: 12,
    elevation: 2,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childActions: {
    flexDirection: 'row',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  interestChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  statsContainer: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  parentCard: {
    marginBottom: 8,
    elevation: 1,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  roleChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
