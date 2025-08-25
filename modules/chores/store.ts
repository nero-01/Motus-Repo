import { create } from 'zustand'
import { Chore, ChoreStats, CreateChoreData, UpdateChoreData } from './types'
import { supabase } from '@/components/providers'

interface ChoresStore {
  chores: Chore[]
  stats: ChoreStats
  loading: boolean
  error: string | null
  
  // Actions
  fetchChores: () => Promise<void>
  createChore: (data: CreateChoreData) => Promise<void>
  updateChore: (id: string, data: UpdateChoreData) => Promise<void>
  deleteChore: (id: string) => Promise<void>
  completeChore: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useChoresStore = create<ChoresStore>((set, get) => ({
  chores: [],
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  },
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchChores: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const chores = data || []
      const stats = calculateStats(chores)

      set({ chores, stats, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createChore: async (data: CreateChoreData) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('chores')
        .insert([data])

      if (error) throw error

      // Refresh chores list
      await get().fetchChores()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateChore: async (id: string, data: UpdateChoreData) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('chores')
        .update(data)
        .eq('id', id)

      if (error) throw error

      // Refresh chores list
      await get().fetchChores()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  deleteChore: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh chores list
      await get().fetchChores()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  completeChore: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('chores')
        .update({ status: 'completed' })
        .eq('id', id)

      if (error) throw error

      // Refresh chores list
      await get().fetchChores()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))

// Helper function to calculate stats
function calculateStats(chores: Chore[]): ChoreStats {
  const total = chores.length
  const completed = chores.filter(chore => chore.status === 'completed').length
  const pending = chores.filter(chore => chore.status === 'pending').length
  const overdue = chores.filter(chore => chore.status === 'overdue').length
  const completionRate = total > 0 ? (completed / total) * 100 : 0

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate,
  }
}
