'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS } from '@/lib/demo-data'

export default function MemberRequestsPage() {
  const [user, setUser] = useState(null)
  useEffect(() => { setUser(demoAuth.getUser()) }, [])
  if (!user) return null
  const myRequests = REQUESTS.filter(r => r.memberId === user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>My Requests</h1><p className="text-gray-500 text-sm">{myRequests.length} total requests</p></div>
        <Link href="/portal/member/requests/new" className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d]">+ New Request</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">ID</th><th className="text-left px-5 py-3">Category</th><th className="text-left px-5 py-3">Subject</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Created</th><th className="text-left px-5 py-3">Actions</th></tr></thead>
          <tbody>
            {myRequests.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-5 py-3"><span className="text-xs bg-[#0f2b46]/10 text-[#0f2b46] px-2 py-1 rounded-full font-semibold">{r.category}</span></td>
                <td className="px-5 py-3 text-gray-700">{r.subject}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{r.createdDate}</td>
                <td className="px-5 py-3"><Link href={`/portal/member/requests/${r.id}`} className="text-xs text-[#c9a961] font-semibold hover:text-[#0f2b46]">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800' }
  const labels = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>
}
