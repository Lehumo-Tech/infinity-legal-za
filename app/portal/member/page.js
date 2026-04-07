'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, PLANS } from '@/lib/demo-data'

export default function MemberDashboard() {
  const [user, setUser] = useState(null)
  const [realMatters, setRealMatters] = useState(null)
  const [loadingMatters, setLoadingMatters] = useState(true)

  useEffect(() => { setUser(demoAuth.getUser()) }, [])

  // Try to fetch real data from API
  useEffect(() => {
    async function fetchRealData() {
      try {
        const [intakeRes, casesRes] = await Promise.all([
          fetch('/api/intakes').catch(() => null),
          fetch('/api/cases').catch(() => null),
        ])
        const intakes = intakeRes?.ok ? await intakeRes.json() : null
        const cases = casesRes?.ok ? await casesRes.json() : null
        if (intakes?.data || cases?.data) {
          setRealMatters({ intakes: intakes?.data || [], cases: cases?.data || [] })
        }
      } catch (e) { /* fallback to demo data */ }
      setLoadingMatters(false)
    }
    fetchRealData()
  }, [])

  if (!user) return null

  const plan = PLANS.find(p => p.id === user.plan)
  const myRequests = REQUESTS.filter(r => r.memberId === user.id)
  const activeReqs = myRequests.filter(r => r.status !== 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome, {user.name?.split(' ')[0]}</h1>
      <p className="text-gray-500 text-sm mb-6">Here&apos;s your legal plan overview</p>

      {/* Plan Info Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <p className="text-sm text-blue-800">
          ℹ️ Your plan includes unlimited consultations, 24-hour contact centre, free will & testament, and family plan. 
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Plan</div>
          <div className="text-xl font-bold text-[#0f2b46]">{plan?.name || user.planName}</div>
          <div className="text-xs text-green-600 font-semibold mt-1">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Monthly Premium</div>
          <div className="text-xl font-bold text-[#c9a961]">R{plan?.price || user.planPrice}/mo</div>
          <div className="text-xs text-gray-400 mt-1">Unlimited legal support</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Active Legal Matters</div>
          <div className="text-xl font-bold text-[#0f2b46]">{activeReqs.length}</div>
          <div className="text-xs text-gray-400 mt-1">{myRequests.length} total</div>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <Link href="/intake" className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d] transition-colors">📋 Submit New Legal Matter</Link>
        <button onClick={() => alert('Document upload coming soon!')} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">📄 Upload Document</button>
      </div>

      {/* Real intakes from DB if available */}
      {realMatters && (realMatters.intakes.length > 0 || realMatters.cases.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#0f2b46]">Legal Matters (from Database)</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Live Data</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-2">ID</th><th className="text-left px-5 py-2">Subject</th><th className="text-left px-5 py-2">Category</th><th className="text-left px-5 py-2">Status</th></tr></thead>
            <tbody>
              {realMatters.intakes.slice(0, 5).map((intake, i) => (
                <tr key={intake.id || i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-[#0f2b46]">{(intake.id || intake._id || '').toString().slice(0, 8)}</td>
                  <td className="px-5 py-3 text-gray-700">{intake.description?.slice(0, 50) || 'New Intake'}...</td>
                  <td className="px-5 py-3 text-gray-500 text-xs capitalize">{intake.caseType || intake.category || 'General'}</td>
                  <td className="px-5 py-3"><StatusBadge status={intake.status || 'pending'} /></td>
                </tr>
              ))}
              {realMatters.cases.slice(0, 5).map((c, i) => (
                <tr key={c.id || i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-[#0f2b46]">{(c.id || c._id || '').toString().slice(0, 8)}</td>
                  <td className="px-5 py-3 text-gray-700">{c.title || c.subject || 'Legal Matter'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs capitalize">{c.category || c.caseType || 'General'}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status || 'in_progress'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Demo data fallback */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0f2b46]">Recent Legal Matters</h3>
          <Link href="/portal/member/requests" className="text-xs text-[#c9a961] font-semibold">View All →</Link>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-2">ID</th><th className="text-left px-5 py-2">Subject</th><th className="text-left px-5 py-2">Category</th><th className="text-left px-5 py-2">Status</th><th className="text-left px-5 py-2">Date</th></tr></thead>
          <tbody>
            {myRequests.slice(0, 5).map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3 font-mono text-xs text-[#0f2b46]">{r.id}</td>
                <td className="px-5 py-3 text-gray-700">{r.subject}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{r.category}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{r.createdAt}</td>
              </tr>
            ))}
            {myRequests.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No legal matters yet. Click &quot;Submit New Legal Matter&quot; to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Plan upgrade for non-Extensive */}
      {user.plan !== 'extensive' && (
        <div className="mt-6 bg-[#c9a961]/10 rounded-xl p-5 text-center">
          <p className="text-sm text-[#0f2b46] font-semibold">Need Civil, Labour AND Criminal support? Upgrade to the Extensive Plan — R139/mo with unlimited legal support</p>
          <Link href="/pricing" className="inline-block mt-2 px-5 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg text-sm hover:bg-[#d4af37]">View All Plans →</Link>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800', new: 'bg-blue-100 text-blue-800' }
  const labels = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', new: 'New' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>
}
