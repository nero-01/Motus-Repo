export interface DashboardStats {
  totalChildren: number
  totalChores: number
  completedChores: number
  totalRewards: number
  upcomingEvents: number
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  color: string
}

export interface RecentActivity {
  id: string
  type: 'chore' | 'reward' | 'routine' | 'event'
  title: string
  description: string
  timestamp: string
  status: 'completed' | 'pending' | 'overdue'
}

export interface DashboardData {
  stats: DashboardStats
  quickActions: QuickAction[]
  recentActivities: RecentActivity[]
}
