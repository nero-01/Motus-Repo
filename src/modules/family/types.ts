export interface Child {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  avatar?: string;
  interests: string[];
  allergies?: string[];
  specialNeeds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  children: Child[];
  parents: Parent[];
  settings: FamilySettings;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'primary' | 'secondary' | 'guardian';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FamilySettings {
  notifications: {
    activities: boolean;
    routines: boolean;
    reminders: boolean;
    achievements: boolean;
  };
  privacy: {
    shareProgress: boolean;
    sharePhotos: boolean;
    allowInvites: boolean;
  };
  content: {
    ageAppropriateFiltering: boolean;
    educationalFocus: boolean;
    screenTimeLimits: {
      enabled: boolean;
      dailyLimit: number; // in minutes
    };
  };
}

export interface FamilyInvite {
  id: string;
  familyId: string;
  email: string;
  role: 'parent' | 'guardian';
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: string;
  createdAt: string;
}

export interface ChildProgress {
  childId: string;
  activityId: string;
  completedAt: string;
  rating?: number;
  notes?: string;
  duration?: number; // in minutes
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ChildStats {
  childId: string;
  totalActivities: number;
  completedActivities: number;
  favoriteActivities: number;
  averageRating: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  lastActivityDate?: string;
}

export interface FamilyFilter {
  childIds?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  interests?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: {
    min: number;
    max: number;
  };
}
