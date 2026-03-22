'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', href: '/attorney/office', icon: '📊' },
  { label: 'Cases', href: '/attorney/office/cases', icon: '📁' },
  { label: 'Documents', href: '/attorney/office/documents', icon: '📄' },
  { label: 'Tasks', href: '/attorney/office/tasks', icon: '✅' },
  { label: 'Calendar', href: '/attorney/office/calendar', icon: '📅' }
]

export default function AttorneyLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, loading, signOut, isAttorney } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-infinity-navy mx-auto mb-4"></div>
          <p className="text-infinity-navy">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-infinity-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-infinity-gold/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Infinity Legal" className="h-9 w-auto" />
                <span className="font-bold text-lg text-infinity-navy">Attorney Office</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/attorney/office' && pathname?.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-infinity-navy/10 text-infinity-navy'
                          : 'text-infinity-navy/60 hover:text-infinity-navy hover:bg-infinity-cream'
                      }`}
                    >
                      <span className="mr-1.5">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-infinity-navy/70 hidden sm:block">
                {profile?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-infinity-navy/60 hover:text-infinity-navy px-3 py-1.5 rounded-md hover:bg-infinity-cream transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-infinity-gold/10 px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || 
              (item.href !== '/attorney/office' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-infinity-navy/10 text-infinity-navy'
                    : 'text-infinity-navy/60 hover:text-infinity-navy'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
