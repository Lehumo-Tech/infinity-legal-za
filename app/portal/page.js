'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ============ OFFICER DASHBOARD ============
function OfficerDashboard({ profile, token }) {
  const [stats, setStats] = useState({ pendingApprovals: 0, activeCases: 0, upcomingCourt: 0, pendingLeads: 0 })
  const [recentCases, setRecentCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        // Fetch cases
        const casesRes = await fetch('/api/cases', { headers })
        const casesData = await casesRes.json()
        const cases = casesData.cases || []
        const activeCases = cases.filter(c => c.status === 'active' || c.status === 'matched').length
        const upcomingCourt = cases.filter(c => c.court_date && new Date(c.court_date) > new Date()).length

        setStats({
          pendingApprovals: cases.filter(c => c.status === 'pending').length,
          activeCases,
          upcomingCourt,
          pendingLeads: 0,
        })
        setRecentCases(cases.slice(0, 5))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Legal Officer Dashboard</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Welcome back, {profile?.full_name}. Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Approvals', value: stats.pendingApprovals, icon: '✅', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
          { label: 'Active Cases', value: stats.activeCases, icon: '📁', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'Court Dates', value: stats.upcomingCourt, icon: '🏛️', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
          { label: 'Pending Leads', value: stats.pendingLeads, icon: '📞', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-5 ${stat.color} border border-current/10`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-3xl font-display font-bold">{loading ? '-' : stat.value}</span>
            </div>
            <div className="mt-2 text-sm font-semibold opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6">
        <h2 className="font-display font-semibold text-infinity-navy dark:text-white mb-4">Recent Cases</h2>
        {loading ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">Loading...</div>
        ) : recentCases.length === 0 ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">No cases yet</div>
        ) : (
          <div className="space-y-3">
            {recentCases.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-infinity-cream/50 dark:bg-gray-700/50">
                <div>
                  <div className="font-semibold text-sm text-infinity-navy dark:text-white">{c.case_number || 'Case'}</div>
                  <div className="text-xs text-infinity-navy/50 dark:text-white/50">{c.case_type} • {c.case_subtype || 'General'}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  c.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <a href="/portal/approvals" className="bg-infinity-navy text-white rounded-xl p-4 text-center hover:bg-infinity-navy-light transition-colors">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-sm font-semibold">Review Approvals</div>
        </a>
        <a href="/portal/cases" className="bg-infinity-gold text-infinity-navy rounded-xl p-4 text-center hover:bg-infinity-gold-light transition-colors">
          <div className="text-2xl mb-1">📁</div>
          <div className="text-sm font-semibold">View All Cases</div>
        </a>
        <a href="/portal/leads" className="bg-white dark:bg-gray-800 border border-infinity-navy/10 dark:border-gray-700 text-infinity-navy dark:text-white rounded-xl p-4 text-center hover:border-infinity-gold/40 transition-colors">
          <div className="text-2xl mb-1">📞</div>
          <div className="text-sm font-semibold">Pipeline</div>
        </a>
      </div>
    </div>
  )
}

// ============ PARALEGAL DASHBOARD ============
function ParalegalDashboard({ profile, token }) {
  const [stats, setStats] = useState({ draftingTasks: 0, assignedCases: 0, pendingLeads: 0, documentsToFile: 0 })
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const tasksRes = await fetch('/api/tasks', { headers })
        const tasksData = await tasksRes.json()
        const allTasks = tasksData.tasks || []
        const pending = allTasks.filter(t => t.status === 'pending').length
        const inProgress = allTasks.filter(t => t.status === 'in_progress').length

        setStats({
          draftingTasks: pending + inProgress,
          assignedCases: 0,
          pendingLeads: 0,
          documentsToFile: 0,
        })
        setTasks(allTasks.slice(0, 8))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Paralegal Workbench</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Welcome, {profile?.full_name}. Focus on your tasks below.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Drafting Tasks', value: stats.draftingTasks, icon: '📝', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
          { label: 'Assigned Cases', value: stats.assignedCases, icon: '📁', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'Pending Leads', value: stats.pendingLeads, icon: '📞', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
          { label: 'Docs to File', value: stats.documentsToFile, icon: '📄', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-5 ${stat.color} border border-current/10`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-3xl font-display font-bold">{loading ? '-' : stat.value}</span>
            </div>
            <div className="mt-2 text-sm font-semibold opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Task List — Dense & Productive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6">
        <h2 className="font-display font-semibold text-infinity-navy dark:text-white mb-4">My Tasks</h2>
        {loading ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">No tasks assigned yet</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-infinity-cream/50 dark:bg-gray-700/50 hover:bg-infinity-cream dark:hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={t.status === 'completed'} readOnly className="w-4 h-4 rounded border-infinity-navy/30 text-infinity-gold focus:ring-infinity-gold" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-infinity-navy/30 dark:text-white/30' : 'text-infinity-navy dark:text-white'}`}>{t.title}</div>
                  {t.due_date && <div className="text-xs text-infinity-navy/40 dark:text-white/40">Due: {new Date(t.due_date).toLocaleDateString('en-ZA')}</div>}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  t.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  t.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <a href="/portal/tasks" className="bg-teal-600 text-white rounded-xl p-4 text-center hover:bg-teal-700 transition-colors">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-sm font-semibold">All Tasks</div>
        </a>
        <a href="/portal/documents" className="bg-infinity-navy text-white rounded-xl p-4 text-center hover:bg-infinity-navy-light transition-colors">
          <div className="text-2xl mb-1">📄</div>
          <div className="text-sm font-semibold">Document Filing</div>
        </a>
        <a href="/portal/leads" className="bg-white dark:bg-gray-800 border border-infinity-navy/10 dark:border-gray-700 text-infinity-navy dark:text-white rounded-xl p-4 text-center hover:border-infinity-gold/40 transition-colors">
          <div className="text-2xl mb-1">📞</div>
          <div className="text-sm font-semibold">Lead Prep</div>
        </a>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
        <p className="text-xs text-orange-700 dark:text-orange-400">
          <strong>Reminder:</strong> All documents you draft are under supervision of your assigned Legal Officer. 
          You cannot sign legal filings or transmit final legal advice to clients. 
          Documents require Officer approval before client delivery.
        </p>
      </div>
    </div>
  )
}

// ============ INTAKE AGENT DASHBOARD ============
function IntakeDashboard({ profile, token }) {
  const [stats, setStats] = useState({ newLeads: 0, contacted: 0, qualified: 0, followUps: 0 })
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const leadsRes = await fetch('/api/leads', { headers })
        const leadsData = await leadsRes.json()
        const allLeads = leadsData.leads || []

        setStats({
          newLeads: allLeads.filter(l => l.status === 'new').length,
          contacted: allLeads.filter(l => l.status === 'contacted').length,
          qualified: allLeads.filter(l => l.status === 'qualified').length,
          followUps: allLeads.filter(l => l.status === 'contacted').length,
        })
        setLeads(allLeads.slice(0, 10))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Call Center Dashboard</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Welcome, {profile?.full_name}. Qualify leads and schedule follow-ups.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'New Leads', value: stats.newLeads, icon: '🆕', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
          { label: 'Contacted', value: stats.contacted, icon: '📞', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'Qualified', value: stats.qualified, icon: '✅', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
          { label: 'Follow-ups', value: stats.followUps, icon: '🔄', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-5 ${stat.color} border border-current/10`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-3xl font-display font-bold">{loading ? '-' : stat.value}</span>
            </div>
            <div className="mt-2 text-sm font-semibold opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Lead Queue — Minimal, Speed-focused */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-infinity-navy dark:text-white">Lead Queue</h2>
          <a href="/portal/leads" className="text-sm text-infinity-gold font-semibold hover:underline">View All →</a>
        </div>
        {loading ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-infinity-navy/40 dark:text-white/40">No leads in queue</div>
        ) : (
          <div className="space-y-2">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-infinity-cream/50 dark:bg-gray-700/50 hover:bg-infinity-cream dark:hover:bg-gray-700 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  l.urgency === 'emergency' ? 'bg-red-500' :
                  l.urgency === 'high' ? 'bg-orange-500' :
                  l.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-infinity-navy dark:text-white truncate">{l.full_name}</div>
                  <div className="text-xs text-infinity-navy/40 dark:text-white/40">{l.phone || l.email || 'No contact'} • {l.case_type || 'Unclassified'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  l.status === 'new' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  l.status === 'contacted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  l.status === 'qualified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <a href="/portal/leads?new=true" className="bg-red-600 text-white rounded-xl p-4 text-center hover:bg-red-700 transition-colors">
          <div className="text-2xl mb-1">➕</div>
          <div className="text-sm font-semibold">New Lead Entry</div>
        </a>
        <a href="/portal/leads" className="bg-infinity-gold text-infinity-navy rounded-xl p-4 text-center hover:bg-infinity-gold-light transition-colors">
          <div className="text-2xl mb-1">📞</div>
          <div className="text-sm font-semibold">Call Queue</div>
        </a>
      </div>

      {/* Restriction Notice */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> As an Intake Specialist, you can qualify leads and schedule appointments. 
          You cannot access active case files or provide legal advice. Qualified leads are automatically routed to the Paralegal queue.
        </p>
      </div>
    </div>
  )
}

// ============ MAIN PORTAL PAGE ============
export default function PortalPage() {
  const { profile, role, isOfficer, isParalegal, isIntakeAgent, isManagingPartner } = useAuth()
  const [token, setToken] = useState(null)

  useEffect(() => {
    async function getToken() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    getToken()
  }, [])

  if (isManagingPartner || isOfficer) {
    return <OfficerDashboard profile={profile} token={token} />
  }
  if (isParalegal) {
    return <ParalegalDashboard profile={profile} token={token} />
  }
  if (isIntakeAgent) {
    return <IntakeDashboard profile={profile} token={token} />
  }

  // Default/Admin dashboard
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Infinity OS Portal</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Welcome, {profile?.full_name}. Role: {role}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 text-center">
        <p className="text-infinity-navy/60 dark:text-white/60">Your role-specific dashboard will be displayed here.</p>
      </div>
    </div>
  )
}
