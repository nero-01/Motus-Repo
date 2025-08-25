export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  category: ActivityCategory;
  ageRange: AgeRange;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  materials: string[];
  instructions: string[];
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  isFavorite: boolean;
  isCompleted: boolean;
  completedAt?: string;
  rating?: number;
  notes?: string;
}

export type ActivityType = 
  | 'educational'
  | 'creative'
  | 'physical'
  | 'social'
  | 'cognitive'
  | 'sensory'
  | 'outdoor'
  | 'indoor';

export type ActivityCategory = 
  | 'arts_crafts'
  | 'science'
  | 'math'
  | 'reading'
  | 'music'
  | 'cooking'
  | 'games'
  | 'exercise'
  | 'nature'
  | 'technology';

export type AgeRange = 
  | '0-1'
  | '1-2'
  | '2-3'
  | '3-4'
  | '4-5'
  | '5-6'
  | '6-7'
  | '7-8'
  | '8-9'
  | '9-10'
  | '10+';

export interface ActivityFilter {
  type?: ActivityType[];
  category?: ActivityCategory[];
  ageRange?: AgeRange[];
  difficulty?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  isCompleted?: boolean;
  isFavorite?: boolean;
}

export interface ActivityStats {
  totalActivities: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  favoriteActivities: number;
  averageRating: number;
  mostPopularCategory: ActivityCategory;
  totalTimeSpent: number; // in minutes
}

export interface ActivitySession {
  id: string;
  activityId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  rating?: number;
  photos?: string[];
}

export interface ActivityRecommendation {
  activity: Activity;
  reason: string;
  confidence: number;
}
