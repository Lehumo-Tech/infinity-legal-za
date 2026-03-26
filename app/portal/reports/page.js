'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const { profile, isDirector } = useAuth()
  const [token, setToken] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState('overview')

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
      const [casesRes, tasksRes, leadsRes, billingRes, leaveRes, calRes, knowledgeRes] = await Promise.allSettled([
        fetch('/api/cases', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/leads', { headers }),
        fetch('/api/billing', { headers }),
        fetch('/api/hr/leave', { headers }),
        fetch('/api/calendar', { headers }),
        fetch('/api/knowledge', { headers }),
      ])

      let cases = [], tasks = [], leads = [], invoices = [], billingSummary = {}, leaves = [], events = [], articles = []

      if (casesRes.status === 'fulfilled' && casesRes.value.ok) { const d = await casesRes.value.json(); cases = d.cases || [] }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) { const d = await tasksRes.value.json(); tasks = d.tasks || [] }
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) { const d = await leadsRes.value.json(); leads = d.leads || [] }
      if (billingRes.status === 'fulfilled' && billingRes.value.ok) { const d = await billingRes.value.json(); invoices = d.invoices || []; billingSummary = d.summary || {} }
      if (leaveRes.status === 'fulfilled' && leaveRes.value.ok) { const d = await leaveRes.value.json(); leaves = d.leaves || [] }
      if (calRes.status === 'fulfilled' && calRes.value.ok) { const d = await calRes.value.json(); events = d.events || [] }
      if (knowledgeRes.status === 'fulfilled' && knowledgeRes.value.ok) { const d = await knowledgeRes.value.json(); articles = d.articles || [] }

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
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
        overdueTasks: tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length,
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
        casesByType, casesByStatus,
        // Billing
        totalInvoiced: billingSummary.totalInvoiced || 0,
        totalPaid: billingSummary.totalPaid || 0,
        totalOutstanding: billingSummary.totalOutstanding || 0,
        invoiceCount: invoices.length,
        draftInvoices: invoices.filter(i => i.status === 'draft').length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        // Leave
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'approved').length,
        totalLeaveRequests: leaves.length,
        // Calendar
        upcomingEvents: events.filter(e => new Date(e.date || e.startDate) >= new Date()).length,
        courtDates: events.filter(e => e.type === 'court_date').length,
        // Knowledge
        totalArticles: articles.length,
        precedents: articles.filter(a => a.type === 'precedent').length,
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const maxTypeCount = stats ? Math.max(...Object.values(stats.casesByType || {}), 1) : 1
  const statusColors = { active: 'bg-green-500', pending: 'bg-orange-500', intake: 'bg-blue-500', closed: 'bg-gray-400', resolved: 'bg-emerald-500', under_review: 'bg-purple-500' }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Firm-wide performance and operational metrics</p>
        </div>
        <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
          {['overview', 'cases', 'finance', 'operations'].map(r => (
            <button key={r} onClick={() => setActiveReport(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeReport === r ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="w-6 h-6 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading reports...</div>
      ) : stats ? (
        <>
          {/* OVERVIEW */}
          {activeReport === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'Active Cases', value: stats.activeCases, icon: '⚖️', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Tasks Due', value: stats.pendingTasks, icon: '📋', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Revenue', value: `R${(stats.totalPaid || 0).toLocaleString()}`, icon: '💰', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Outstanding', value: `R${(stats.totalOutstanding || 0).toLocaleString()}`, icon: '⏳', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Upcoming Events', value: stats.upcomingEvents, icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: 'Knowledge Articles', value: stats.totalArticles, icon: '📚', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-xl p-3 border border-current/5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{s.icon}</span>
                      <span className={`text-xl font-display font-bold ${s.color}`}>{s.value}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Operational Health */}
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Case Resolution</h3>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600">{stats.totalCases > 0 ? Math.round(stats.closedCases / stats.totalCases * 100) : 0}%</div>
                    <div className="text-xs text-gray-400 mt-1">{stats.closedCases} resolved of {stats.totalCases} total</div>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalCases > 0 ? (stats.closedCases / stats.totalCases) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Task Completion</h3>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-amber-600">{stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%</div>
                    <div className="text-xs text-gray-400 mt-1">{stats.completedTasks} done • {stats.overdueTasks} overdue</div>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Collection Rate</h3>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-blue-600">{stats.totalInvoiced > 0 ? Math.round(stats.totalPaid / stats.totalInvoiced * 100) : 0}%</div>
                    <div className="text-xs text-gray-400 mt-1">R{(stats.totalPaid || 0).toLocaleString()} of R{(stats.totalInvoiced || 0).toLocaleString()}</div>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.totalInvoiced > 0 ? (stats.totalPaid / stats.totalInvoiced) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CASES REPORT */}
          {activeReport === 'cases' && (
            <div className="grid lg:grid-cols-2 gap-6">
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
                        <div className="h-full bg-infinity-navy dark:bg-infinity-gold rounded-full" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.casesByType).length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No case data</div>}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Cases by Status</h2>
                <div className="space-y-3">
                  {Object.entries(stats.casesByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded ${statusColors[status] || 'bg-gray-400'}`} />
                      <span className="text-xs text-infinity-navy dark:text-white capitalize flex-1">{status.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold text-infinity-navy dark:text-white">{count}</span>
                      <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${statusColors[status] || 'bg-gray-400'}`} style={{ width: `${stats.totalCases > 0 ? (count / stats.totalCases) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.casesByStatus).length === 0 && <div className="text-xs text-gray-400 py-4 text-center">No case data</div>}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Lead Conversion</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalLeads}</div>
                    <div className="text-[10px] text-gray-400">Total Leads</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.qualifiedLeads}</div>
                    <div className="text-[10px] text-gray-400">Qualified</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-gray-400">Conversion Rate</span>
                  <span className="font-bold text-purple-600">{stats.totalLeads > 0 ? Math.round(stats.qualifiedLeads / stats.totalLeads * 100) : 0}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Upcoming Court Dates</h2>
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-purple-600">{stats.courtDates}</div>
                  <div className="text-xs text-gray-400 mt-1">Scheduled court appearances</div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCE REPORT */}
          {activeReport === 'finance' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Revenue Summary</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Total Invoiced', value: `R${(stats.totalInvoiced || 0).toLocaleString()}`, color: 'bg-blue-50 dark:bg-blue-900/10', textColor: 'text-blue-700 dark:text-blue-400' },
                    { label: 'Revenue Collected', value: `R${(stats.totalPaid || 0).toLocaleString()}`, color: 'bg-green-50 dark:bg-green-900/10', textColor: 'text-green-700 dark:text-green-400' },
                    { label: 'Outstanding', value: `R${(stats.totalOutstanding || 0).toLocaleString()}`, color: 'bg-amber-50 dark:bg-amber-900/10', textColor: 'text-amber-700 dark:text-amber-400' },
                  ].map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 ${r.color} rounded-lg`}>
                      <span className={`text-sm font-medium ${r.textColor}`}>{r.label}</span>
                      <span className={`text-lg font-bold ${r.textColor}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Invoice Status</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Invoices', value: stats.invoiceCount, icon: '📄' },
                    { label: 'Draft', value: stats.draftInvoices, icon: '✏️' },
                    { label: 'Paid', value: stats.paidInvoices, icon: '✅' },
                    { label: 'Avg per Invoice', value: stats.invoiceCount > 0 ? `R${Math.round(stats.totalInvoiced / stats.invoiceCount).toLocaleString()}` : 'R0', icon: '📊' },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-lg mb-0.5">{s.icon}</div>
                      <div className="text-xl font-bold text-infinity-navy dark:text-white">{s.value}</div>
                      <div className="text-[10px] text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OPERATIONS REPORT */}
          {activeReport === 'operations' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Leave Management</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Pending Requests</span>
                    <span className="text-lg font-bold text-amber-600">{stats.pendingLeaves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Approved</span>
                    <span className="text-lg font-bold text-green-600">{stats.approvedLeaves}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total Requests</span>
                    <span className="text-lg font-bold text-infinity-navy dark:text-white">{stats.totalLeaveRequests}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Task Health</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total Tasks</span>
                    <span className="text-lg font-bold text-infinity-navy dark:text-white">{stats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Completed</span>
                    <span className="text-lg font-bold text-green-600">{stats.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Overdue</span>
                    <span className={`text-lg font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.overdueTasks}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Knowledge Base</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total Articles</span>
                    <span className="text-lg font-bold text-infinity-navy dark:text-white">{stats.totalArticles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Precedents</span>
                    <span className="text-lg font-bold text-purple-600">{stats.precedents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Events This Month</span>
                    <span className="text-lg font-bold text-blue-600">{stats.upcomingEvents}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">No data available</div>
      )}
    </div>
  )
}
