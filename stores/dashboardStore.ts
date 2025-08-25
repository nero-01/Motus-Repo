import { create } from 'zustand';
import { dashboardService, DashboardStats } from '../services/supabase/dashboard';

interface DashboardState {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: (userId: string) => Promise<void>;
  updateStats: (stats: Partial<DashboardStats>) => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: {
    routinesCompleted: 0,
    routinesRemaining: 0,
    mealsPlanned: 0,
    worksheetsAvailable: 0,
    newMessages: 0,
    expensesToReview: 0,
  },
  isLoading: false,
  error: null,

  fetchDashboardData: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const stats = await dashboardService.getDashboardStats(userId);
      set({ stats, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load dashboard data', 
        isLoading: false 
      });
    }
  },

  updateStats: (newStats) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats }
    }));
  },

  clearError: () => {
    set({ error: null });
  },
})); 