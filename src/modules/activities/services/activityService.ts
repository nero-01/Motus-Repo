import { Activity, ActivityFilter, ActivityStats, ActivitySession, ActivityRecommendation } from '../types';

export class ActivityService {
  private static activities: Activity[] = [
    {
      id: '1',
      title: 'Color Mixing Experiment',
      description: 'Learn about primary and secondary colors through hands-on mixing',
      type: 'educational',
      category: 'science',
      ageRange: '3-4',
      duration: 20,
      difficulty: 'easy',
      materials: ['Red paint', 'Blue paint', 'Yellow paint', 'White paper', 'Paintbrushes'],
      instructions: [
        'Set up three cups with primary colors',
        'Let child mix colors on paper',
        'Discuss what colors are created',
        'Create a color wheel together'
      ],
      tags: ['colors', 'science', 'art'],
      isFavorite: false,
      isCompleted: false,
    },
    {
      id: '2',
      title: 'Nature Scavenger Hunt',
      description: 'Explore outdoors and find items from a nature checklist',
      type: 'outdoor',
      category: 'nature',
      ageRange: '4-5',
      duration: 30,
      difficulty: 'easy',
      materials: ['Scavenger hunt list', 'Basket or bag', 'Magnifying glass'],
      instructions: [
        'Print or create a nature checklist',
        'Walk around the neighborhood or park',
        'Find and collect items from the list',
        'Discuss what was found'
      ],
      tags: ['outdoor', 'nature', 'exploration'],
      isFavorite: true,
      isCompleted: false,
    },
    {
      id: '3',
      title: 'DIY Musical Instruments',
      description: 'Create simple musical instruments from household items',
      type: 'creative',
      category: 'music',
      ageRange: '5-6',
      duration: 45,
      difficulty: 'medium',
      materials: ['Empty containers', 'Rice or beans', 'Rubber bands', 'Cardboard tubes'],
      instructions: [
        'Fill containers with different materials',
        'Create shakers and drums',
        'Make a simple guitar with rubber bands',
        'Have a family music session'
      ],
      tags: ['music', 'crafts', 'sound'],
      isFavorite: false,
      isCompleted: false,
    },
    {
      id: '4',
      title: 'Math with Building Blocks',
      description: 'Learn counting, shapes, and basic math through block play',
      type: 'educational',
      category: 'math',
      ageRange: '2-3',
      duration: 25,
      difficulty: 'easy',
      materials: ['Building blocks', 'Number cards', 'Shape cards'],
      instructions: [
        'Count blocks as you build',
        'Sort blocks by color and shape',
        'Create patterns with blocks',
        'Build towers of different heights'
      ],
      tags: ['math', 'building', 'shapes'],
      isFavorite: false,
      isCompleted: false,
    },
    {
      id: '5',
      title: 'Story Time with Props',
      description: 'Bring stories to life with homemade props and costumes',
      type: 'creative',
      category: 'reading',
      ageRange: '3-4',
      duration: 35,
      difficulty: 'easy',
      materials: ['Favorite book', 'Props from around the house', 'Costumes'],
      instructions: [
        'Choose a favorite story',
        'Gather props that match the story',
        'Read the story with dramatic voices',
        'Act out scenes with props'
      ],
      tags: ['reading', 'drama', 'imagination'],
      isFavorite: true,
      isCompleted: false,
    },
  ];

  static async getActivities(filter?: ActivityFilter): Promise<Activity[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredActivities = [...this.activities];
    
    if (filter) {
      if (filter.type?.length) {
        filteredActivities = filteredActivities.filter(activity => 
          filter.type!.includes(activity.type)
        );
      }
      
      if (filter.category?.length) {
        filteredActivities = filteredActivities.filter(activity => 
          filter.category!.includes(activity.category)
        );
      }
      
      if (filter.ageRange?.length) {
        filteredActivities = filteredActivities.filter(activity => 
          filter.ageRange!.includes(activity.ageRange)
        );
      }
      
      if (filter.difficulty?.length) {
        filteredActivities = filteredActivities.filter(activity => 
          filter.difficulty!.includes(activity.difficulty)
        );
      }
      
      if (filter.isCompleted !== undefined) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.isCompleted === filter.isCompleted
        );
      }
      
      if (filter.isFavorite !== undefined) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.isFavorite === filter.isFavorite
        );
      }
    }
    
    return filteredActivities;
  }

  static async getActivityById(id: string): Promise<Activity | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.activities.find(activity => activity.id === id) || null;
  }

  static async getActivityStats(): Promise<ActivityStats> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const completedActivities = this.activities.filter(a => a.isCompleted);
    const favoriteActivities = this.activities.filter(a => a.isFavorite);
    
    return {
      totalActivities: this.activities.length,
      completedToday: Math.floor(Math.random() * 3) + 1,
      completedThisWeek: Math.floor(Math.random() * 10) + 5,
      completedThisMonth: Math.floor(Math.random() * 30) + 15,
      favoriteActivities: favoriteActivities.length,
      averageRating: 4.2,
      mostPopularCategory: 'arts_crafts',
      totalTimeSpent: 120,
    };
  }

  static async toggleFavorite(activityId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isFavorite = !activity.isFavorite;
    }
  }

  static async markAsCompleted(activityId: string, rating?: number, notes?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isCompleted = true;
      activity.completedAt = new Date().toISOString();
      activity.rating = rating;
      activity.notes = notes;
    }
  }

  static async getRecommendations(childAge: string, limit: number = 5): Promise<ActivityRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const recommendations: ActivityRecommendation[] = [];
    const ageRange = this.getAgeRange(childAge);
    
    const suitableActivities = this.activities.filter(activity => 
      activity.ageRange === ageRange && !activity.isCompleted
    );
    
    suitableActivities.slice(0, limit).forEach(activity => {
      recommendations.push({
        activity,
        reason: `Perfect for ${ageRange} age group`,
        confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      });
    });
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private static getAgeRange(childAge: string): string {
    const age = parseInt(childAge);
    if (age <= 1) return '0-1';
    if (age <= 2) return '1-2';
    if (age <= 3) return '2-3';
    if (age <= 4) return '3-4';
    if (age <= 5) return '4-5';
    if (age <= 6) return '5-6';
    if (age <= 7) return '6-7';
    if (age <= 8) return '7-8';
    if (age <= 9) return '8-9';
    if (age <= 10) return '9-10';
    return '10+';
  }

  static async startActivitySession(activityId: string): Promise<ActivitySession> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const session: ActivitySession = {
      id: `session_${Date.now()}`,
      activityId,
      startTime: new Date().toISOString(),
    };
    
    return session;
  }

  static async endActivitySession(sessionId: string, rating?: number, notes?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, you'd update the session in the database
    if (__DEV__) console.log('Session ended:', { sessionId, rating, notes });
  }
}
