'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  CheckCircle, 
  Gift, 
  Calendar,
  Plus,
  TrendingUp
} from 'lucide-react'
import { DashboardData, DashboardStats } from '../types'

export function DashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalChildren: 0,
      totalChores: 0,
      completedChores: 0,
      totalRewards: 0,
      upcomingEvents: 0,
    },
    quickActions: [
      {
        id: '1',
        title: 'Add Chore',
        description: 'Create a new chore for your children',
        icon: 'Plus',
        href: '/chores/create',
        color: 'bg-blue-500',
      },
      {
        id: '2',
        title: 'Create Reward',
        description: 'Set up a new reward system',
        icon: 'Gift',
        href: '/rewards/create',
        color: 'bg-green-500',
      },
      {
        id: '3',
        title: 'Schedule Routine',
        description: 'Plan daily routines',
        icon: 'Calendar',
        href: '/routines/create',
        color: 'bg-purple-500',
      },
      {
        id: '4',
        title: 'View Analytics',
        description: 'Check progress and insights',
        icon: 'TrendingUp',
        href: '/analytics',
        color: 'bg-orange-500',
      },
    ],
    recentActivities: [],
  })

  useEffect(() => {
    // TODO: Fetch dashboard data from API
    // This would be replaced with actual API calls
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Children</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalChildren}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Chores</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedChores}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rewards</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalRewards}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.upcomingEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <Plus className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
        {dashboardData.recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
