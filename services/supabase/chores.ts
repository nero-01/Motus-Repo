import { supabase } from './client';

export interface Chore {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  category: 'cleaning' | 'laundry' | 'dishes' | 'garden' | 'other';
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimated_duration?: number; // in minutes
  points: number;
  is_recurring: boolean;
  recurrence_pattern?: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ChoreAssignment {
  id: string;
  chore_id: string;
  child_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  completed_at?: string;
  points_earned: number;
  notes?: string;
}

export interface ChoreWithAssignment extends Chore {
  assignment?: ChoreAssignment;
  child?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// Get all chores for a family
export async function getChoresByFamily(familyId: string): Promise<ChoreWithAssignment[]> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const queryPromise = supabase
      .from('chores')
      .select(`
        *,
        assignment:chore_assignments(
          *,
          child:children(id, name, avatar_url)
        )
      `)
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    const data = await Promise.race([queryPromise, timeoutPromise]) as any;
    return data || [];
  } catch (error) {
    console.error('Exception in getChoresByFamily, using mock data:', error);
    // Return mock data when database fails
    return [
      {
        id: '1',
        family_id: '00000000-0000-0000-0000-000000000000',
        title: 'Make Bed',
        description: 'Straighten sheets and fluff pillows',
        category: 'cleaning' as const,
        difficulty: 1,
        points: 5,
        is_recurring: true,
        is_active: true,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        family_id: '00000000-0000-0000-0000-000000000000',
        title: 'Clean Room',
        description: 'Put away toys and organize desk',
        category: 'cleaning' as const,
        difficulty: 3,
        points: 10,
        is_recurring: true,
        is_active: true,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        family_id: '00000000-0000-0000-0000-000000000000',
        title: 'Set Table',
        description: 'Help prepare dinner table',
        category: 'dishes' as const,
        difficulty: 1,
        points: 3,
        is_recurring: true,
        is_active: true,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

// Create a new chore
export async function createChore(chore: Omit<Chore, 'id' | 'created_at'>): Promise<Chore> {
  try {
    console.log('Creating chore:', chore);
    
    const { data, error } = await supabase
      .from('chores')
      .insert(chore)
      .select()
      .single();

    if (error) {
      console.error('Error creating chore:', error);
      throw error;
    }

    console.log('Chore created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in createChore:', error);
    throw error;
  }
}

// Update a chore
export async function updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore> {
  try {
    const { data, error } = await supabase
      .from('chores')
      .update(updates)
      .eq('id', choreId)
      .select()
      .single();

    if (error) {
      console.error('Error updating chore:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in updateChore:', error);
    throw error;
  }
}

// Delete a chore
export async function deleteChore(choreId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', choreId);

    if (error) {
      console.error('Error deleting chore:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteChore:', error);
    throw error;
  }
}

// Assign a chore to a child
export async function assignChore({ choreId, childId, assignedBy, dueDate }: {
  choreId: string;
  childId: string;
  assignedBy: string;
  dueDate?: string;
}): Promise<ChoreAssignment> {
  try {
    console.log('Assigning chore:', { choreId, childId, assignedBy, dueDate });
    
    const { data, error } = await supabase
      .from('chore_assignments')
      .insert({
        chore_id: choreId,
        child_id: childId,
        assigned_by: assignedBy,
        due_date: dueDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning chore:', error);
      throw error;
    }

    console.log('Chore assigned successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in assignChore:', error);
    throw error;
  }
}

// Complete a chore
export async function completeChore({ choreId, childId, completedBy, notes }: {
  choreId: string;
  childId: string;
  completedBy: string;
  notes?: string;
}): Promise<ChoreAssignment> {
  try {
    console.log('Completing chore:', { choreId, childId, completedBy, notes });
    
    // First, get the chore to calculate points
    const { data: chore, error: choreError } = await supabase
      .from('chores')
      .select('points')
      .eq('id', choreId)
      .single();

    if (choreError) {
      console.error('Error fetching chore for completion:', choreError);
      throw choreError;
    }

    // Update the assignment to mark as completed
    const { data, error } = await supabase
      .from('chore_assignments')
      .update({
        completed_at: new Date().toISOString(),
        points_earned: chore.points,
        notes,
      })
      .eq('chore_id', choreId)
      .eq('child_id', childId)
      .select()
      .single();

    if (error) {
      console.error('Error completing chore:', error);
      throw error;
    }

    // Add points to child's reward balance
    await addPointsToChild({
      childId,
      familyId: '', // Will be fetched from chore
      points: chore.points,
      reason: `Completed chore: ${choreId}`,
      awardedBy: completedBy,
    });

    console.log('Chore completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in completeChore:', error);
    throw error;
  }
}

// Get chore assignments for a child
export async function getChoreAssignmentsForChild(childId: string): Promise<ChoreAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('chore_assignments')
      .select(`
        *,
        chore:chores(*)
      `)
      .eq('child_id', childId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching chore assignments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getChoreAssignmentsForChild:', error);
    throw error;
  }
}

// Get pending chores for a child
export async function getPendingChoresForChild(childId: string): Promise<ChoreAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('chore_assignments')
      .select(`
        *,
        chore:chores(*)
      `)
      .eq('child_id', childId)
      .is('completed_at', null)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching pending chores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getPendingChoresForChild:', error);
    throw error;
  }
}

// Get completed chores for a child
export async function getCompletedChoresForChild(childId: string, days: number = 7): Promise<ChoreAssignment[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('chore_assignments')
      .select(`
        *,
        chore:chores(*)
      `)
      .eq('child_id', childId)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed chores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getCompletedChoresForChild:', error);
    throw error;
  }
}

// Helper function to add points to child (from rewards service)
async function addPointsToChild({ childId, familyId, points, reason, awardedBy }: {
  childId: string;
  familyId: string;
  points: number;
  reason: string;
  awardedBy: string;
}): Promise<void> {
  try {
    // Add to points log
    await supabase
      .from('points_log')
      .insert({
        child_id: childId,
        family_id: familyId,
        points_awarded: points,
        reason,
        awarded_by: awardedBy,
      });

    // Update child's reward balance
    await supabase
      .from('child_rewards')
      .upsert({
        child_id: childId,
        family_id: familyId,
        points_earned: points,
      }, {
        onConflict: 'child_id,family_id'
      });
  } catch (error) {
    console.error('Error adding points to child:', error);
    throw error;
  }
} 