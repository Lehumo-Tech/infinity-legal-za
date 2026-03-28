'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { REQUESTS } from '@/lib/demo-data'

export default function RequestDetailPage() {
  const params = useParams()
  const request = REQUESTS.find(r => r.id === params.id)

  if (!request) return <div className="text-center py-20"><p className="text-gray-400">Request not found</p><Link href="/portal/member/requests" className="text-[#c9a961] font-semibold text-sm">← Back to Requests</Link></div>

  const statuses = ['pending', 'assigned', 'in_progress', 'resolved']
  const currentIdx = statuses.indexOf(request.status)

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><Link href="/portal/member/requests" className="text-sm text-[#c9a961] font-semibold">← Back to Requests</Link></div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div><h1 className="text-xl font-bold text-[#0f2b46]">{request.subject}</h1><p className="text-sm text-gray-400">{request.id} • {request.category}</p></div>
          <StatusBadge status={request.status} />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-gray-500 mb-2">STATUS TIMELINE</h3>
          <div className="flex items-center gap-2">
            {statuses.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentIdx ? 'bg-[#0f2b46] text-white' : 'bg-gray-200 text-gray-400'}`}>{i <= currentIdx ? '✓' : i + 1}</div>
                <span className={`text-xs font-medium capitalize ${i <= currentIdx ? 'text-[#0f2b46]' : 'text-gray-400'}`}>{s.replace('_', ' ')}</span>
                {i < 3 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-[#0f2b46]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div><p className="text-xs text-gray-400 font-semibold uppercase">Urgency</p><p className="text-sm font-medium text-gray-700 capitalize">{request.urgency}</p></div>
          <div><p className="text-xs text-gray-400 font-semibold uppercase">Assigned Attorney</p><p className="text-sm font-medium text-gray-700">{request.assignedTo || 'Pending assignment'}</p></div>
          <div><p className="text-xs text-gray-400 font-semibold uppercase">Created</p><p className="text-sm text-gray-700">{request.createdDate}</p></div>
          <div><p className="text-xs text-gray-400 font-semibold uppercase">Last Updated</p><p className="text-sm text-gray-700">{request.updatedDate}</p></div>
        </div>

        <div className="mb-6"><p className="text-xs text-gray-400 font-semibold uppercase mb-2">Description</p><p className="text-sm text-gray-600 leading-relaxed">{request.description}</p></div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3">MESSAGES</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500"><strong>System</strong> • {request.createdDate}</p><p className="text-sm text-gray-600">Request created and submitted for review.</p></div>
            {request.assignedTo && <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-500"><strong>{request.assignedTo}</strong> • {request.updatedDate}</p><p className="text-sm text-gray-600">I have reviewed your matter and will begin working on it. Please provide any additional documents you may have.</p></div>}
          </div>
          <div className="mt-4 flex gap-2">
            <input placeholder="Type a message..." className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm" />
            <button onClick={() => alert('Message sent!')} className="px-4 py-2 bg-[#0f2b46] text-white text-sm font-bold rounded-xl hover:bg-[#1a365d]">Send</button>
          </div>
        </div>

        {request.status !== 'resolved' && (
          <button onClick={() => alert('✅ Request marked as resolved. Thank you for using Infinity Legal!')} className="mt-6 w-full py-3 border-2 border-green-500 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors">✓ Mark as Resolved</button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'bg-yellow-100 text-yellow-800', assigned: 'bg-blue-100 text-blue-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800' }
  const labels = { pending: 'Pending', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>
}
