'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PortalDashboard() {
  const { profile, role, roleLabel, department, isOfficer, isLegalStaff, isParalegal, isIntakeAgent, isDirector, isFinanceStaff } = useAuth()
  const [token, setToken] = useState(null)
  const [stats, setStats] = useState({ activeCases: 0, pendingTasks: 0, meetingsToday: 0, unreadMessages: 0 })
  const [recentCases, setRecentCases] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const t = data?.session?.access_token || null
      setToken(t)
      if (t) fetchDashboardData(t)
    }
    init()
  }, [])

  const fetchDashboardData = async (t) => {
    try {
      const headers = { Authorization: `Bearer ${t}` }
      const [casesRes, tasksRes, notifsRes] = await Promise.allSettled([
        fetch('/api/cases', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/notifications?limit=5', { headers }),
      ])

      let cases = [], tasks = [], notifs = []
      if (casesRes.status === 'fulfilled' && casesRes.value.ok) {
        const d = await casesRes.value.json()
        cases = d.cases || []
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
        const d = await tasksRes.value.json()
        tasks = d.tasks || []
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
        const d = await notifsRes.value.json()
        notifs = d.notifications || []
      }

      const activeCases = cases.filter(c => ['active', 'intake', 'under_review'].includes(c.status)).length
      const pendingTasks = tasks.filter(t => t.status !== 'completed').length
      const courtDates = cases.filter(c => {
        if (!c.court_date) return false
        const d = new Date(c.court_date)
        const today = new Date()
        return d.toDateString() === today.toDateString()
      }).length

      setStats({ activeCases, pendingTasks, meetingsToday: courtDates, unreadMessages: notifs.filter(n => !n.read).length })
      setRecentCases(cases.slice(0, 5))
      setNotifications(notifs.slice(0, 5))
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-7xl mx-auto">
      {/* CIPC Pending Banner */}
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Premium features pending CIPC approval</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500">Infinity Legal (Pty) Ltd — CIPC registration in progress. Free tier features are fully available. Premium plans launching soon.</p>
        </div>
        <Link href="/pricing" className="shrink-0 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline">View Plans →</Link>
      </div>

      {/* Welcome Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">
              {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-infinity-navy/50 dark:text-white/40 mt-0.5">{dateStr}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-infinity-gold/10 text-infinity-gold">{roleLabel}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Free Tier Active
              </span>
              <span className="text-[10px] text-infinity-navy/30 dark:text-white/30">{department} Department</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/intake" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-infinity-gold hover:bg-infinity-gold-light text-infinity-navy rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Free AI Analysis
            </Link>
            <Link href="/portal/cases" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Matter
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Cases', value: stats.activeCases, icon: '📁', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', href: '/portal/cases' },
          { label: 'Pending Tasks', value: stats.pendingTasks, icon: '📝', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', href: '/portal/tasks' },
          { label: 'Court Dates Today', value: stats.meetingsToday, icon: '🏛️', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', href: '/portal/calendar' },
          { label: 'Notifications', value: stats.unreadMessages, icon: '🔔', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', href: '#' },
        ].map((stat, i) => (
          <Link key={i} href={stat.href} className={`${stat.bg} rounded-xl p-4 border border-current/5 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className={`text-2xl font-display font-bold ${stat.text}`}>{loading ? '—' : stat.value}</span>
            </div>
            <div className={`text-xs font-semibold ${stat.text} opacity-70`}>{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white">Recent Cases</h2>
              <Link href="/portal/cases" className="text-xs text-infinity-gold font-semibold hover:underline">View All →</Link>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            ) : recentCases.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm text-gray-400">No cases yet.</p>
                <Link href="/portal/cases" className="mt-2 inline-block text-xs text-infinity-gold font-semibold hover:underline">Create your first case →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recentCases.map(c => (
                  <Link key={c.id} href="/portal/cases" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'active' ? 'bg-green-500' : c.status === 'intake' ? 'bg-blue-500' : c.status === 'pending' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-infinity-navy dark:text-white truncate">
                        {c.case_number || 'Case'} {c.title && c.title !== 'Untitled Case' ? `— ${c.title}` : ''}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{c.case_type} • {c.case_subtype || 'General'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      c.status === 'intake' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      c.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}>{c.status}</span>
                    {c.urgency === 'emergency' && <span className="text-red-500 text-xs">⚠</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'AI Analysis', icon: '🤖', href: '/intake', bg: 'bg-infinity-gold text-infinity-navy hover:bg-infinity-gold-light' },
              { label: 'Documents', icon: '📄', href: '/portal/documents', bg: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-infinity-navy dark:text-white hover:border-infinity-gold' },
              ...(isOfficer ? [{ label: 'Approvals', icon: '✅', href: '/portal/approvals', bg: 'bg-infinity-navy text-white hover:bg-infinity-navy-light' }] : []),
              ...(isLegalStaff ? [{ label: 'AI Research', icon: '🔬', href: '/portal/intelligence', bg: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-infinity-navy dark:text-white hover:border-infinity-gold' }] : []),
              ...(!isOfficer && isIntakeAgent ? [{ label: 'New Lead', icon: '📞', href: '/portal/leads', bg: 'bg-orange-500 text-white hover:bg-orange-600' }] : []),
            ].slice(0, 4).map((a, i) => (
              <Link key={i} href={a.href} className={`${a.bg} rounded-xl p-3 text-center transition-all text-xs font-semibold`}>
                <div className="text-xl mb-1">{a.icon}</div>
                {a.label}
              </Link>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-display font-bold text-infinity-navy dark:text-white">Need Help?</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Reach out to our support team via email or WhatsApp</p>
              </div>
              <div className="flex items-center gap-2">
                <a href="mailto:info@infinitylegal.co.za" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-semibold text-infinity-navy dark:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Email
                </a>
                <a href="https://wa.me/27682011186?text=Hi%20Infinity%20Legal%2C%20I%20need%20assistance" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-xs font-semibold text-green-700 dark:text-green-400 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white flex items-center gap-2">
                🔔 Recent Notifications
              </h2>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No new notifications</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-64 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div key={n._id || i} className={`px-4 py-2.5 ${!n.read ? 'bg-infinity-gold/5' : ''}`}>
                    <div className="text-xs font-medium text-infinity-navy dark:text-white line-clamp-1">{n.title}</div>
                    <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{n.message}</div>
                    <div className="text-[9px] text-gray-300 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString('en-ZA') : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Firm Info Card */}
          <div className="bg-infinity-navy dark:bg-gray-800 rounded-xl p-4 text-white">
            <div className="text-xs font-bold mb-2 text-infinity-gold">INFINITY LEGAL (PTY) LTD</div>
            <div className="space-y-1.5 text-[11px] text-white/60">
              <div className="flex items-start gap-2">
                <span className="shrink-0">📍</span>
                <span>Block A, Eco Fusion 5, 1004 Witch-Hazel Avenue, Highveld Technopark, Centurion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">📞</span>
                <span>+27 12 940 1080</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">✉️</span>
                <span>info@infinitylegal.co.za</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="text-[10px] text-white/30">Managing Director: Tidimalo Tsatsi</div>
            </div>
          </div>

          {/* Role Reminder */}
          {isParalegal && (
            <div className="p-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/30 rounded-xl">
              <p className="text-[10px] text-teal-700 dark:text-teal-400">
                <strong>Reminder:</strong> All documents require Officer approval before client delivery. You cannot sign legal filings or transmit final legal advice.
              </p>
            </div>
          )}

          {isIntakeAgent && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
              <p className="text-[10px] text-orange-700 dark:text-orange-400">
                <strong>Note:</strong> You can qualify leads and schedule appointments. You cannot access active case files or provide legal advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
