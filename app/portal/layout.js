'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationBell from '@/components/NotificationBell'
import DarkModeToggle from '@/components/DarkModeToggle'

const NAV_BY_ROLE = {
  managing_partner: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'All Cases', href: '/portal/cases', icon: '📁' },
    { label: 'Leads Pipeline', href: '/portal/leads', icon: '📞' },
    { label: 'Documents', href: '/portal/documents', icon: '📄' },
    { label: 'Staff', href: '/portal/staff', icon: '👥' },
    { label: 'Audit Logs', href: '/portal/audit', icon: '🔒' },
    { label: 'Calendar', href: '/portal/calendar', icon: '📅' },
  ],
  legal_officer: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'My Cases', href: '/portal/cases', icon: '📁' },
    { label: 'Pending Approvals', href: '/portal/approvals', icon: '✅' },
    { label: 'Documents', href: '/portal/documents', icon: '📄' },
    { label: 'Leads', href: '/portal/leads', icon: '📞' },
    { label: 'Calendar', href: '/portal/calendar', icon: '📅' },
  ],
  attorney: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'My Cases', href: '/portal/cases', icon: '📁' },
    { label: 'Pending Approvals', href: '/portal/approvals', icon: '✅' },
    { label: 'Documents', href: '/portal/documents', icon: '📄' },
    { label: 'Leads', href: '/portal/leads', icon: '📞' },
    { label: 'Calendar', href: '/portal/calendar', icon: '📅' },
  ],
  paralegal: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'My Tasks', href: '/portal/tasks', icon: '📝' },
    { label: 'Assigned Cases', href: '/portal/cases', icon: '📁' },
    { label: 'Documents', href: '/portal/documents', icon: '📄' },
    { label: 'Research', href: '/portal/research', icon: '🔍' },
    { label: 'Leads', href: '/portal/leads', icon: '📞' },
  ],
  intake_agent: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'New Leads', href: '/portal/leads', icon: '📞' },
    { label: 'Call Queue', href: '/portal/calls', icon: '📱' },
    { label: 'Follow-ups', href: '/portal/followups', icon: '🔄' },
  ],
  admin: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'Staff', href: '/portal/staff', icon: '👥' },
    { label: 'Reports', href: '/portal/reports', icon: '📊' },
  ],
  it_admin: [
    { label: 'Dashboard', href: '/portal', icon: '🏠' },
    { label: 'Staff', href: '/portal/staff', icon: '👥' },
    { label: 'Audit Logs', href: '/portal/audit', icon: '🔒' },
    { label: 'System', href: '/portal/system', icon: '⚙️' },
  ],
}

const ROLE_LABELS = {
  managing_partner: 'Managing Partner',
  legal_officer: 'Legal Officer',
  attorney: 'Legal Officer',
  paralegal: 'Paralegal',
  intake_agent: 'Intake Specialist',
  admin: 'Administrator',
  it_admin: 'IT Administrator',
}

const ROLE_COLORS = {
  managing_partner: 'bg-purple-500',
  legal_officer: 'bg-infinity-navy',
  attorney: 'bg-infinity-navy',
  paralegal: 'bg-teal-600',
  intake_agent: 'bg-orange-500',
  admin: 'bg-gray-600',
  it_admin: 'bg-blue-600',
}

export default function PortalLayout({ children }) {
  const { user, profile, loading, signOut, isAuthenticated, canAccessPortal, role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/portal')
    }
    if (!loading && isAuthenticated && !canAccessPortal) {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, canAccessPortal, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-infinity-cream dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-infinity-navy/60 dark:text-white/60 font-sans">Loading Infinity OS...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !canAccessPortal) return null

  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE['intake_agent']
  const roleLabel = ROLE_LABELS[role] || role
  const roleColor = ROLE_COLORS[role] || 'bg-gray-500'

  return (
    <div className="min-h-screen flex bg-infinity-cream dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-infinity-navy dark:bg-gray-800 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <Link href="/portal" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto brightness-0 invert" />
              <div>
                <span className="text-white font-display font-bold text-lg block leading-tight">Infinity OS</span>
                <span className="text-white/40 text-xs font-sans">Legal Operations</span>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${roleColor} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                {profile?.full_name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate">{profile?.full_name || 'User'}</div>
                <div className="text-white/50 text-xs truncate">{roleLabel}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-infinity-gold/20 text-infinity-gold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/60 text-xs font-sans transition-colors mb-3">
              ← Back to Main Site
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-infinity-navy/10 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-infinity-navy dark:text-white rounded-lg hover:bg-infinity-navy/5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <DarkModeToggle />
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
