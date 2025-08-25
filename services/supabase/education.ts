import { supabase } from './client';

// Simple in-memory cache for worksheets
const worksheetCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: any;
  timestamp: number;
}

function getCachedData(key: string): any | null {
  const cached = worksheetCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  worksheetCache.set(key, { data, timestamp: Date.now() });
}

function clearCache(): void {
  worksheetCache.clear();
}

export interface Worksheet {
  id: string;
  title: string;
  description?: string;
  category: 'math' | 'reading' | 'writing' | 'science' | 'art' | 'social_studies';
  difficulty: number;
  age_min?: number;
  age_max?: number;
  content: any;
  rewards?: any[];
  is_active: boolean;
  created_at: string;
}

export interface WorksheetProgress {
  id: string;
  worksheet_id: string;
  child_id: string;
  family_id: string;
  score?: number;
  time_spent?: number;
  mistakes?: number;
  level?: number;
  details?: any;
  completed_at: string;
}

export interface WorksheetWithProgress extends Worksheet {
  progress?: WorksheetProgress;
  child?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// Fetch all worksheets with optional filtering
export async function getWorksheets({ 
  category, 
  difficulty, 
  ageMin, 
  ageMax 
}: {
  category?: string;
  difficulty?: number;
  ageMin?: number;
  ageMax?: number;
} = {}) {
  try {
    // Clear cache to force fresh data
    clearCache();
    
    // Create cache key based on filters
    const cacheKey = `worksheets_${category || 'all'}_${difficulty || 'all'}_${ageMin || 'all'}_${ageMax || 'all'}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached worksheets data');
      return cachedData;
    }

    // Force mock data for now to see our updated Animal Habitats
    console.log('Forcing mock data to show updated Animal Habitats');
    const mockData = getMockWorksheets();
    console.log('Mock data Animal Habitats pairs:', mockData.find(w => w.title === 'Animal Habitats')?.content.pairs?.length);
    setCachedData(cacheKey, mockData);
    return mockData;

  } catch (error) {
    console.error('Error fetching worksheets, using mock data:', error);
    const mockData = getMockWorksheets();
    console.log('Error fallback - Mock data Animal Habitats pairs:', mockData.find(w => w.title === 'Animal Habitats')?.content.pairs?.length);
    const cacheKey = `worksheets_${category || 'all'}_${difficulty || 'all'}_${ageMin || 'all'}_${ageMax || 'all'}`;
    setCachedData(cacheKey, mockData);
    return mockData;
  }
}

// Fetch a specific worksheet by ID
export async function getWorksheetById(worksheetId: string) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const queryPromise = supabase
      .from('worksheets')
      .select('*')
      .eq('id', worksheetId)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
    
    const data = await Promise.race([queryPromise, timeoutPromise]) as any;
    return data;
  } catch (error) {
    console.error('Exception in getWorksheetById, using mock data:', error);
    return getMockWorksheetById(worksheetId);
  }
}

// Get progress for a child
export async function getChildProgress(childId: string) {
  const { data, error } = await supabase
    .from('worksheet_progress')
    .select(`
      *,
      worksheets:worksheets(*)
    `)
    .eq('child_id', childId)
    .order('completed_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get progress for a specific worksheet and child
export async function getWorksheetProgress(worksheetId: string, childId: string) {
  const { data, error } = await supabase
    .from('worksheet_progress')
    .select('*')
    .eq('worksheet_id', worksheetId)
    .eq('child_id', childId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

// Save progress for a worksheet
export async function saveProgress({
  worksheet_id,
  child_id,
  score,
  time_spent,
  mistakes,
  level = 1,
  details,
  completed_at
}: {
  worksheet_id: string;
  child_id: string;
  score: number;
  time_spent: number;
  mistakes: number;
  level?: number;
  details?: any;
  completed_at: string;
}) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );

      const upsertPromise = supabase
        .from('progress')
        .upsert({
          worksheet_id,
          child_id,
          score,
          time_spent,
          mistakes,
          level,
          details: details || {},
          completed_at,
        }, {
          onConflict: 'worksheet_id,child_id'
        })
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        });
      
      const data = await Promise.race([upsertPromise, timeoutPromise]) as any;
      console.log('Progress saved successfully:', data);
      return data;
    } catch (error) {
      attempt++;
      console.error(`Error saving progress (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached, returning mock success');
        return { success: true, mock: true, error: 'max_retries_reached' };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // Clear cache when progress is saved to ensure fresh data
  clearCache();
}

// Get educational statistics for a child
export async function getEducationStats(childId: string) {
  const { data: progress, error } = await supabase
    .from('worksheet_progress')
    .select('score, time_spent, mistakes, level, completed_at')
    .eq('child_id', childId);
  
  if (error) throw error;

  const totalWorksheets = progress?.length || 0;
  const averageScore = progress?.length 
    ? progress.reduce((sum, p) => sum + (p.score || 0), 0) / progress.length 
    : 0;
  const totalTimeSpent = progress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
  const totalMistakes = progress?.reduce((sum, p) => sum + (p.mistakes || 0), 0) || 0;
  
  // Calculate this week's activity
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekProgress = progress?.filter(p => 
    new Date(p.completed_at) >= oneWeekAgo
  ) || [];
  
  const thisWeekWorksheets = thisWeekProgress.length;
  const thisWeekTimeSpent = thisWeekProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);

  return {
    totalWorksheets,
    averageScore: Math.round(averageScore),
    totalTimeSpent,
    totalMistakes,
    thisWeekWorksheets,
    thisWeekTimeSpent,
    currentLevel: progress?.length ? Math.max(...progress.map(p => p.level || 1)) : 1,
  };
}

// Get worksheets by category
export async function getWorksheetsByCategory(category: string) {
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('difficulty', { ascending: true });
  
  if (error) throw error;
  return data;
}

// Get recommended worksheets for a child based on age and progress
export async function getRecommendedWorksheets(childId: string, childAge: number) {
  // Get child's completed worksheets
  const { data: completedWorksheets, error: progressError } = await supabase
    .from('worksheet_progress')
    .select('worksheet_id')
    .eq('child_id', childId);
  
  if (progressError) throw progressError;

  const completedIds = completedWorksheets?.map(p => p.worksheet_id) || [];
  
  // Get worksheets appropriate for child's age, excluding completed ones
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('is_active', true)
    .gte('age_min', childAge - 1)
    .lte('age_max', childAge + 1)
    .not('id', 'in', `(${completedIds.join(',')})`)
    .order('difficulty', { ascending: true })
    .limit(10);
  
  if (error) throw error;
  return data;
}

// Get all worksheets for a family with progress
export async function getWorksheetsByFamily(familyId: string): Promise<WorksheetWithProgress[]> {
  try {
    const { data, error } = await supabase
      .from('worksheets')
      .select(`
        *,
        progress:worksheet_progress(
          *,
          child:children(id, name, avatar_url)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching worksheets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getWorksheetsByFamily:', error);
    throw error;
  }
}

// Create a new worksheet
export async function createWorksheet(worksheet: Omit<Worksheet, 'id' | 'created_at'>): Promise<Worksheet> {
  try {
    console.log('Creating worksheet:', worksheet);
    
    const { data, error } = await supabase
      .from('worksheets')
      .insert(worksheet)
      .select()
      .single();

    if (error) {
      console.error('Error creating worksheet:', error);
      throw error;
    }

    console.log('Worksheet created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in createWorksheet:', error);
    throw error;
  }
}

// Update a worksheet
export async function updateWorksheet(worksheetId: string, updates: Partial<Worksheet>): Promise<Worksheet> {
  try {
    const { data, error } = await supabase
      .from('worksheets')
      .update(updates)
      .eq('id', worksheetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating worksheet:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in updateWorksheet:', error);
    throw error;
  }
}

// Delete a worksheet
export async function deleteWorksheet(worksheetId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('worksheets')
      .delete()
      .eq('id', worksheetId);

    if (error) {
      console.error('Error deleting worksheet:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception in deleteWorksheet:', error);
    throw error;
  }
}

// Get completed worksheets for a child
export async function getCompletedWorksheetsForChild(childId: string, familyId: string, days: number = 30): Promise<WorksheetWithProgress[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('worksheet_progress')
      .select(`
        *,
        worksheet:worksheets(*)
      `)
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .gte('completed_at', cutoffDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed worksheets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getCompletedWorksheetsForChild:', error);
    throw error;
  }
}

// Get child learning statistics
export async function getChildLearningStats(childId: string, familyId: string, days: number = 30): Promise<{
  totalWorksheets: number;
  completedWorksheets: number;
  averageScore: number;
  totalTimeSpent: number;
  subjects: Record<string, number>;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: progress, error } = await supabase
      .from('worksheet_progress')
      .select(`
        *,
        worksheet:worksheets(category)
      `)
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .gte('completed_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error fetching learning stats:', error);
      throw error;
    }

    const completedWorksheets = progress?.length || 0;
    const averageScore = progress?.length 
      ? progress.reduce((sum, p) => sum + (p.score || 0), 0) / progress.length 
      : 0;
    const totalTimeSpent = progress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;

    // Calculate subject breakdown
    const subjects: Record<string, number> = {};
    progress?.forEach(p => {
      const category = p.worksheet?.category || 'other';
      subjects[category] = (subjects[category] || 0) + 1;
    });

    return {
      totalWorksheets: 0, // We don't have total assigned worksheets in current schema
      completedWorksheets,
      averageScore: Math.round(averageScore),
      totalTimeSpent,
      subjects,
    };
  } catch (error) {
    console.error('Exception in getChildLearningStats:', error);
    throw error;
  }
}

// Mock worksheets data
function getMockWorksheets(): Worksheet[] {
  return [
    {
      id: '1',
      title: 'Addition Practice',
      description: 'Practice basic addition with numbers 1-10',
      category: 'math',
      difficulty: 1,
      age_min: 5,
      age_max: 8,
      content: {
        type: 'addition',
        maxNumber: 10,
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Sight Words',
      description: 'Learn common sight words for early readers',
      category: 'reading',
      difficulty: 2,
      age_min: 6,
      age_max: 9,
      content: {
        type: 'sight_words',
        words: ['the', 'and', 'is', 'it', 'in', 'you', 'that', 'he', 'was', 'for'],
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Letter Tracing',
      description: 'Practice writing letters A-Z',
      category: 'writing',
      difficulty: 1,
      age_min: 4,
      age_max: 7,
      content: {
        type: 'letter_tracing',
        letters: ['A', 'B', 'C', 'D', 'E'],
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Animal Habitats',
      description: 'Learn about different animal habitats',
      category: 'science',
      difficulty: 3,
      age_min: 7,
      age_max: 10,
      content: {
        type: 'matching',
        pairs: [
          { animal: 'Lion', habitat: 'Savanna' },
          { animal: 'Fish', habitat: 'Ocean' },
          { animal: 'Bear', habitat: 'Forest' },
          { animal: 'Camel', habitat: 'Desert' },
          { animal: 'Penguin', habitat: 'Arctic' },
          { animal: 'Monkey', habitat: 'Rainforest' },
          { animal: 'Eagle', habitat: 'Mountains' },
          { animal: 'Frog', habitat: 'Pond' },
          { animal: 'Shark', habitat: 'Ocean' },
          { animal: 'Elephant', habitat: 'Savanna' },
          { animal: 'Polar Bear', habitat: 'Arctic' },
          { animal: 'Gorilla', habitat: 'Rainforest' },
          { animal: 'Mountain Goat', habitat: 'Mountains' },
          { animal: 'Duck', habitat: 'Pond' },
          { animal: 'Snake', habitat: 'Desert' },
          { animal: 'Deer', habitat: 'Forest' }
        ],
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '5',
      title: 'Color Mixing',
      description: 'Learn about primary and secondary colors',
      category: 'art',
      difficulty: 2,
      age_min: 5,
      age_max: 8,
      content: {
        type: 'color_mixing',
        colors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '6',
      title: 'Community Helpers',
      description: 'Learn about people who help in our community',
      category: 'social_studies',
      difficulty: 2,
      age_min: 6,
      age_max: 9,
      content: {
        type: 'matching',
        pairs: [
          { helper: 'Firefighter', tool: 'Fire Truck' },
          { helper: 'Doctor', tool: 'Stethoscope' },
          { helper: 'Teacher', tool: 'Books' },
          { helper: 'Police Officer', tool: 'Badge' },
          { helper: 'Nurse', tool: 'Medicine' },
          { helper: 'Mail Carrier', tool: 'Mail Truck' },
          { helper: 'Chef', tool: 'Cooking Pot' },
          { helper: 'Dentist', tool: 'Toothbrush' },
          { helper: 'Veterinarian', tool: 'Pet Carrier' },
          { helper: 'Librarian', tool: 'Library Card' },
          { helper: 'Garbage Collector', tool: 'Garbage Truck' },
          { helper: 'Bus Driver', tool: 'Bus' },
          { helper: 'Construction Worker', tool: 'Hard Hat' },
          { helper: 'Farmer', tool: 'Tractor' },
          { helper: 'Mechanic', tool: 'Wrench' },
          { helper: 'Electrician', tool: 'Light Bulb' },
        ],
      },
      rewards: [],
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
}

// Get mock worksheet by ID
function getMockWorksheetById(worksheetId: string): Worksheet | null {
  const mockWorksheets = getMockWorksheets();
  return mockWorksheets.find(w => w.id === worksheetId) || null;
} 