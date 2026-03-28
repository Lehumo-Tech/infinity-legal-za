'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REQUESTS, STAFF } from '@/lib/demo-data'

export default function StaffRequestsPage() {
  const [filter, setFilter] = useState({ status: 'all', category: 'all', urgency: 'all' })

  const filtered = REQUESTS.filter(r => {
    if (filter.status !== 'all' && r.status !== filter.status) return false
    if (filter.category !== 'all' && r.category !== filter.category) return false
    if (filter.urgency !== 'all' && r.urgency !== filter.urgency) return false
    return true
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>All Requests</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Statuses</option><option value="pending">Pending</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
        </select>
        <select value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Categories</option>{['Employment', 'Property', 'Family', 'Corporate', 'Consumer'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filter.urgency} onChange={e => setFilter({...filter, urgency: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Urgency</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-4 py-3">ID</th><th className="text-left px-4 py-3">Member</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Subject</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Assigned</th><th className="text-left px-4 py-3">Urgency</th><th className="text-left px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{r.memberName}</td>
                <td className="px-4 py-3"><span className="text-xs bg-[#0f2b46]/10 text-[#0f2b46] px-2 py-1 rounded-full">{r.category}</span></td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.subject}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.assignedTo || <button onClick={() => alert('✅ Assigned to you!')} className="text-[#c9a961] font-bold hover:underline">Assign to Me</button>}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold capitalize ${r.urgency === 'high' || r.urgency === 'emergency' ? 'text-red-600' : r.urgency === 'medium' ? 'text-orange-600' : 'text-gray-500'}`}>{r.urgency}</span></td>
                <td className="px-4 py-3"><Link href={`/portal/staff/requests/${r.id}`} className="text-xs text-[#c9a961] font-semibold">View →</Link></td>
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
