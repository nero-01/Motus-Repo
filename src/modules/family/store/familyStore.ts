import { create } from 'zustand';
import { FamilyService } from '../services/familyService';
import { Family, Child, Parent, FamilySettings, ChildStats } from '../types';

interface FamilyState {
  // State
  currentFamily: Family | null;
  families: Family[];
  selectedChildId: string | null;
  childStats: Record<string, ChildStats>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFamilies: (userId: string) => Promise<void>;
  loadFamily: (familyId: string) => Promise<void>;
  setCurrentFamily: (family: Family) => void;
  setSelectedChild: (childId: string | null) => void;
  
  // Child Management
  addChild: (familyId: string, childData: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Child>;
  updateChild: (familyId: string, childId: string, updates: Partial<Child>) => Promise<Child>;
  removeChild: (familyId: string, childId: string) => Promise<void>;
  
  // Parent Management
  addParent: (familyId: string, parentData: Omit<Parent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Parent>;
  
  // Settings
  updateFamilySettings: (familyId: string, settings: Partial<FamilySettings>) => Promise<FamilySettings>;
  
  // Stats
  loadChildStats: (childId: string) => Promise<void>;
  refreshAllChildStats: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  getCurrentChild: () => Child | null;
  getChildrenByAgeRange: (minAge: number, maxAge: number) => Promise<Child[]>;
  getChildrenByInterests: (interests: string[]) => Promise<Child[]>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  // Initial state
  currentFamily: null,
  families: [],
  selectedChildId: null,
  childStats: {},
  isLoading: false,
  error: null,

  // Load families for a user
  loadFamilies: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const families = await FamilyService.getFamiliesByUserId(userId);
      set({ families, isLoading: false });
      
      // Set current family to first one if available
      if (families.length > 0 && !get().currentFamily) {
        set({ currentFamily: families[0] });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load families',
        isLoading: false 
      });
    }
  },

  // Load specific family
  loadFamily: async (familyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const family = await FamilyService.getFamily(familyId);
      if (family) {
        set({ currentFamily: family, isLoading: false });
      } else {
        set({ error: 'Family not found', isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load family',
        isLoading: false 
      });
    }
  },

  // Set current family
  setCurrentFamily: (family: Family) => {
    set({ currentFamily: family });
  },

  // Set selected child
  setSelectedChild: (childId: string | null) => {
    set({ selectedChildId: childId });
  },

  // Add child
  addChild: async (familyId: string, childData: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const newChild = await FamilyService.addChild(familyId, childData);
      
      // Update current family if it matches
      const { currentFamily } = get();
      if (currentFamily && currentFamily.id === familyId) {
        const updatedFamily = {
          ...currentFamily,
          children: [...currentFamily.children, newChild],
          updatedAt: new Date().toISOString()
        };
        set({ currentFamily: updatedFamily });
      }

      // Update families list
      const { families } = get();
      const updatedFamilies = families.map(f => 
        f.id === familyId 
          ? { ...f, children: [...f.children, newChild], updatedAt: new Date().toISOString() }
          : f
      );
      set({ families: updatedFamilies, isLoading: false });
      
      return newChild;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add child',
        isLoading: false 
      });
      throw error;
    }
  },

  // Update child
  updateChild: async (familyId: string, childId: string, updates: Partial<Child>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedChild = await FamilyService.updateChild(familyId, childId, updates);
      
      // Update current family if it matches
      const { currentFamily } = get();
      if (currentFamily && currentFamily.id === familyId) {
        const updatedFamily = {
          ...currentFamily,
          children: currentFamily.children.map(c => 
            c.id === childId ? updatedChild : c
          ),
          updatedAt: new Date().toISOString()
        };
        set({ currentFamily: updatedFamily });
      }

      // Update families list
      const { families } = get();
      const updatedFamilies = families.map(f => 
        f.id === familyId 
          ? { 
              ...f, 
              children: f.children.map(c => c.id === childId ? updatedChild : c),
              updatedAt: new Date().toISOString()
            }
          : f
      );
      set({ families: updatedFamilies, isLoading: false });
      
      return updatedChild;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update child',
        isLoading: false 
      });
      throw error;
    }
  },

  // Remove child
  removeChild: async (familyId: string, childId: string) => {
    set({ isLoading: true, error: null });
    try {
      await FamilyService.removeChild(familyId, childId);
      
      // Update current family if it matches
      const { currentFamily } = get();
      if (currentFamily && currentFamily.id === familyId) {
        const updatedFamily = {
          ...currentFamily,
          children: currentFamily.children.filter(c => c.id !== childId),
          updatedAt: new Date().toISOString()
        };
        set({ currentFamily: updatedFamily });
      }

      // Update families list
      const { families } = get();
      const updatedFamilies = families.map(f => 
        f.id === familyId 
          ? { 
              ...f, 
              children: f.children.filter(c => c.id !== childId),
              updatedAt: new Date().toISOString()
            }
          : f
      );
      set({ families: updatedFamilies, isLoading: false });
      
      // Clear selected child if it was removed
      const { selectedChildId } = get();
      if (selectedChildId === childId) {
        set({ selectedChildId: null });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove child',
        isLoading: false 
      });
      throw error;
    }
  },

  // Add parent
  addParent: async (familyId: string, parentData: Omit<Parent, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const newParent = await FamilyService.addParent(familyId, parentData);
      
      // Update current family if it matches
      const { currentFamily } = get();
      if (currentFamily && currentFamily.id === familyId) {
        const updatedFamily = {
          ...currentFamily,
          parents: [...currentFamily.parents, newParent],
          updatedAt: new Date().toISOString()
        };
        set({ currentFamily: updatedFamily });
      }

      // Update families list
      const { families } = get();
      const updatedFamilies = families.map(f => 
        f.id === familyId 
          ? { ...f, parents: [...f.parents, newParent], updatedAt: new Date().toISOString() }
          : f
      );
      set({ families: updatedFamilies, isLoading: false });
      
      return newParent;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add parent',
        isLoading: false 
      });
      throw error;
    }
  },

  // Update family settings
  updateFamilySettings: async (familyId: string, settings: Partial<FamilySettings>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSettings = await FamilyService.updateFamilySettings(familyId, settings);
      
      // Update current family if it matches
      const { currentFamily } = get();
      if (currentFamily && currentFamily.id === familyId) {
        const updatedFamily = {
          ...currentFamily,
          settings: updatedSettings,
          updatedAt: new Date().toISOString()
        };
        set({ currentFamily: updatedFamily });
      }

      // Update families list
      const { families } = get();
      const updatedFamilies = families.map(f => 
        f.id === familyId 
          ? { ...f, settings: updatedSettings, updatedAt: new Date().toISOString() }
          : f
      );
      set({ families: updatedFamilies, isLoading: false });
      
      return updatedSettings;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isLoading: false 
      });
      throw error;
    }
  },

  // Load child stats
  loadChildStats: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await FamilyService.getChildStats(childId);
      set(state => ({
        childStats: { ...state.childStats, [childId]: stats },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load child stats',
        isLoading: false 
      });
    }
  },

  // Refresh all child stats
  refreshAllChildStats: async () => {
    const { currentFamily } = get();
    if (!currentFamily) return;

    set({ isLoading: true, error: null });
    try {
      const statsPromises = currentFamily.children.map(child => 
        FamilyService.getChildStats(child.id)
      );
      const statsArray = await Promise.all(statsPromises);
      
      const statsRecord = statsArray.reduce((acc, stats) => {
        acc[stats.childId] = stats;
        return acc;
      }, {} as Record<string, ChildStats>);
      
      set({ childStats: statsRecord, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh child stats',
        isLoading: false 
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Get current child
  getCurrentChild: () => {
    const { currentFamily, selectedChildId } = get();
    if (!currentFamily || !selectedChildId) return null;
    return currentFamily.children.find(child => child.id === selectedChildId) || null;
  },

  // Get children by age range
  getChildrenByAgeRange: async (minAge: number, maxAge: number) => {
    return await FamilyService.getChildrenByAgeRange(minAge, maxAge);
  },

  // Get children by interests
  getChildrenByInterests: async (interests: string[]) => {
    return await FamilyService.getChildrenByInterests(interests);
  }
}));
