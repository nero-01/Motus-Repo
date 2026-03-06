import { supabase } from './client';
import { Avatar } from '../../components/ui/AvatarSelector';

export interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  avatar_url?: string;
  avatar_data?: Avatar | null;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'parent' | 'co_parent' | 'member';
  joined_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Get current user's family
export async function getCurrentFamily(): Promise<Family | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: familyMembers, error } = await supabase
      .from('family_members')
      .select(`
        family_id,
        families (
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      if (__DEV__) console.error('Error fetching family members:', error);
      return null;
    }

    if (!familyMembers || familyMembers.length === 0) {
      if (__DEV__) console.log('No family members found for user');
      return null;
    }

    return familyMembers[0]?.families as unknown as Family || null;
  } catch (error) {
    if (__DEV__) console.error('Error getting current family:', error);
    return null;
  }
}

// Get family children
export async function getFamilyChildren(familyId: string): Promise<Child[]> {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error getting family children:', error);
    return [];
  }
}

// Add a new child to the family
export async function addChild(childData: {
  family_id: string;
  name: string;
  birth_date: string;
  avatar_data?: Avatar;
}): Promise<Child | null> {
  try {
    const { data, error } = await supabase
      .from('children')
      .insert({
        ...childData,
        avatar_url: childData.avatar_data ? JSON.stringify(childData.avatar_data) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error adding child:', error);
    return null;
  }
}

// Update child information
export async function updateChild(
  childId: string,
  updates: {
    name?: string;
    birth_date?: string;
    avatar_data?: Avatar;
    preferences?: any;
  }
): Promise<Child | null> {
  try {
    const updateData: any = { ...updates };
    if (updates.avatar_data) {
      updateData.avatar_url = JSON.stringify(updates.avatar_data);
      delete updateData.avatar_data;
    }

    const { data, error } = await supabase
      .from('children')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error updating child:', error);
    return null;
  }
}

// Delete a child
export async function deleteChild(childId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) throw error;
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting child:', error);
    return false;
  }
}

// Get family members
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        user:users (
          id,
          email,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error getting family members:', error);
    return [];
  }
}

// Add family member
export async function addFamilyMember(memberData: {
  family_id: string;
  user_id: string;
  role: 'parent' | 'co_parent' | 'member';
}): Promise<FamilyMember | null> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .insert(memberData)
      .select(`
        *,
        user:users (
          id,
          email,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error adding family member:', error);
    return null;
  }
}

// Update family member role
export async function updateFamilyMemberRole(
  memberId: string,
  role: 'parent' | 'co_parent' | 'member'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('family_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error updating family member role:', error);
    return false;
  }
}

// Remove family member
export async function removeFamilyMember(memberId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error removing family member:', error);
    return false;
  }
}

// Parse avatar data from stored JSON
export function parseAvatarData(avatarUrl?: string): Avatar | null {
  if (!avatarUrl) return null;
  
  try {
    return JSON.parse(avatarUrl);
  } catch (error) {
    if (__DEV__) console.error('Error parsing avatar data:', error);
    return null;
  }
}

// Mock data for development
export function getMockChildren(): Child[] {
  return [
    {
      id: '1',
      family_id: 'mock-family-1',
      name: 'Emma',
      birth_date: '2018-05-15',
      avatar_data: { id: '3', emoji: '👧', name: 'Girl', color: '#FFB3D9' },
      preferences: { theme: 'pink', favorite_activities: ['drawing', 'reading'] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      family_id: 'mock-family-1',
      name: 'Liam',
      birth_date: '2020-03-22',
      avatar_data: { id: '4', emoji: '👦', name: 'Boy', color: '#B3FFBA' },
      preferences: { theme: 'blue', favorite_activities: ['building', 'running'] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

// Create a mock family for demo purposes
export function createMockFamily(userId: string): Family {
  return {
    id: `mock-family-${Date.now()}`,
    name: 'Demo Family',
    description: 'A demo family for testing',
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
} 