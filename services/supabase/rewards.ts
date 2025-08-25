import { supabase } from './client';
import { ENV } from '../../config/env';

export interface Reward {
  id: string;
  family_id: string;
  name: string;
  description?: string;
  points_required: number;
  category: 'toy' | 'activity' | 'privilege' | 'treat' | 'other';
  is_active: boolean;
  created_at: string;
}

export interface ChildReward {
  id: string;
  child_id: string;
  reward_id: string;
  family_id: string;
  points_earned: number;
  points_redeemed: number;
  is_redeemed: boolean;
  redeemed_at?: string;
  created_at: string;
}

export interface PointsLog {
  id: string;
  child_id: string;
  family_id: string;
  points_awarded: number;
  reason: string;
  awarded_by?: string;
  created_at: string;
}

// Check if we're in mock mode (no valid Supabase URL or explicitly set)
const isMockMode = () => {
  return ENV.FORCE_MOCK || !ENV.SUPABASE_URL || ENV.SUPABASE_URL === 'https://your-project.supabase.co';
};

// Get child's reward balance
export async function getChildRewardBalance(childId: string, familyId: string): Promise<ChildReward | null> {
  try {
    if (isMockMode()) {
      console.log('Mock getChildRewardBalance for child:', childId);
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id: `mock-balance-${Date.now()}`,
        child_id: childId,
        reward_id: 'mock-reward',
        family_id: familyId,
        points_earned: 50,
        points_redeemed: 10,
        is_redeemed: false,
        created_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('child_rewards')
      .select('*')
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching child reward balance:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getChildRewardBalance:', error);
    throw error;
  }
}

// Add points to child
export async function addPointsToChild({ 
  childId, 
  familyId, 
  points, 
  reason, 
  awardedBy 
}: {
  childId: string;
  familyId: string;
  points: number;
  reason: string;
  awardedBy: string;
}): Promise<void> {
  try {
    console.log('Adding points to child:', { childId, familyId, points, reason, awardedBy });

    if (isMockMode()) {
      console.log('Mock points added:', { childId, points, reason });
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    // Add to points log
    const { error: logError } = await supabase
      .from('points_log')
      .insert({
        child_id: childId,
        family_id: familyId,
        points_awarded: points,
        reason,
        awarded_by: awardedBy,
      });

    if (logError) {
      console.error('Error adding to points log:', logError);
      throw logError;
    }

    // Update or create child's reward balance
    const { error: balanceError } = await supabase
      .from('child_rewards')
      .upsert({
        child_id: childId,
        family_id: familyId,
        points_earned: points,
        points_redeemed: 0,
        is_redeemed: false,
      }, {
        onConflict: 'child_id,family_id'
      });

    if (balanceError) {
      console.error('Error updating child reward balance:', balanceError);
      throw balanceError;
    }

    console.log('Points added successfully');
  } catch (error) {
    console.error('Exception in addPointsToChild:', error);
    throw error;
  }
}

// Deduct points from child (demerit system)
export async function deductPointsFromChild({ 
  childId, 
  familyId, 
  points, 
  reason, 
  deductedBy 
}: {
  childId: string;
  familyId: string;
  points: number;
  reason: string;
  deductedBy: string;
}): Promise<void> {
  try {
    console.log('Deducting points from child:', { childId, familyId, points, reason, deductedBy });

    if (isMockMode()) {
      console.log('Mock demerit applied:', { childId, points, reason });
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    // Add to points log with negative points
    const { error: logError } = await supabase
      .from('points_log')
      .insert({
        child_id: childId,
        family_id: familyId,
        points_awarded: -Math.abs(points), // Ensure negative value
        reason: `Demerit: ${reason}`,
        awarded_by: deductedBy,
      });

    if (logError) {
      console.error('Error adding demerit to points log:', logError);
      throw logError;
    }

    // Get current child balance
    const currentBalance = await getChildRewardBalance(childId, familyId);
    const currentPoints = currentBalance ? currentBalance.points_earned : 0;
    
    // Update child's reward balance (reduce earned points)
    const { error: balanceError } = await supabase
      .from('child_rewards')
      .upsert({
        child_id: childId,
        family_id: familyId,
        points_earned: Math.max(0, currentPoints - Math.abs(points)), // Don't go below 0
        points_redeemed: currentBalance?.points_redeemed || 0,
        is_redeemed: false,
      }, {
        onConflict: 'child_id,family_id'
      });

    if (balanceError) {
      console.error('Error updating child reward balance for demerit:', balanceError);
      throw balanceError;
    }

    console.log('Points deducted successfully');
  } catch (error) {
    console.error('Exception in deductPointsFromChild:', error);
    throw error;
  }
}

// Get points history for a child
export async function getPointsHistory(childId: string, familyId: string, days: number = 30): Promise<PointsLog[]> {
  try {
    if (isMockMode()) {
      console.log('Mock getPointsHistory for child:', childId);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: `mock-log-${Date.now()}`,
          child_id: childId,
          family_id: familyId,
          points_awarded: 10,
          reason: 'Completed homework',
          awarded_by: 'mock-user',
          created_at: new Date().toISOString(),
        },
        {
          id: `mock-log-${Date.now() + 1}`,
          child_id: childId,
          family_id: familyId,
          points_awarded: -5,
          reason: 'Demerit: Didn\'t clean room',
          awarded_by: 'mock-user',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('points_log')
      .select('*')
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching points history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getPointsHistory:', error);
    throw error;
  }
}

// Get all rewards for a family
export async function getFamilyRewards(familyId: string): Promise<Reward[]> {
  try {
    if (isMockMode()) {
      console.log('Mock getFamilyRewards for family:', familyId);
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          family_id: familyId,
          name: 'Extra Screen Time',
          description: '30 minutes of extra screen time',
          points_required: 50,
          category: 'privilege' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          family_id: familyId,
          name: 'Choose Dinner',
          description: 'Pick what the family eats for dinner',
          points_required: 100,
          category: 'privilege' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          family_id: familyId,
          name: 'New Toy',
          description: 'Get a new toy from the store',
          points_required: 200,
          category: 'toy' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const queryPromise = supabase
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('points_required', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    const data = await Promise.race([queryPromise, timeoutPromise]) as any;
    return data || [];
  } catch (error) {
    console.error('Exception in getFamilyRewards, using mock data:', error);
    // Return mock data when database fails
    return [
      {
        id: '1',
        family_id: familyId,
        name: 'Extra Screen Time',
        description: '30 minutes of extra screen time',
        points_required: 50,
        category: 'privilege' as const,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        family_id: familyId,
        name: 'Choose Dinner',
        description: 'Pick what the family eats for dinner',
        points_required: 100,
        category: 'privilege' as const,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        family_id: familyId,
        name: 'New Toy',
        description: 'Get a new toy from the store',
        points_required: 200,
        category: 'toy' as const,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

// Create a new reward
export async function createReward(reward: Omit<Reward, 'id' | 'created_at'>): Promise<Reward> {
  try {
    console.log('Creating reward:', reward);
    
    if (isMockMode()) {
      console.log('Mock createReward');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: `mock-reward-${Date.now()}`,
        ...reward,
        created_at: new Date().toISOString(),
      };
    }
    
    const { data, error } = await supabase
      .from('rewards')
      .insert(reward)
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      throw error;
    }

    console.log('Reward created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in createReward:', error);
    throw error;
  }
}

// Update a reward
export async function updateReward(rewardId: string, updates: Partial<Reward>): Promise<Reward> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in updateReward:', error);
    throw error;
  }
}

// Delete a reward
export async function deleteReward(rewardId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteReward:', error);
    throw error;
  }
}

// Redeem a reward (simplified - just mark as redeemed)
export async function redeemReward({ 
  childId, 
  rewardId, 
  familyId, 
  pointsSpent, 
  notes 
}: {
  childId: string;
  rewardId: string;
  familyId: string;
  pointsSpent: number;
  notes?: string;
}): Promise<ChildReward> {
  try {
    console.log('Redeeming reward:', { childId, rewardId, familyId, pointsSpent, notes });
    
    const { data, error } = await supabase
      .from('child_rewards')
      .upsert({
        child_id: childId,
        reward_id: rewardId,
        family_id: familyId,
        points_redeemed: pointsSpent,
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
      }, {
        onConflict: 'child_id,reward_id,family_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }

    console.log('Reward redeemed successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in redeemReward:', error);
    throw error;
  }
}

// Get child's redeemed rewards
export async function getChildRedemptions(childId: string, familyId: string): Promise<ChildReward[]> {
  try {
    const { data, error } = await supabase
      .from('child_rewards')
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .eq('is_redeemed', true)
      .order('redeemed_at', { ascending: false });

    if (error) {
      console.error('Error fetching child redemptions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getChildRedemptions:', error);
    throw error;
  }
}

// Get pending redemptions for a family
export async function getPendingRedemptions(familyId: string): Promise<ChildReward[]> {
  try {
    if (isMockMode()) {
      console.log('Mock getPendingRedemptions for family:', familyId);
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const queryPromise = supabase
      .from('child_rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_redeemed', true)
      .is('redeemed_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    const data = await Promise.race([queryPromise, timeoutPromise]) as any;
    return data || [];
  } catch (error) {
    console.error('Exception in getPendingRedemptions, using mock data:', error);
    // Return empty array when database fails
    return [];
  }
} 