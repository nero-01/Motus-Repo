import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useFamilyStore } from '../../../stores/familyStore';

export default function CoParentingScreen() {
  const { user } = useAuthStore();
  const { currentFamily, familyMembers, isLoading, error, loadFamilies } = useFamilyStore();

  useEffect(() => {
    if (user?.id) {
      void loadFamilies(user.id);
    }
  }, [user?.id, loadFamilies]);

  const coParentingFeatures = [
    {
      id: 'calendar',
      title: 'Shared Calendar',
      description: 'Manage family events and schedules',
      icon: '📅',
      color: '#E3F2FD',
      route: '/features/co-parenting/calendar',
    },
    {
      id: 'messages',
      title: 'Communication',
      description: 'Send messages to co-parents',
      icon: '💬',
      color: '#E8F5E8',
      route: '/features/co-parenting/messages',
    },
    {
      id: 'expenses',
      title: 'Shared Expenses',
      description: 'Track and split family expenses',
      icon: '💰',
      color: '#FFF3E0',
      route: '/features/co-parenting/expenses',
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Share important family documents',
      icon: '📄',
      color: '#FCE4EC',
      route: '/features/co-parenting/documents',
    },
  ];

  const handleNavigateToFeature = (route: string) => {
    router.push(route);
  };

  if (isLoading && !currentFamily) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading co-parenting features...</Text>
      </View>
    );
  }

  if (!currentFamily) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleMedium" style={styles.noFamilyTitle}>
          No family workspace yet
        </Text>
        <Text variant="bodyMedium" style={styles.noFamilyBody}>
          Co-parenting tools need a family. Complete onboarding or join a family from Home, then come back here.
        </Text>
        {error ? (
          <Text variant="bodySmall" style={styles.noFamilyError}>
            {error}
          </Text>
        ) : null}
        {user?.id ? (
          <Button
            mode="contained"
            style={styles.retryButton}
            onPress={() => void loadFamilies(user.id)}
          >
            Retry
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>
            👨‍👩‍👧‍👦 Co-Parenting Hub
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Coordinate and communicate with your co-parents
          </Text>
        </Surface>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text variant="titleLarge">{familyMembers.length}</Text>
                <Text variant="bodySmall">Family Members</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="titleLarge">0</Text>
                <Text variant="bodySmall">Upcoming Events</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="titleLarge">0</Text>
                <Text variant="bodySmall">Unread Messages</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="titleLarge">0</Text>
                <Text variant="bodySmall">Pending Expenses</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Co-Parenting Features */}
        <View style={styles.featuresContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Co-Parenting Tools
          </Text>
          
          {coParentingFeatures.map((feature) => (
            <Card
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => handleNavigateToFeature(feature.route)}
            >
              <Card.Content>
                <View style={styles.featureContent}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.iconText}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureInfo}>
                    <Text variant="titleMedium" style={styles.featureTitle}>
                      {feature.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => handleNavigateToFeature(feature.route)}
                    style={styles.featureButton}
                    compact
                  >
                    Open
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActionsContainer}>
              <Button
                mode="outlined"
                onPress={() => router.push('/features/co-parenting/calendar/create')}
                style={styles.quickActionButton}
                icon={() => <Text style={{ fontSize: 16 }}>➕</Text>}
              >
                Add Event
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => router.push('/features/co-parenting/messages')}
                style={styles.quickActionButton}
                icon={() => <Text style={{ fontSize: 16 }}>💬</Text>}
              >
                Send Message
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => router.push('/features/co-parenting/expenses/create')}
                style={styles.quickActionButton}
                icon={() => <Text style={{ fontSize: 16 }}>➕</Text>}
              >
                Add Expense
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => router.push('/features/co-parenting/documents')}
                style={styles.quickActionButton}
                icon={() => <Text style={{ fontSize: 16 }}>📤</Text>}
              >
                Upload Document
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Family Members */}
        <Card style={styles.membersCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Family Members
            </Text>
            
            {familyMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No family members found. Add members to start co-parenting!
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {familyMembers.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text variant="bodyMedium" style={styles.memberName}>
                        {member.user?.first_name} {member.user?.last_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.memberRole}>
                        {member.role}
                      </Text>
                    </View>
                    <Button
                      mode="outlined"
                      onPress={() => router.push(`/features/co-parenting/messages?to=${member.user_id}`)}
                      compact
                    >
                      Message
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  statsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  featureCard: {
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#666',
  },
  featureButton: {
    marginLeft: 8,
  },
  quickActionsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
    elevation: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
  },
  membersCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    elevation: 2,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  noFamilyTitle: {
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  noFamilyBody: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  noFamilyError: {
    marginTop: 16,
    color: '#c62828',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  messageFab: {
    backgroundColor: '#E8F5E8',
  },
  expenseFab: {
    backgroundColor: '#FFF3E0',
  },
  uploadFab: {
    backgroundColor: '#FCE4EC',
  },
}); 