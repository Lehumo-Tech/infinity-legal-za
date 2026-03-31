'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, MEMBERS, STAFF, SCRAPED_LEADS, PLANS } from '@/lib/demo-data'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [realStats, setRealStats] = useState(null)
  
  useEffect(() => { setUser(demoAuth.getUser()) }, [])

  // Fetch real data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [intakeRes, casesRes, leadsRes] = await Promise.all([
          fetch('/api/intakes').catch(() => null),
          fetch('/api/cases').catch(() => null),
          fetch('/api/leads').catch(() => null),
        ])
        const intakes = intakeRes?.ok ? await intakeRes.json() : null
        const cases = casesRes?.ok ? await casesRes.json() : null
        const leads = leadsRes?.ok ? await leadsRes.json() : null
        if (intakes?.data || cases?.data || leads?.data) {
          setRealStats({
            intakes: intakes?.data?.length || 0,
            cases: cases?.data?.length || 0,
            leads: leads?.data?.length || 0,
          })
        }
      } catch (e) {}
    }
    fetchData()
  }, [])

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
          { label: 'Open Matters', value: REQUESTS.filter(r => r.status !== 'resolved').length, color: 'bg-blue-50 text-blue-700', icon: '📋' },
          { label: 'Legal Advisors', value: STAFF.filter(s => s.role === 'legal_advisor').length, color: 'bg-purple-50 text-purple-700', icon: '⚖️' },
          { label: 'Scraped Leads', value: SCRAPED_LEADS.length, color: 'bg-orange-50 text-orange-700', icon: '🔍' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-5`}>
            <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-sm font-medium opacity-80">{s.label}</span></div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Real data badge */}
      {realStats && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Live Database</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-green-700"><strong>{realStats.intakes}</strong> AI Intakes</span>
            <span className="text-green-700"><strong>{realStats.cases}</strong> Cases</span>
            <span className="text-green-700"><strong>{realStats.leads}</strong> Leads</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Cover */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">Revenue by Cover Type</h3>
          <div className="space-y-3">
            {[
              { name: 'Civil Plan (R99)', count: MEMBERS.filter(m => m.plan === 'civil').length, revenue: MEMBERS.filter(m => m.plan === 'civil').length * 99, color: 'bg-purple-500' },
              { name: 'Labour Plan (R99)', count: MEMBERS.filter(m => m.plan === 'labour').length, revenue: MEMBERS.filter(m => m.plan === 'labour').length * 99, color: 'bg-blue-500' },
              { name: 'Extensive Plan (R139)', count: MEMBERS.filter(m => m.plan === 'extensive').length, revenue: MEMBERS.filter(m => m.plan === 'extensive').length * 139, color: 'bg-[#c9a961]' },
            ].map(p => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{p.name} ({p.count} members)</span><span className="font-bold text-[#0f2b46]">R{p.revenue}</span></div>
                <div className="bg-gray-100 rounded-full h-2"><div className={`${p.color} h-2 rounded-full`} style={{ width: `${mrr > 0 ? (p.revenue / mrr) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Advisor Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">Legal Advisor Performance</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 uppercase"><th className="text-left py-2">Legal Advisor</th><th className="text-left py-2">Assigned</th><th className="text-left py-2">Resolved</th><th className="text-left py-2">Avg Time</th></tr></thead>
            <tbody>
              {STAFF.filter(s => s.role === 'legal_advisor').map(s => {
                const assignedCount = REQUESTS.filter(r => r.assignedTo === s.id).length
                const resolvedCount = REQUESTS.filter(r => r.assignedTo === s.id && r.status === 'resolved').length
                return (
                  <tr key={s.id} className="border-t border-gray-50">
                    <td className="py-2 font-medium text-gray-700">{s.name}</td>
                    <td className="py-2">{assignedCount}</td>
                    <td className="py-2 text-green-600 font-bold">{resolvedCount}</td>
                    <td className="py-2 text-gray-500">3.8h</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/portal/admin/reports" className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm">📊 View Reports</Link>
        <Link href="/portal/admin/staff-mgmt" className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm">👤 Manage Advisors</Link>
        <Link href="/portal/admin/leads" className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm">🔍 Lead Scraper</Link>
      </div>
    </div>
  )
}
