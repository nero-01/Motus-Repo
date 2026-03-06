import { supabase } from './client';

export interface DashboardStats {
  routinesCompleted: number;
  routinesRemaining: number;
  mealsPlanned: number;
  worksheetsAvailable: number;
  newMessages: number;
  expensesToReview: number;
}

export const dashboardService = {
  // Fetch dashboard statistics for a user
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get user's family first
      const { data: familyData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .single();

      if (!familyData) {
        throw new Error('User is not part of any family');
      }

      const familyId = familyData.family_id;

      // Get routines completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: routinesCompletedData } = await supabase
        .from('task_completions')
        .select('id')
        .gte('completed_at', today)
        .lt('completed_at', today + 'T23:59:59');

      // Get total active routines for family
      const { data: totalRoutinesData } = await supabase
        .from('routines')
        .select('id')
        .eq('family_id', familyId)
        .eq('is_active', true);

      // Get meals planned for this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: mealsData } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('family_id', familyId)
        .gte('date', weekStart.toISOString().split('T')[0]);

      // Get available worksheets
      const { data: worksheetsData } = await supabase
        .from('worksheets')
        .select('id')
        .eq('is_active', true);

      // Get unread messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id')
        .eq('family_id', familyId)
        .eq('is_read', false);

      // Get expenses to review
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('id')
        .eq('family_id', familyId)
        .eq('status', 'pending');

      const stats: DashboardStats = {
        routinesCompleted: routinesCompletedData?.length || 0,
        routinesRemaining: Math.max(0, (totalRoutinesData?.length || 0) - (routinesCompletedData?.length || 0)),
        mealsPlanned: mealsData?.length || 0,
        worksheetsAvailable: worksheetsData?.length || 0,
        newMessages: messagesData?.length || 0,
        expensesToReview: expensesData?.length || 0,
      };

      return stats;
    } catch (error) {
      if (__DEV__) console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to load dashboard data');
    }
  },

  // Get recent activities for the dashboard
  async getRecentActivities(userId: string, limit: number = 10) {
    try {
      // TODO: Implement real query
      // This would fetch recent routine completions, meal plans, etc.
      
      return [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching recent activities:', error);
      throw new Error('Failed to load recent activities');
    }
  },

  // Get upcoming tasks/events
  async getUpcomingTasks(userId: string) {
    try {
      // TODO: Implement real query
      // This would fetch upcoming routines, appointments, etc.
      
      return [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to load upcoming tasks');
    }
  },
}; 