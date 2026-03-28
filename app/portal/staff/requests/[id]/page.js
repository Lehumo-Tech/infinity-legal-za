'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { REQUESTS, STAFF } from '@/lib/demo-data'

export default function StaffRequestDetail() {
  const params = useParams()
  const request = REQUESTS.find(r => r.id === params.id)
  const [status, setStatus] = useState(request?.status || 'pending')
  const [note, setNote] = useState('')

  if (!request) return <div className="text-center py-20"><p className="text-gray-400">Request not found</p><Link href="/portal/staff/requests" className="text-[#c9a961] text-sm font-semibold">← Back</Link></div>

  return (
    <div className="max-w-4xl">
      <div className="mb-6"><Link href="/portal/staff/requests" className="text-sm text-[#c9a961] font-semibold">← Back to All Requests</Link></div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-xl font-bold text-[#0f2b46]">{request.subject}</h1><p className="text-sm text-gray-400">{request.id} • {request.memberName} • {request.category}</p></div>
          <StatusBadge status={status} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">Update Status</p>
            <select value={status} onChange={e => { setStatus(e.target.value); alert('✅ Status updated to: ' + e.target.value) }} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="pending">Pending</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">Assign To</p>
            <select defaultValue={request.assignedTo || ''} onChange={e => alert('✅ Assigned to: ' + e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Unassigned</option>{STAFF.filter(s => s.role === 'attorney').map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase">Urgency</p>
            <p className={`text-sm font-bold mt-1 capitalize ${request.urgency === 'high' ? 'text-red-600' : request.urgency === 'medium' ? 'text-orange-600' : 'text-gray-600'}`}>{request.urgency}</p>
          </div>
        </div>

        <div className="mb-6"><p className="text-xs text-gray-400 font-semibold uppercase mb-2">Description</p><p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{request.description}</p></div>

        <div className="mb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Internal Notes (Not visible to member)</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Add internal notes..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          <button onClick={() => { if(note) { alert('✅ Note saved!'); setNote('') } }} className="mt-2 px-4 py-2 bg-[#0f2b46] text-white text-sm font-bold rounded-xl">Save Note</button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => alert('✅ Request marked as resolved!')} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700">✓ Mark Resolved</button>
          <button onClick={() => alert('📧 Email sent to ' + request.memberName)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">📧 Contact Member</button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800' }
  const labels = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>
}
