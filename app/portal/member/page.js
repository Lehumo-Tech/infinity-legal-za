'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, PLANS } from '@/lib/demo-data'

export default function MemberDashboard() {
  const [user, setUser] = useState(null)
  useEffect(() => { setUser(demoAuth.getUser()) }, [])
  if (!user) return null

  const plan = PLANS.find(p => p.id === user.plan)
  const myRequests = REQUESTS.filter(r => r.memberId === user.id)
  const activeReqs = myRequests.filter(r => r.status !== 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome, {user.name?.split(' ')[0]}</h1>
      <p className="text-gray-500 text-sm mb-6">Here's your legal protection overview</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Plan Status</div>
          <div className="text-xl font-bold text-[#0f2b46]">{plan?.name}</div>
          <div className="text-xs text-green-600 font-semibold mt-1">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Benefits Remaining</div>
          <div className="text-xl font-bold text-[#0f2b46]">{user.benefitsRemaining?.consults} consults, {user.benefitsRemaining?.documents} docs</div>
          <div className="text-xs text-gray-400 mt-1">Resets on the {user.billingDay}th</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Active Requests</div>
          <div className="text-xl font-bold text-[#0f2b46]">{activeReqs.length}</div>
          <div className="text-xs text-gray-400 mt-1">{myRequests.length} total</div>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <Link href="/portal/member/requests/new" className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d] transition-colors">📝 Request Help</Link>
        <button onClick={() => alert('Document upload coming soon!')} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">📄 Upload Document</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0f2b46]">Recent Requests</h3>
          <Link href="/portal/member/requests" className="text-xs text-[#c9a961] font-semibold">View All →</Link>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-2">ID</th><th className="text-left px-5 py-2">Subject</th><th className="text-left px-5 py-2">Status</th><th className="text-left px-5 py-2">Date</th></tr></thead>
          <tbody>
            {myRequests.slice(0, 3).map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/portal/member/requests/${r.id}`}>
                <td className="px-5 py-3 font-mono text-xs text-[#0f2b46]">{r.id}</td>
                <td className="px-5 py-3 text-gray-700">{r.subject}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{r.createdDate}</td>
              </tr>
            ))}
            {myRequests.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No requests yet. Click "Request Help" to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      {user.plan === 'basic' && (
        <div className="mt-6 bg-[#c9a961]/10 rounded-xl p-5 text-center">
          <p className="text-sm text-[#0f2b46] font-semibold">Upgrade to Premium for unlimited consultations and court representation</p>
          <Link href="/pricing" className="inline-block mt-2 px-5 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg text-sm hover:bg-[#d4af37]">Upgrade Plan →</Link>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800' }
  const labels = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>
}
