export interface Chore {
  id: string
  title: string
  description: string
  assignedTo: string[]
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  points: number
  category: string
  createdAt: string
  updatedAt: string
}

export interface ChoreCategory {
  id: string
  name: string
  color: string
  icon: string
}

export interface ChoreStats {
  total: number
  completed: number
  pending: number
  overdue: number
  completionRate: number
}

export interface CreateChoreData {
  title: string
  description: string
  assignedTo: string[]
  dueDate: string
  points: number
  category: string
}

export interface UpdateChoreData {
  title?: string
  description?: string
  assignedTo?: string[]
  dueDate?: string
  points?: number
  category?: string
  status?: 'pending' | 'completed' | 'overdue'
}
