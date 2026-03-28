'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, MEMBERS, STAFF, SCRAPED_LEADS } from '@/lib/demo-data'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  useEffect(() => { setUser(demoAuth.getUser()) }, [])
  if (!user) return null

  const mrr = MEMBERS.reduce((sum, m) => sum + m.planPrice, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Full platform overview and controls</p>

      <div className="grid md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Monthly Revenue', value: `R${mrr.toLocaleString()}`, color: 'bg-[#c9a961]/10 text-[#0f2b46]', icon: '💰' },
          { label: 'Active Members', value: MEMBERS.length, color: 'bg-green-50 text-green-700', icon: '👥' },
          { label: 'Open Requests', value: REQUESTS.filter(r => r.status !== 'resolved').length, color: 'bg-blue-50 text-blue-700', icon: '📋' },
          { label: 'Staff Members', value: STAFF.length, color: 'bg-purple-50 text-purple-700', icon: '⚖️' },
          { label: 'Scraped Leads', value: SCRAPED_LEADS.length, color: 'bg-orange-50 text-orange-700', icon: '🔍' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-5`}>
            <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-sm font-medium opacity-80">{s.label}</span></div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {[{ name: 'Basic (R95)', count: MEMBERS.filter(m => m.plan === 'basic').length, revenue: MEMBERS.filter(m => m.plan === 'basic').length * 95, color: 'bg-blue-500' },
              { name: 'Premium (R115)', count: MEMBERS.filter(m => m.plan === 'premium').length, revenue: MEMBERS.filter(m => m.plan === 'premium').length * 115, color: 'bg-[#c9a961]' },
              { name: 'Business (R130)', count: MEMBERS.filter(m => m.plan === 'business').length, revenue: MEMBERS.filter(m => m.plan === 'business').length * 130, color: 'bg-[#0f2b46]' },
            ].map(p => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{p.name} ({p.count} members)</span><span className="font-bold text-[#0f2b46]">R{p.revenue}</span></div>
                <div className="bg-gray-100 rounded-full h-2"><div className={`${p.color} h-2 rounded-full`} style={{ width: `${(p.revenue / mrr) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">Staff Performance</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 uppercase"><th className="text-left py-2">Attorney</th><th className="text-left py-2">Assigned</th><th className="text-left py-2">Resolved</th><th className="text-left py-2">Avg Time</th></tr></thead>
            <tbody>
              {STAFF.filter(s => s.role === 'attorney').map(s => {
                const assigned = REQUESTS.filter(r => r.assignedTo?.includes(s.name.split(' ').pop())).length
                const resolved = REQUESTS.filter(r => r.assignedTo?.includes(s.name.split(' ').pop()) && r.status === 'resolved').length
                return (
                  <tr key={s.id} className="border-t border-gray-50">
                    <td className="py-2 font-medium text-gray-700">{s.name}</td>
                    <td className="py-2">{assigned}</td>
                    <td className="py-2 text-green-600 font-bold">{resolved}</td>
                    <td className="py-2 text-gray-500">{(Math.random() * 5 + 2).toFixed(1)}h</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/portal/admin/reports" className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm">📊 View Reports</Link>
        <Link href="/portal/admin/staff-mgmt" className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm">👤 Manage Staff</Link>
        <Link href="/portal/admin/leads" className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm">🔍 Lead Scraper</Link>
      </div>
    </div>
  )
}
