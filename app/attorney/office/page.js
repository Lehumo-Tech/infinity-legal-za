'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardApi, casesApi, tasksApi } from '@/lib/api'

// Simple sparkline SVG component
function Sparkline({ data, color = '#10b981', width = 80, height = 32 }) {
  if (!data || data.length < 2) {
    // Generate random data for visual
    data = Array.from({ length: 7 }, () => Math.random() * 60 + 20)
  }
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// Mini bar chart SVG
function MiniBarChart({ data, colors = ['#0d9488', '#f97316'], width = 200, height = 120 }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value))
  const barWidth = Math.min(16, (width - 20) / data.length - 4)
  
  return (
    <svg width={width} height={height} className="mx-auto">
      {data.map((d, i) => {
        const barH = (d.value / (max || 1)) * (height - 20)
        const x = (i / data.length) * (width - 20) + 10
        const y = height - barH - 10
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={2}
              fill={colors[i % colors.length]}
              opacity={0.85}
            />
          </g>
        )
      })}
    </svg>
  )
}

// Area chart SVG
function AreaChart({ data1, data2, labels, width = 500, height = 200 }) {
  const allVals = [...(data1 || []), ...(data2 || [])]
  const max = Math.max(...allVals, 1)
  const padding = { top: 10, right: 10, bottom: 30, left: 10 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const toPath = (data) => {
    if (!data || data.length === 0) return ''
    return data.map((val, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW
      const y = padding.top + chartH - (val / max) * chartH
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }

  const toAreaPath = (data) => {
    if (!data || data.length === 0) return ''
    const linePath = toPath(data)
    const lastX = padding.left + chartW
    const baseline = padding.top + chartH
    return `${linePath} L${lastX},${baseline} L${padding.left},${baseline} Z`
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = padding.top + chartH * (1 - p)
        return (
          <line key={i} x1={padding.left} y1={y} x2={padding.left + chartW} y2={y}
            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4" />
        )
      })}
      
      {/* Area fills */}
      {data1 && <path d={toAreaPath(data1)} fill="url(#grad1)" opacity="0.4" />}
      {data2 && <path d={toAreaPath(data2)} fill="url(#grad2)" opacity="0.3" />}
      
      {/* Lines */}
      {data1 && <path d={toPath(data1)} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />}
      {data2 && <path d={toPath(data2)} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />}

      {/* Dots on data1 */}
      {data1 && data1.map((val, i) => {
        const x = padding.left + (i / (data1.length - 1)) * chartW
        const y = padding.top + chartH - (val / max) * chartH
        return <circle key={i} cx={x} cy={y} r="3" fill="#f97316" stroke="white" strokeWidth="1.5" />
      })}

      {/* Labels */}
      {labels && labels.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW
        return (
          <text key={i} x={x} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">
            {label}
          </text>
        )
      })}

      {/* Gradients */}
      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

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
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, casesRes, tasksRes] = await Promise.all([
        dashboardApi.getStats(),
        casesApi.list({ role: profile?.role || 'attorney' }),
        tasksApi.list()
      ])
      setStats(statsRes.stats || {})
      setRecentCases((casesRes.cases || []).slice(0, 6))
      setRecentTasks((tasksRes.tasks || []).slice(0, 5))
    } catch (error) {
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Reports' },
  ]

  const getStatusColor = (status) => {
    const colors = {
      intake: 'bg-blue-50 text-blue-600',
      matched: 'bg-purple-50 text-purple-600',
      active: 'bg-emerald-50 text-emerald-600',
      closed: 'bg-gray-100 text-gray-500',
      archived: 'bg-gray-50 text-gray-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-500'
  }

  const getPriorityDot = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return colors[priority] || 'bg-gray-400'
  }

  // Generate mock chart data based on real stats for visual representation
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const casesChartData = [3, 5, 4, 8, 6, stats.totalCases || 2]
  const tasksChartData = [2, 3, 5, 4, 7, stats.pendingTasks || 1]

  const statusBarData = [
    { label: 'Intake', value: recentCases.filter(c => c.status === 'intake').length || 1 },
    { label: 'Active', value: recentCases.filter(c => c.status === 'active').length || 0 },
    { label: 'Matched', value: recentCases.filter(c => c.status === 'matched').length || 0 },
    { label: 'Closed', value: recentCases.filter(c => c.status === 'closed').length || 0 },
  ]

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
      change: '+12.5%',
      positive: true,
      sparkColor: '#10b981',
      sparkData: [2, 4, 3, 6, 5, 7, stats.totalCases || 3]
    },
    {
      title: 'Active Cases',
      value: stats.activeCases,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      change: '+8.2%',
      positive: true,
      sparkColor: '#0d9488',
      sparkData: [1, 2, 3, 2, 4, 3, stats.activeCases || 1]
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      change: '-3.1%',
      positive: false,
      sparkColor: '#f97316',
      sparkData: [5, 4, 6, 3, 5, 4, stats.pendingTasks || 2]
    }
  ]

  return (
    <AttorneyLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {profile?.full_name || 'Attorney'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Case
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Pick a date
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{card.icon}</span>
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
              </div>
              <button className="text-gray-300 hover:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : card.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Since last week</div>
              </div>
              <Sparkline data={card.sparkData} color={card.sparkColor} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Details</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                card.positive ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {card.change}
                <svg className={`w-3 h-3 ${card.positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </span>
            </div>
          </div>
        ))}

        {/* Total Revenue / Court Dates Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Court Dates</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.courtDatesThisWeek}
          </div>
          <div className="text-xs text-emerald-600 mb-3">This week</div>
          <Sparkline 
            data={[1, 0, 2, 1, 3, 0, stats.courtDatesThisWeek || 0]} 
            color="#6366f1" 
            width={180} 
            height={40} 
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Case Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Case Activity - Monthly</h3>
              <p className="text-xs text-gray-400">Showing case and task trends for the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                <span className="text-gray-500">Cases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-600"></div>
                <span className="text-gray-500">Tasks</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <AreaChart 
              data1={casesChartData} 
              data2={tasksChartData} 
              labels={monthLabels}
              width={600}
              height={220}
            />
          </div>
        </div>

        {/* Case Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Case Status</h3>
          <div className="text-3xl font-bold text-gray-900">
            +{stats.totalCases || 0}
          </div>
          <div className="text-xs text-emerald-600 mb-4">Total cases managed</div>
          <MiniBarChart 
            data={[
              { value: 4 }, { value: 7 }, { value: 3 }, { value: 5 },
              { value: 6 }, { value: 8 }, { value: 4 }, { value: 7 },
              { value: 5 }, { value: 9 }, { value: 3 }, { value: 6 }
            ]}
            colors={['#0d9488', '#f97316']}
            width={200}
            height={130}
          />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusBarData.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-gray-400'][i]
                }`}></div>
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold text-gray-700 ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Cases Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Recent Cases</h3>
                <p className="text-xs text-gray-400">Manage your active cases</p>
              </div>
              <button
                onClick={() => router.push('/attorney/office/cases')}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600 mx-auto"></div>
            </div>
          ) : recentCases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm mb-3">No cases yet</p>
              <button
                onClick={() => router.push('/attorney/office/cases')}
                className="text-sm text-gray-900 font-medium hover:underline"
              >
                Create your first case →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Case</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-400">Court Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => router.push('/attorney/office/cases')}>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-sm text-gray-900">{c.title || c.case_subtype || 'Untitled'}</div>
                        <div className="text-xs text-gray-400">{c.case_number}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 capitalize">{c.case_type}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-500">
                        {c.court_date ? new Date(c.court_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Active Tasks</h3>
                <p className="text-xs text-gray-400">Your pending work items</p>
              </div>
              <button
                onClick={() => router.push('/attorney/office/tasks')}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                View All →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600 mx-auto"></div>
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm mb-3">No tasks yet</p>
              <button
                onClick={() => router.push('/attorney/office/tasks')}
                className="text-sm text-gray-900 font-medium hover:underline"
              >
                Create a task →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTasks.map((t) => (
                <div key={t.id} className="px-5 py-3.5 hover:bg-gray-50/50 cursor-pointer flex items-start gap-3"
                  onClick={() => router.push('/attorney/office/tasks')}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityDot(t.priority)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{t.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString()}` : 'No due date'}
                      {t.cases?.case_number ? ` · ${t.cases.case_number}` : ''}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    t.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    t.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {t.status?.replace('_', ' ')}
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
