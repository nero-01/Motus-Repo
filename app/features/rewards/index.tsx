import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Surface, FAB, Dialog, Portal, TextInput, SegmentedButtons, ActivityIndicator, Avatar, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFamilyStore } from '../../../stores/familyStore';
import { useAuthStore } from '../../../stores/authStore';
import { 
  getFamilyRewards, 
  createReward, 
  getPendingRedemptions, 
  getChildRewardBalance,
  addPointsToChild,
  deductPointsFromChild,
  type Reward,
  type ChildReward
} from '../../../services/supabase/rewards';
import { getFamilyChildren } from '../../../services/supabase/family';

interface ChildRewardWithReward extends ChildReward {
  reward?: Reward;
  child?: { name: string };
}

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { children, currentFamily } = useFamilyStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [childBalances, setChildBalances] = useState<ChildReward[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<ChildRewardWithReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showDemeritDialog, setShowDemeritDialog] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [viewMode, setViewMode] = useState<'parent' | 'child'>('parent');
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    points_required: 10,
    category: 'toy' as const,
  });
  const [demeritData, setDemeritData] = useState({
    points: 10,
    reason: '',
    selectedChildren: [] as string[],
  });

  useEffect(() => {
    loadRewards();
  }, [currentFamily]);

  const loadRewards = async () => {
    if (!currentFamily) return;

    try {
      setIsLoading(true);
      const [rewardsData, redemptionsData] = await Promise.all([
        getFamilyRewards(currentFamily.id),
        getPendingRedemptions(currentFamily.id)
      ]);

      setRewards(rewardsData);
      setPendingRedemptions(redemptionsData);

      // Load child balances
      const balances = await Promise.all(
        children.map(child => getChildRewardBalance(child.id, currentFamily.id))
      );
      setChildBalances(balances.filter(Boolean) as ChildReward[]);
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRewards();
  };

  const handleAddReward = async () => {
    if (!newReward.name.trim() || !currentFamily) {
      Alert.alert('Error', 'Please enter a reward title');
      return;
    }

    try {
      await createReward({
        family_id: currentFamily.id,
        name: newReward.name,
        description: newReward.description,
        points_required: newReward.points_required,
        category: newReward.category,
        is_active: true,
      });

      setShowAddDialog(false);
      setNewReward({
        name: '',
        description: '',
        points_required: 10,
        category: 'toy',
      });
      loadRewards();
      Alert.alert('Success', 'Reward created successfully!');
    } catch (error) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', 'Failed to create reward');
    }
  };

  const handleRedeemReward = async () => {
    if (!selectedReward || !currentFamily) return;

    try {
      await addPointsToChild({
        childId: selectedReward.id,
        familyId: currentFamily.id,
        points: selectedReward.points_required,
        reason: 'Reward redemption',
        awardedBy: user?.id || '',
      });

      setShowRedeemDialog(false);
      setSelectedReward(null);
      loadRewards();
      Alert.alert('Success', 'Reward redeemed successfully!');
    } catch (error) {
      console.error('Error redeeming reward:', error);
      Alert.alert('Error', 'Failed to redeem reward');
    }
  };

  const handleDemerit = async () => {
    if (!currentFamily || demeritData.selectedChildren.length === 0 || !demeritData.reason.trim()) {
      Alert.alert('Error', 'Please select children and provide a reason for the demerit');
      return;
    }

    try {
      // Apply demerit to all selected children
      await Promise.all(
        demeritData.selectedChildren.map(childId =>
          deductPointsFromChild({
            childId,
            familyId: currentFamily.id,
            points: demeritData.points,
            reason: demeritData.reason,
            deductedBy: user?.id || '',
          })
        )
      );

      setShowDemeritDialog(false);
      setDemeritData({
        points: 10,
        reason: '',
        selectedChildren: [],
      });
      loadRewards();
      Alert.alert('Success', `Demerit applied to ${demeritData.selectedChildren.length} child(ren)`);
    } catch (error) {
      console.error('Error applying demerit:', error);
      Alert.alert('Error', 'Failed to apply demerit');
    }
  };

  const toggleChildSelection = (childId: string) => {
    setDemeritData(prev => ({
      ...prev,
      selectedChildren: prev.selectedChildren.includes(childId)
        ? prev.selectedChildren.filter(id => id !== childId)
        : [...prev.selectedChildren, childId]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      toy: '🧸',
      activity: '🎮',
      privilege: '⭐',
      treat: '🍦',
      other: '🎁'
    };
    return icons[category] || '🎁';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      toy: '#E3F2FD',
      activity: '#E8F5E8',
      privilege: '#FFF3E0',
      treat: '#FCE4EC',
      other: '#F3E5F5'
    };
    return colors[category] || '#F5F5F5';
  };

  const getChildBalance = (childId: string) => {
    const balance = childBalances.find(b => b.child_id === childId);
    return balance ? balance.points_earned - balance.points_redeemed : 0;
  };

  const getPointsDisplayStyle = (points: number) => {
    return {
      ...styles.pointsText,
      color: points < 0 ? '#f44336' : points === 0 ? '#666' : '#4CAF50',
    };
  };

  const getAvailableRewards = (childId: string) => {
    const childPoints = getChildBalance(childId);
    return rewards.filter(reward => 
      reward.is_active && reward.points_required <= childPoints
    );
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.title}>
              🏆 Rewards System
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Motivate and celebrate achievements
            </Text>
          </View>
        </Surface>

        {/* View Mode Toggle */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <SegmentedButtons
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'parent' | 'child')}
              buttons={[
                { value: 'parent', label: 'Parent View' },
                { value: 'child', label: 'Child View' }
              ]}
            />
          </Card.Content>
        </Card>

        {viewMode === 'parent' ? (
          /* Parent View */
          <>
            {/* Family Overview */}
            <Card style={styles.overviewCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Family Points Overview
                </Text>
                <View style={styles.childrenPoints}>
                  {children.map((child: any) => (
                    <Card key={child.id} style={styles.childPointCard}>
                      <Card.Content>
                        <View style={styles.childPointHeader}>
                          <Avatar.Text size={40} label={child.avatar_url || '👤'} />
                          <View style={styles.childPointInfo}>
                            <Text variant="titleMedium">{child.name}</Text>
                            <Text variant="headlineSmall" style={getPointsDisplayStyle(getChildBalance(child.id))}>
                              {getChildBalance(child.id)} pts
                            </Text>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.quickActionsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Quick Actions
                </Text>
                <View style={styles.quickActionsRow}>
                  <Button
                    mode="contained"
                    onPress={() => setShowDemeritDialog(true)}
                    style={styles.demeritActionButton}
                    icon="minus-circle"
                  >
                    Apply Demerit
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setShowAddDialog(true)}
                    style={styles.addRewardButton}
                    icon="plus-circle"
                  >
                    Add Reward
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Pending Redemptions */}
            {pendingRedemptions.length > 0 && (
              <Card style={styles.pendingCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Pending Redemptions ({pendingRedemptions.length})
                  </Text>
                  {pendingRedemptions.map((redemption) => (
                    <Card key={redemption.id} style={styles.redemptionCard}>
                      <Card.Content>
                        <View style={styles.redemptionHeader}>
                          <Text variant="titleMedium">
                            {getChildName(redemption.child_id)} wants to redeem:
                          </Text>
                          <Text variant="bodyMedium" style={styles.rewardTitle}>
                            {redemption.reward?.name} ({redemption.points_redeemed} pts)
                          </Text>
                        </View>
                        <View style={styles.redemptionActions}>
                          <Button
                            mode="contained"
                            onPress={() => handleRedeemReward()}
                            style={styles.approveButton}
                          >
                            Redeem
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Available Rewards */}
            <Card style={styles.rewardsCard}>
              <Card.Content>
                <View style={styles.rewardsHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Available Rewards ({rewards.length})
                  </Text>
                </View>
                
                {rewards.length === 0 ? (
                  <Text style={styles.emptyText}>No rewards created yet. Add your first reward!</Text>
                ) : (
                  <View style={styles.rewardsList}>
                    {rewards.map((reward) => (
                      <Card key={reward.id} style={styles.rewardCard}>
                        <Card.Content>
                          <View style={styles.rewardHeader}>
                            <View style={styles.rewardInfo}>
                              <Text variant="titleMedium">{reward.name}</Text>
                              {reward.description && (
                                <Text variant="bodySmall">{reward.description}</Text>
                              )}
                            </View>
                            <Chip
                              style={[
                                styles.categoryChip,
                                { backgroundColor: getCategoryColor(reward.category) }
                              ]}
                            >
                              {getCategoryIcon(reward.category)} {reward.points_required} pts
                            </Chip>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          /* Child View */
          <>
            {/* Child Points */}
            {children.map((child: any) => (
              <Card key={child.id} style={styles.childCard}>
                <Card.Content>
                  <View style={styles.childHeader}>
                    <Avatar.Text size={50} label={child.avatar_url || '👤'} />
                    <View style={styles.childInfo}>
                      <Text variant="headlineSmall">{child.name}</Text>
                      <Text variant="titleLarge" style={getPointsDisplayStyle(getChildBalance(child.id))}>
                        {getChildBalance(child.id)} points
                      </Text>
                    </View>
                  </View>

                  {/* Available Rewards for this child */}
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Available Rewards
                  </Text>
                  <View style={styles.availableRewards}>
                    {getAvailableRewards(child.id).map((reward) => (
                      <Card key={reward.id} style={styles.availableRewardCard}>
                        <Card.Content>
                          <View style={styles.availableRewardHeader}>
                            <View style={styles.availableRewardInfo}>
                              <Text variant="titleMedium">{reward.name}</Text>
                              {reward.description && (
                                <Text variant="bodySmall">{reward.description}</Text>
                              )}
                            </View>
                            <Button
                              mode="contained"
                              onPress={() => {
                                setSelectedReward(reward);
                                setShowRedeemDialog(true);
                              }}
                            >
                              Redeem ({reward.points_required} pts)
                            </Button>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                    {getAvailableRewards(child.id).length === 0 && (
                      <Text style={styles.emptyText}>
                        No rewards available. Complete more chores to earn points!
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Reward Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Reward</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reward Name"
              value={newReward.name}
              onChangeText={(text) => setNewReward({ ...newReward, name: text })}
              style={styles.dialogInput}
            />
            <TextInput
              label="Description (optional)"
              value={newReward.description}
              onChangeText={(text) => setNewReward({ ...newReward, description: text })}
              style={styles.dialogInput}
            />
            <TextInput
              label="Points Required"
              value={newReward.points_required.toString()}
              onChangeText={(text) => setNewReward({ ...newReward, points_required: parseInt(text) || 0 })}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <SegmentedButtons
              value={newReward.category}
              onValueChange={(value) => setNewReward({ ...newReward, category: value as any })}
              buttons={[
                { value: 'toy', label: 'Toy' },
                { value: 'activity', label: 'Activity' },
                { value: 'privilege', label: 'Privilege' },
                { value: 'treat', label: 'Treat' },
                { value: 'other', label: 'Other' }
              ]}
              style={styles.dialogSegmented}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddReward}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Redeem Reward Dialog */}
      <Portal>
        <Dialog visible={showRedeemDialog} onDismiss={() => setShowRedeemDialog(false)}>
          <Dialog.Title>Redeem Reward</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to redeem this reward?</Text>
            {selectedReward && (
              <Text style={styles.dialogLabel}>
                {selectedReward.name} ({selectedReward.points_required} points)
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRedeemDialog(false)}>Cancel</Button>
            <Button onPress={handleRedeemReward}>Redeem</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Demerit Dialog */}
      <Portal>
        <Dialog visible={showDemeritDialog} onDismiss={() => setShowDemeritDialog(false)}>
          <Dialog.Title>Apply Demerit</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogLabel}>Select Children:</Text>
            {children.map((child: any) => (
              <View key={child.id} style={styles.childSelectionRow}>
                <Checkbox
                  status={demeritData.selectedChildren.includes(child.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleChildSelection(child.id)}
                />
                <View style={styles.childSelectionInfo}>
                  <Text variant="bodyMedium">{child.name}</Text>
                  <Text variant="bodySmall" style={styles.currentPoints}>
                    Current points: {getChildBalance(child.id)}
                  </Text>
                </View>
              </View>
            ))}
            
            <TextInput
              label="Points to Deduct"
              value={demeritData.points.toString()}
              onChangeText={(text) => setDemeritData({ ...demeritData, points: parseInt(text) || 0 })}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Reason for Demerit"
              value={demeritData.reason}
              onChangeText={(text) => setDemeritData({ ...demeritData, reason: text })}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
              placeholder="e.g., Didn't complete homework, Broke house rules, etc."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDemeritDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleDemerit}
              disabled={demeritData.selectedChildren.length === 0 || !demeritData.reason.trim()}
            >
              Apply Demerit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerContent: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
  },
  modeCard: {
    margin: 16,
    marginBottom: 8,
  },
  overviewCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  childrenPoints: {
    gap: 12,
  },
  childPointCard: {
    marginBottom: 8,
  },
  childPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childPointInfo: {
    flex: 1,
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rewardsCard: {
    margin: 16,
    marginBottom: 8,
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    marginBottom: 8,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rewardInfo: {
    flex: 1,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  pendingCard: {
    margin: 16,
    marginBottom: 8,
  },
  redemptionCard: {
    marginBottom: 8,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardTitle: {
    fontWeight: 'bold',
  },
  redemptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  childCard: {
    margin: 16,
    marginBottom: 8,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  availableRewards: {
    marginBottom: 24,
  },
  availableRewardCard: {
    marginBottom: 8,
  },
  availableRewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableRewardInfo: {
    flex: 1,
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogLabel: {
    marginBottom: 8,
  },
  dialogSegmented: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  childSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childSelectionInfo: {
    flex: 1,
  },
  currentPoints: {
    opacity: 0.7,
  },
  quickActionsCard: {
    margin: 16,
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  demeritActionButton: {
    backgroundColor: '#f44336',
    flex: 1,
  },
  addRewardButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
}); 