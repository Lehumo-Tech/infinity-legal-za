'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AttorneyOfficePage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingTasks: 0,
    courtDatesThisWeek: 0
  })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Mock data - will connect to Supabase
    setStats({
      totalCases: 24,
      activeCases: 12,
      pendingTasks: 8,
      courtDatesThisWeek: 3
    })

    setRecentActivity([
      { type: 'case', message: 'New case assigned: INF-2025-1234', time: '10 mins ago' },
      { type: 'document', message: 'Document uploaded to case INF-2025-1230', time: '1 hour ago' },
      { type: 'task', message: 'Task completed: Review contract', time: '2 hours ago' },
      { type: 'booking', message: 'New consultation booked for tomorrow', time: '3 hours ago' },
      { type: 'message', message: 'New message from John Doe', time: '5 hours ago' }
    ])
  }

  const quickActions = [
    { label: 'New Case', icon: '📁', action: () => router.push('/attorney/office/cases/new') },
    { label: 'Upload Document', icon: '📄', action: () => router.push('/attorney/office/documents') },
    { label: 'Schedule Consultation', icon: '📅', action: () => router.push('/attorney/office/calendar') },
    { label: 'View Messages', icon: '💬', action: () => router.push('/attorney/office/messages') }
  ]

  return (
    <div className="min-h-screen bg-infinity-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
                <span className="font-bold text-xl text-infinity-navy">Attorney Office</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link href="/attorney/office" className="text-infinity-navy font-medium border-b-2 border-infinity-gold pb-1">
                  Dashboard
                </Link>
                <Link href="/attorney/office/cases" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Cases
                </Link>
                <Link href="/attorney/office/documents" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Documents
                </Link>
                <Link href="/attorney/office/tasks" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Tasks
                </Link>
                <Link href="/attorney/office/calendar" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Calendar
                </Link>
                <Link href="/attorney/office/messages" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Messages
                </Link>
                <Link href="/attorney/office/earnings" className="text-infinity-navy/70 hover:text-infinity-navy">
                  Earnings
                </Link>
              </div>
            </div>
            
            <Link href="/attorney/office/settings" className="text-infinity-navy/70 hover:text-infinity-navy">
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Welcome back, Attorney!</h1>
          <p className="text-infinity-navy/70">Here's what's happening with your cases today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-infinity-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-infinity-navy/70 text-sm">Total Cases</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-infinity-navy">{stats.totalCases}</div>
            <div className="text-xs text-infinity-navy/70 mt-1">All time</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-infinity-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-infinity-navy/70 text-sm">Active Cases</span>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-3xl font-bold text-infinity-gold">{stats.activeCases}</div>
            <div className="text-xs text-infinity-navy/70 mt-1">Requiring attention</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-infinity-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-infinity-navy/70 text-sm">Pending Tasks</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-infinity-navy">{stats.pendingTasks}</div>
            <div className="text-xs text-infinity-navy/70 mt-1">Need completion</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-infinity-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-infinity-navy/70 text-sm">Court Dates</span>
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="text-3xl font-bold text-infinity-gold">{stats.courtDatesThisWeek}</div>
            <div className="text-xs text-infinity-navy/70 mt-1">This week</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-infinity-navy mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="bg-white rounded-lg p-6 border border-infinity-gold/20 hover:border-infinity-gold hover:shadow-md transition-all text-center"
              >
                <div className="text-4xl mb-2">{action.icon}</div>
                <div className="font-semibold text-infinity-navy">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold text-infinity-navy mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-infinity-gold/20">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className={`p-4 flex items-center gap-4 ${i !== recentActivity.length - 1 ? 'border-b border-infinity-gold/10' : ''}`}
              >
                <div className="w-10 h-10 bg-infinity-gold/10 rounded-full flex items-center justify-center text-xl">
                  {activity.type === 'case' && '📁'}
                  {activity.type === 'document' && '📄'}
                  {activity.type === 'task' && '✅'}
                  {activity.type === 'booking' && '📅'}
                  {activity.type === 'message' && '💬'}
                </div>
                <div className="flex-1">
                  <div className="text-infinity-navy">{activity.message}</div>
                  <div className="text-xs text-infinity-navy/70">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
