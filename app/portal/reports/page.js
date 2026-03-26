'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const { profile, isDirector } = useAuth()
  const [token, setToken] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const t = data?.session?.access_token || null
      setToken(t)
      if (t) fetchStats(t)
    }
    init()
  }, [])

  const fetchStats = async (t) => {
    try {
      const headers = { Authorization: `Bearer ${t}` }
      const [casesRes, tasksRes, leadsRes] = await Promise.allSettled([
        fetch('/api/cases', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/leads', { headers }),
      ])
      let cases = [], tasks = [], leads = []
      if (casesRes.status === 'fulfilled' && casesRes.value.ok) { const d = await casesRes.value.json(); cases = d.cases || [] }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) { const d = await tasksRes.value.json(); tasks = d.tasks || [] }
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) { const d = await leadsRes.value.json(); leads = d.leads || [] }

      const casesByType = {}
      cases.forEach(c => { casesByType[c.case_type] = (casesByType[c.case_type] || 0) + 1 })
      const casesByStatus = {}
      cases.forEach(c => { casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1 })

      setStats({
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'active').length,
        closedCases: cases.filter(c => c.status === 'closed' || c.status === 'resolved').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
        casesByType,
        casesByStatus,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const maxTypeCount = stats ? Math.max(...Object.values(stats.casesByType), 1) : 1

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Reports & Analytics</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40">Firm performance overview</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="w-6 h-6 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading reports...</div>
      ) : stats ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Cases', value: stats.totalCases, sub: `${stats.activeCases} active`, color: 'text-blue-600' },
              { label: 'Closed/Resolved', value: stats.closedCases, sub: `${stats.totalCases > 0 ? Math.round(stats.closedCases / stats.totalCases * 100) : 0}% resolution rate`, color: 'text-green-600' },
              { label: 'Task Completion', value: `${stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%`, sub: `${stats.completedTasks}/${stats.totalTasks} tasks`, color: 'text-amber-600' },
              { label: 'Lead Conversion', value: `${stats.totalLeads > 0 ? Math.round(stats.qualifiedLeads / stats.totalLeads * 100) : 0}%`, sub: `${stats.qualifiedLeads}/${stats.totalLeads} leads`, color: 'text-purple-600' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className={`text-2xl font-display font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs font-semibold text-infinity-navy dark:text-white mt-1">{kpi.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Cases by Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Cases by Type</h2>
              <div className="space-y-2">
                {Object.entries(stats.casesByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="capitalize text-infinity-navy dark:text-white font-medium">{type.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-infinity-navy dark:bg-infinity-gold rounded-full transition-all" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cases by Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Cases by Status</h2>
              <div className="space-y-2">
                {Object.entries(stats.casesByStatus).map(([status, count]) => {
                  const colors = { active: 'bg-green-500', pending: 'bg-orange-500', intake: 'bg-blue-500', closed: 'bg-gray-400', resolved: 'bg-emerald-500', under_review: 'bg-purple-500' }
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded ${colors[status] || 'bg-gray-400'}`} />
                      <span className="text-xs text-infinity-navy dark:text-white capitalize flex-1">{status.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold text-infinity-navy dark:text-white">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">No data available</div>
      )}
    </div>
  )
}
