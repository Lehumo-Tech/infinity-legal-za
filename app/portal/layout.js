'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationBell from '@/components/NotificationBell'
import DarkModeToggle from '@/components/DarkModeToggle'

// Sidebar sections with role-based visibility
function getNavSections(role, roleTier, checks) {
  const sections = []
  
  // Core
  sections.push({
    title: null,
    items: [
      { label: 'Dashboard', href: '/portal', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ]
  })

  // Case Management (Legal Staff + Intake)
  if (checks.isLegalStaff || checks.isIntakeAgent) {
    sections.push({
      title: 'Case Management',
      items: [
        { label: 'Cases', href: '/portal/cases', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { label: 'AI Intakes', href: '/portal/intakes', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        ...(checks.isOfficer ? [{ label: 'Approvals', href: '/portal/approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }] : []),
        { label: 'Documents', href: '/portal/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Tasks', href: '/portal/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      ]
    })
  }

  // Business Development
  if (checks.isLegalStaff || checks.isIntakeAgent || ['client_relations', 'marketing_director'].includes(role)) {
    sections.push({
      title: 'Business Development',
      items: [
        { label: 'Leads Pipeline', href: '/portal/leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { label: 'Calendar', href: '/portal/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      ]
    })
  }

  // Communication Hub (All portal staff)
  sections.push({
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/portal/messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    ]
  })

  // AI & Intelligence (Legal + Directors)
  if (checks.isLegalStaff || checks.isDirector) {
    sections.push({
      title: 'Intelligence',
      items: [
        { label: 'AI Insights', href: '/portal/intelligence', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { label: 'Knowledge Base', href: '/portal/knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      ]
    })
  }

  // Finance (Finance roles + Directors)
  if (checks.isFinanceStaff || checks.isDirector) {
    sections.push({
      title: 'Finance',
      items: [
        { label: 'Billing', href: '/portal/billing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Reports', href: '/portal/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      ]
    })
  }

  // Administration (Directors + IT + HR)
  if (checks.isDirector || checks.isITStaff || checks.isHRStaff || roleTier >= 60) {
    const adminItems = []
    if (roleTier >= 60) adminItems.push({ label: 'Staff Directory', href: '/portal/staff', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
    if (checks.isITStaff || checks.isDirector) adminItems.push({ label: 'Audit Logs', href: '/portal/audit', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
    adminItems.push({ label: 'HR & Leave', href: '/portal/hr', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
    
    if (adminItems.length > 0) {
      sections.push({ title: 'Administration', items: adminItems })
    }
  }

  // Settings (everyone)
  sections.push({
    title: null,
    items: [
      { label: 'Settings', href: '/portal/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ]
  })

  return sections
}

const ROLE_COLORS = {
  managing_director: 'bg-amber-500', deputy_md: 'bg-amber-600',
  senior_partner: 'bg-purple-600', associate: 'bg-infinity-navy', junior_attorney: 'bg-blue-600',
  paralegal: 'bg-teal-600', legal_assistant: 'bg-cyan-600',
  operations_director: 'bg-slate-600', office_manager: 'bg-slate-500',
  cfo: 'bg-emerald-600', billing_specialist: 'bg-emerald-500',
  marketing_director: 'bg-pink-600', client_relations: 'bg-rose-500', intake_agent: 'bg-orange-500',
  it_director: 'bg-indigo-600', systems_admin: 'bg-indigo-500',
  hr_director: 'bg-violet-600', admin: 'bg-gray-600', client: 'bg-gray-500',
  managing_partner: 'bg-amber-500', legal_officer: 'bg-infinity-navy', attorney: 'bg-infinity-navy', it_admin: 'bg-indigo-500',
}

function SvgIcon({ d }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

export default function PortalLayout({ children }) {
  const auth = useAuth()
  const { user, profile, loading, signOut, isAuthenticated, canAccessPortal, role, roleTier, roleLabel, department } = auth
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login?redirect=/portal')
    if (!loading && isAuthenticated && !canAccessPortal) router.push('/dashboard')
  }, [loading, isAuthenticated, canAccessPortal, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm">Loading Infinity OS...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !canAccessPortal) return null

  const navSections = getNavSections(role, roleTier, auth)
  const roleColor = ROLE_COLORS[role] || 'bg-gray-500'
  const sidebarW = sidebarCollapsed ? 'w-16' : 'w-60'

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarW} bg-infinity-navy dark:bg-gray-800 transform transition-all duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-white/10 shrink-0">
            <Link href="/portal" className="flex items-center gap-2.5 min-w-0">
              <img src="/logo.png" alt="Infinity" className="h-7 w-auto brightness-0 invert shrink-0" />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="text-white font-display font-bold text-sm block leading-none">Infinity OS</span>
                  <span className="text-white/30 text-[10px]">Legal Operations</span>
                </div>
              )}
            </Link>
          </div>

          {/* User Card */}
          {!sidebarCollapsed && (
            <div className="px-3 py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5">
                <div className={`w-8 h-8 ${roleColor} rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {profile?.full_name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-xs font-semibold truncate">{profile?.full_name || 'User'}</div>
                  <div className="text-white/40 text-[10px] truncate">{roleLabel} • {department}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {navSections.map((section, si) => (
              <div key={si} className={si > 0 ? 'mt-3' : ''}>
                {section.title && !sidebarCollapsed && (
                  <div className="px-2 mb-1">
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{section.title}</span>
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5 ${
                        isActive
                          ? 'bg-infinity-gold/20 text-infinity-gold'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <SvgIcon d={item.icon} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-white/10 shrink-0 space-y-1">
            {!sidebarCollapsed && (
              <Link href="/" className="flex items-center gap-2 px-2.5 py-1.5 text-white/30 hover:text-white/50 text-[10px] transition-colors">
                ← Back to Website
              </Link>
            )}
            <button onClick={signOut}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg text-xs transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-infinity-navy dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search cases, documents, clients..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-infinity-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-infinity-gold/40 focus:border-infinity-gold" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <DarkModeToggle />
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 text-gray-400 hover:text-infinity-navy dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} /></svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
