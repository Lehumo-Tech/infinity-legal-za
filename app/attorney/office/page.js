'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardApi, casesApi, tasksApi } from '@/lib/api'

export default function AttorneyOfficePage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingTasks: 0,
    courtDatesThisWeek: 0
  })
  const [recentCases, setRecentCases] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch stats
      const statsRes = await dashboardApi.getStats()
      setStats(statsRes.stats || {})

      // Fetch recent cases
      const casesRes = await casesApi.list({ role: profile?.role || 'attorney' })
      setRecentCases((casesRes.cases || []).slice(0, 5))

      // Fetch recent tasks
      const tasksRes = await tasksApi.list()
      setRecentTasks((tasksRes.tasks || []).slice(0, 5))
    } catch (error) {
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'New Case', icon: '📁', href: '/attorney/office/cases' },
    { label: 'Upload Document', icon: '📄', href: '/attorney/office/documents' },
    { label: 'Add Task', icon: '✅', href: '/attorney/office/tasks' },
    { label: 'Calendar', icon: '📅', href: '/attorney/office/calendar' }
  ]

  const getStatusColor = (status) => {
    const colors = {
      intake: 'bg-blue-100 text-blue-700',
      matched: 'bg-purple-100 text-purple-700',
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <AttorneyLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-infinity-navy mb-2">
          Welcome back, {profile?.full_name || 'Attorney'}!
        </h1>
        <p className="text-infinity-navy/70">Here's what's happening with your cases today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 border border-infinity-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-infinity-navy/70 text-sm">Total Cases</span>
            <span className="text-xl">📊</span>
          </div>
          <div className="text-3xl font-bold text-infinity-navy">
            {loading ? '...' : stats.totalCases}
          </div>
          <div className="text-xs text-infinity-navy/50 mt-1">All time</div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-infinity-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-infinity-navy/70 text-sm">Active Cases</span>
            <span className="text-xl">⚡</span>
          </div>
          <div className="text-3xl font-bold text-infinity-gold">
            {loading ? '...' : stats.activeCases}
          </div>
          <div className="text-xs text-infinity-navy/50 mt-1">Requiring attention</div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-infinity-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-infinity-navy/70 text-sm">Pending Tasks</span>
            <span className="text-xl">✅</span>
          </div>
          <div className="text-3xl font-bold text-infinity-navy">
            {loading ? '...' : stats.pendingTasks}
          </div>
          <div className="text-xs text-infinity-navy/50 mt-1">Need completion</div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-infinity-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-infinity-navy/70 text-sm">Court Dates</span>
            <span className="text-xl">⚖️</span>
          </div>
          <div className="text-3xl font-bold text-infinity-gold">
            {loading ? '...' : stats.courtDatesThisWeek}
          </div>
          <div className="text-xs text-infinity-navy/50 mt-1">This week</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-infinity-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-lg p-5 border border-infinity-gold/20 hover:border-infinity-gold hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-2">{action.icon}</div>
              <div className="font-medium text-infinity-navy text-sm">{action.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-lg border border-infinity-gold/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-infinity-navy">Recent Cases</h2>
            <button
              onClick={() => router.push('/attorney/office/cases')}
              className="text-sm text-infinity-gold hover:text-infinity-navy"
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-infinity-navy/50">Loading...</div>
          ) : recentCases.length === 0 ? (
            <div className="text-center py-8 text-infinity-navy/50">No cases yet</div>
          ) : (
            <div className="space-y-3">
              {recentCases.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-infinity-gold/10 last:border-0 cursor-pointer hover:bg-infinity-cream/50 px-2 rounded"
                  onClick={() => router.push(`/attorney/office/cases`)}
                >
                  <div>
                    <div className="font-medium text-infinity-navy text-sm">{c.title}</div>
                    <div className="text-xs text-infinity-navy/50">{c.case_number}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg border border-infinity-gold/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-infinity-navy">Pending Tasks</h2>
            <button
              onClick={() => router.push('/attorney/office/tasks')}
              className="text-sm text-infinity-gold hover:text-infinity-navy"
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-infinity-navy/50">Loading...</div>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-8 text-infinity-navy/50">No tasks yet</div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-infinity-gold/10 last:border-0 px-2"
                >
                  <div>
                    <div className="font-medium text-infinity-navy text-sm">{t.title}</div>
                    <div className="text-xs text-infinity-navy/50">
                      {t.cases?.case_number || 'No case'} • Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AttorneyLayout>
  )
}
