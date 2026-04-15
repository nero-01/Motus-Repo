import { 
  Family, 
  Child, 
  Parent, 
  FamilySettings, 
  FamilyInvite, 
  ChildProgress, 
  ChildStats,
  FamilyFilter 
} from '../types';

export class FamilyService {
  private static families: Family[] = [
    {
      id: '1',
      name: 'The Smith Family',
      children: [
        {
          id: '1',
          name: 'Emma',
          age: 5,
          birthDate: '2019-03-15',
          gender: 'female',
          interests: ['art', 'music', 'animals'],
          allergies: ['peanuts'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Liam',
          age: 3,
          birthDate: '2021-07-22',
          gender: 'male',
          interests: ['cars', 'building', 'outdoors'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      parents: [
        {
          id: '1',
          name: 'Sarah Smith',
          email: 'sarah@example.com',
          role: 'primary',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Michael Smith',
          email: 'michael@example.com',
          role: 'secondary',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      settings: {
        notifications: {
          activities: true,
          routines: true,
          reminders: true,
          achievements: true
        },
        privacy: {
          shareProgress: false,
          sharePhotos: false,
          allowInvites: true
        },
        content: {
          ageAppropriateFiltering: true,
          educationalFocus: true,
          screenTimeLimits: {
            enabled: true,
            dailyLimit: 120
          }
        }
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  private static childProgress: ChildProgress[] = [
    {
      childId: '1',
      activityId: '1',
      completedAt: '2024-01-15T10:30:00Z',
      rating: 5,
      notes: 'Emma loved this activity!',
      duration: 45,
      difficulty: 'easy'
    },
    {
      childId: '1',
      activityId: '2',
      completedAt: '2024-01-16T14:20:00Z',
      rating: 4,
      duration: 30,
      difficulty: 'medium'
    }
  ];
  private static familyInvites: FamilyInvite[] = [];

  static async getFamilyInvites(
    familyId: string,
    status?: FamilyInvite['status']
  ): Promise<FamilyInvite[]> {
    const invites = this.familyInvites.filter((invite) => invite.familyId === familyId);
    if (!status) {
      return invites;
    }
    return invites.filter((invite) => invite.status === status);
  }

  static async getFamily(familyId: string): Promise<Family | null> {
    return this.families.find(f => f.id === familyId) || null;
  }

  static async getFamiliesByUserId(userId: string): Promise<Family[]> {
    return this.families.filter(f => 
      f.parents.some(p => p.id === userId)
    );
  }

  static async addChild(familyId: string, childData: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>): Promise<Child> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const newChild: Child = {
      ...childData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    family.children.push(newChild);
    family.updatedAt = new Date().toISOString();

    return newChild;
  }

  static async updateChild(familyId: string, childId: string, updates: Partial<Child>): Promise<Child> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const childIndex = family.children.findIndex(c => c.id === childId);
    if (childIndex === -1) {
      throw new Error('Child not found');
    }

    family.children[childIndex] = {
      ...family.children[childIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    family.updatedAt = new Date().toISOString();
    return family.children[childIndex];
  }

  static async removeChild(familyId: string, childId: string): Promise<void> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    family.children = family.children.filter(c => c.id !== childId);
    family.updatedAt = new Date().toISOString();
  }

  static async addParent(familyId: string, parentData: Omit<Parent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Parent> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const newParent: Parent = {
      ...parentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    family.parents.push(newParent);
    family.updatedAt = new Date().toISOString();

    return newParent;
  }

  static async updateFamilySettings(familyId: string, settings: Partial<FamilySettings>): Promise<FamilySettings> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    family.settings = {
      ...family.settings,
      ...settings
    };
    family.updatedAt = new Date().toISOString();

    return family.settings;
  }

  static async inviteParent(familyId: string, email: string, role: 'parent' | 'guardian'): Promise<FamilyInvite> {
    const family = this.families.find((f) => f.id === familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (family.parents.some((parent) => parent.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Parent already belongs to this family');
    }

    const existingPendingInvite = this.familyInvites.some(
      (invite) =>
        invite.familyId === familyId &&
        invite.email.toLowerCase() === normalizedEmail &&
        invite.status === 'pending'
    );
    if (existingPendingInvite) {
      throw new Error('A pending invite already exists for this email');
    }

    const invite: FamilyInvite = {
      id: Date.now().toString(),
      familyId,
      email: normalizedEmail,
      role,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString()
    };

    this.familyInvites.push(invite);
    return invite;
  }

  static async recordChildProgress(progress: Omit<ChildProgress, 'completedAt'>): Promise<ChildProgress> {
    const newProgress: ChildProgress = {
      ...progress,
      completedAt: new Date().toISOString()
    };

    this.childProgress.push(newProgress);
    return newProgress;
  }

  static async getChildStats(childId: string): Promise<ChildStats> {
    const childProgress = this.childProgress.filter(p => p.childId === childId);
    const completedActivities = childProgress.length;
    const totalTimeSpent = childProgress.reduce((sum, p) => sum + (p.duration || 0), 0);
    const averageRating = childProgress.length > 0 
      ? childProgress.reduce((sum, p) => sum + (p.rating || 0), 0) / childProgress.length 
      : 0;

    // Calculate streak (simplified)
    const sortedDates = childProgress
      .map(p => new Date(p.completedAt).toDateString())
      .sort()
      .reverse();

    let streakDays = 0;
    let currentDate = new Date();
    
    for (const dateStr of sortedDates) {
      const activityDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streakDays) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      childId,
      totalActivities: 0, // This would come from activities service
      completedActivities,
      favoriteActivities: 0, // This would come from activities service
      averageRating,
      totalTimeSpent,
      streakDays,
      lastActivityDate: childProgress.length > 0 
        ? childProgress[childProgress.length - 1].completedAt 
        : undefined
    };
  }

  static async getChildrenByAgeRange(minAge: number, maxAge: number): Promise<Child[]> {
    return this.families
      .flatMap(f => f.children)
      .filter(child => child.age >= minAge && child.age <= maxAge);
  }

  static async getChildrenByInterests(interests: string[]): Promise<Child[]> {
    return this.families
      .flatMap(f => f.children)
      .filter(child => 
        interests.some(interest => child.interests.includes(interest))
      );
  }

  static async getFamilyActivityRecommendations(familyId: string): Promise<string[]> {
    const family = this.families.find(f => f.id === familyId);
    if (!family) {
      return [];
    }

    const allInterests = family.children.flatMap(child => child.interests);
    const uniqueInterests = [...new Set(allInterests)];
    
    // In a real app, this would query the activities service
    return uniqueInterests;
  }
}
