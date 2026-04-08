import { create } from 'zustand';
import { 
  Family, 
  FamilyMember, 
  Child, 
  getCurrentFamily,
  getFamilyChildren,
  addChild,
  getFamilyMembers,
} from '../services/supabase/family';

interface FamilyState {
  // State
  families: Family[];
  currentFamily: Family | null;
  familyMembers: FamilyMember[];
  children: Child[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadFamilies: (userId: string) => Promise<void>;
  setCurrentFamily: (family: Family | null) => void;
  loadFamilyMembers: (familyId: string) => Promise<void>;
  loadChildren: (familyId: string) => Promise<void>;
  addChildToFamily: (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  familyMembers: [],
  children: [],
  isLoading: false,
  error: null,

  loadFamilies: async (userId: string) => {
    console.log('Loading families for user:', userId);
    set({ isLoading: true, error: null });
    
    try {
      const currentFamily = await getCurrentFamily();
      console.log('Loaded current family:', currentFamily?.id || 'null');
      
      if (currentFamily) {
        set({ currentFamily, families: [currentFamily], isLoading: false });
        
        // Load family members and children for the current family
        try {
          await get().loadFamilyMembers(currentFamily.id).catch(error => {
            console.error('Error loading family members:', error);
          });
        } catch (error) {
          console.error('Error calling loadFamilyMembers:', error);
        }
        
        try {
          await get().loadChildren(currentFamily.id).catch(error => {
            console.error('Error loading children:', error);
          });
        } catch (error) {
          console.error('Error calling loadChildren:', error);
        }
      } else {
        set({
          currentFamily: null,
          families: [],
          children: [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading families:', error);
      set({ 
        error: 'Failed to load families', 
        isLoading: false 
      });
    }
  },

  setCurrentFamily: (family: Family | null) => {
    console.log('Setting current family:', family?.id || 'null');
    set({ currentFamily: family });
    
    // Load family members and children for the new current family
    if (family) {
      try {
        get().loadFamilyMembers(family.id).catch(error => {
          console.error('Error loading family members after setCurrentFamily:', error);
        });
      } catch (error) {
        console.error('Error calling loadFamilyMembers in setCurrentFamily:', error);
      }
      
      try {
        get().loadChildren(family.id).catch(error => {
          console.error('Error loading children after setCurrentFamily:', error);
        });
      } catch (error) {
        console.error('Error calling loadChildren in setCurrentFamily:', error);
      }
    } else {
      set({ familyMembers: [], children: [] });
    }
  },

  loadFamilyMembers: async (familyId: string) => {
    console.log('Loading family members for family:', familyId);
    set({ isLoading: true, error: null });
    
    try {
      const familyMembers = await getFamilyMembers(familyId);
      console.log('Loaded family members:', familyMembers.length);
      set({ familyMembers, isLoading: false });
    } catch (error) {
      console.error('Error loading family members:', error);
      set({ 
        error: 'Failed to load family members', 
        isLoading: false 
      });
    }
  },

  loadChildren: async (familyId: string) => {
    console.log('Loading children for family:', familyId);
    set({ isLoading: true, error: null });
    
    try {
      const children = await getFamilyChildren(familyId);
      console.log('Loaded children:', children.length);
      set({ children, isLoading: false });
    } catch (error) {
      console.error('Error loading children:', error);
      set({ 
        error: 'Failed to load children', 
        isLoading: false 
      });
    }
  },

  addChildToFamily: async (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Family store: Adding child:', child);
      const childData = {
        family_id: child.family_id,
        name: child.name,
        birth_date: child.birth_date,
        avatar_data: child.avatar_data || undefined,
      };
      const newChild = await addChild(childData);
      console.log('Family store: Child added successfully:', newChild);
      
      if (newChild) {
        set(state => ({
          children: [...state.children, newChild],
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Family store: Error adding child:', error);
      set({ 
        error: 'Failed to add child', 
        isLoading: false 
      });
      // Re-throw the error so the calling function can handle it
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    console.log('Resetting family store');
    set({
      families: [],
      currentFamily: null,
      familyMembers: [],
      children: [],
      isLoading: false,
      error: null,
    });
  },
})); 