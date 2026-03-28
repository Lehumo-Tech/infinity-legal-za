'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, MEMBERS } from '@/lib/demo-data'

export default function StaffDashboard() {
  const [user, setUser] = useState(null)
  useEffect(() => { setUser(demoAuth.getUser()) }, [])
  if (!user) return null

  const assigned = REQUESTS.filter(r => r.assignedTo?.includes(user.name?.split(' ').pop() || ''))
  const pending = REQUESTS.filter(r => r.status === 'pending')
  const resolved = REQUESTS.filter(r => r.status === 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome, {user.name?.split(' ')[0]}</h1>
      <p className="text-gray-500 text-sm mb-6">Staff Command Centre</p>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[{ label: 'Assigned to Me', value: assigned.length, color: 'bg-blue-50 text-blue-700' }, { label: 'Pending Assignment', value: pending.length, color: 'bg-yellow-50 text-yellow-700' }, { label: 'Resolved (Month)', value: resolved.length, color: 'bg-green-50 text-green-700' }, { label: 'Avg Response', value: '4.2 hrs', color: 'bg-purple-50 text-purple-700' }].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-5`}>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">My Tasks</h3>
          <div className="space-y-2">
            {[
              { task: 'Review Thabo Mbeki CCMA documents', due: 'Today', urgent: true },
              { task: 'Draft response for lease dispute', due: 'Tomorrow', urgent: false },
              { task: 'Schedule consultation with Nomsa', due: 'Mar 16', urgent: true },
              { task: 'Prepare court filing for property case', due: 'Mar 18', urgent: false },
              { task: 'Review contract for Peter Naidoo', due: 'Mar 20', urgent: false },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">{t.task}</span></div>
                <span className={`text-xs font-bold ${t.urgent ? 'text-red-500' : 'text-gray-400'}`}>{t.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0f2b46]">Recent Activity</h3>
            <Link href="/portal/staff/requests" className="text-xs text-[#c9a961] font-semibold">View All →</Link>
          </div>
          <div className="space-y-3">
            {REQUESTS.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${r.status === 'pending' ? 'bg-yellow-400' : r.status === 'assigned' ? 'bg-blue-400' : r.status === 'in_progress' ? 'bg-orange-400' : 'bg-green-400'}`} />
                <div><p className="text-sm text-gray-700"><strong>{r.memberName}</strong> — {r.subject}</p><p className="text-xs text-gray-400">{r.updatedDate} • {r.status.replace('_', ' ')}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
