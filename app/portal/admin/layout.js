'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'

const NAV = [
  { label: 'Dashboard', href: '/portal/admin', icon: '🏠' },
  { label: 'All Requests', href: '/portal/admin/requests', icon: '📋' },
  { label: 'Members', href: '/portal/admin/members', icon: '👥' },
  { label: 'Lead Scraper', href: '/portal/admin/leads', icon: '🔍' },
  { label: 'Reports', href: '/portal/admin/reports', icon: '📊' },
  { label: 'Staff Mgmt', href: '/portal/admin/staff-mgmt', icon: '👤' },
  { label: 'Calendar', href: '/portal/admin/calendar', icon: '📅' },
]

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const u = demoAuth.getUser()
    if (!u || u.portalType !== 'admin') { router.push('/login'); return }
    setUser(u)
    setLoading(false)
  }, [router])

  const handleLogout = () => { demoAuth.logout(); router.push('/login') }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#c9a961] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex flex-col w-60 bg-[#0f2b46] text-white">
        <div className="p-4 flex items-center gap-2 border-b border-white/10">
          <img src="/logo-icon-128.png" alt="" className="h-9 rounded-lg" />
          <div><span className="font-bold text-sm block" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span><span className="text-[10px] text-red-400 font-bold">ADMIN</span></div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === n.href ? 'bg-[#c9a961] text-[#0f2b46]' : 'text-white/70 hover:bg-white/10'}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/60 hover:bg-white/10">🚪 Logout</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div><span className="text-sm text-gray-500">Welcome,</span><span className="text-sm font-bold text-[#0f2b46] ml-1">{user?.name}</span></div>
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold uppercase">Admin</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
