'use client'

import { useState } from 'react'
import { MEMBERS, REQUESTS, STAFF } from '@/lib/demo-data'

const REPORT_TYPES = [
  { id: 'subscriptions', label: 'Subscription Report', icon: '💳' },
  { id: 'requests', label: 'Request Report', icon: '📋' },
  { id: 'members', label: 'Member Report', icon: '👥' },
  { id: 'staff', label: 'Staff Report', icon: '⚖️' },
]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('subscriptions')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => alert('📄 CSV exported!')} className="px-4 py-2 bg-[#0f2b46] text-white text-sm font-bold rounded-xl">Export CSV</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {REPORT_TYPES.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeReport === r.id ? 'bg-[#0f2b46] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeReport === 'subscriptions' && (
          <div>
            <div className="grid grid-cols-4 gap-4 p-5 border-b border-gray-100">
              {[{ label: 'Total MRR', value: `R${MEMBERS.reduce((s, m) => s + m.planPrice, 0)}` }, { label: 'Active Subs', value: MEMBERS.length }, { label: 'Churn Rate', value: '2.1%' }, { label: 'LTV', value: 'R4,776' }].map((m, i) => (
                <div key={i} className="text-center"><div className="text-xs text-gray-400 uppercase">{m.label}</div><div className="text-xl font-bold text-[#0f2b46]">{m.value}</div></div>
              ))}
            </div>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">Member</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Amount</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Since</th></tr></thead>
              <tbody>{MEMBERS.map(m => (<tr key={m.id} className="border-t border-gray-50"><td className="px-5 py-3 font-medium">{m.name}</td><td className="px-5 py-3 capitalize">{m.plan}</td><td className="px-5 py-3 font-bold">R{m.planPrice}</td><td className="px-5 py-3"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Active</span></td><td className="px-5 py-3 text-gray-400">{m.joinDate}</td></tr>))}</tbody>
            </table>
          </div>
        )}
        {activeReport === 'requests' && (
          <div>
            <div className="grid grid-cols-4 gap-4 p-5 border-b border-gray-100">
              {[{ label: 'Total Requests', value: REQUESTS.length }, { label: 'Pending', value: REQUESTS.filter(r => r.status === 'pending').length }, { label: 'Resolved', value: REQUESTS.filter(r => r.status === 'resolved').length }, { label: 'Avg Resolution', value: '5.2 days' }].map((m, i) => (
                <div key={i} className="text-center"><div className="text-xs text-gray-400 uppercase">{m.label}</div><div className="text-xl font-bold text-[#0f2b46]">{m.value}</div></div>
              ))}
            </div>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">ID</th><th className="text-left px-5 py-3">Category</th><th className="text-left px-5 py-3">Member</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Urgency</th></tr></thead>
              <tbody>{REQUESTS.map(r => (<tr key={r.id} className="border-t border-gray-50"><td className="px-5 py-3 font-mono text-xs">{r.id}</td><td className="px-5 py-3">{r.category}</td><td className="px-5 py-3">{r.memberName}</td><td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'resolved' ? 'bg-green-100 text-green-800' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{r.status.replace('_', ' ')}</span></td><td className="px-5 py-3 capitalize">{r.urgency}</td></tr>))}</tbody>
            </table>
          </div>
        )}
        {activeReport === 'members' && (
          <div>
            <div className="grid grid-cols-4 gap-4 p-5 border-b border-gray-100">
              {[{ label: 'Total Members', value: MEMBERS.length }, { label: 'New (30d)', value: 1 }, { label: 'Churn (30d)', value: 0 }, { label: 'Avg Plan Value', value: `R${Math.round(MEMBERS.reduce((s, m) => s + m.planPrice, 0) / MEMBERS.length)}` }].map((m, i) => (
                <div key={i} className="text-center"><div className="text-xs text-gray-400 uppercase">{m.label}</div><div className="text-xl font-bold text-[#0f2b46]">{m.value}</div></div>
              ))}
            </div>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">Member</th><th className="text-left px-5 py-3">Email</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Requests</th><th className="text-left px-5 py-3">Joined</th></tr></thead>
              <tbody>{MEMBERS.map(m => (<tr key={m.id} className="border-t border-gray-50"><td className="px-5 py-3 font-medium">{m.name}</td><td className="px-5 py-3 text-gray-500">{m.email}</td><td className="px-5 py-3 capitalize font-bold">{m.plan}</td><td className="px-5 py-3">{REQUESTS.filter(r => r.memberId === m.id).length}</td><td className="px-5 py-3 text-gray-400">{m.joinDate}</td></tr>))}</tbody>
            </table>
          </div>
        )}
        {activeReport === 'staff' && (
          <div>
            <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-100">
              {[{ label: 'Total Staff', value: STAFF.length }, { label: 'Attorneys', value: STAFF.filter(s => s.role === 'attorney').length }, { label: 'Admins', value: STAFF.filter(s => s.role === 'admin').length }].map((m, i) => (
                <div key={i} className="text-center"><div className="text-xs text-gray-400 uppercase">{m.label}</div><div className="text-xl font-bold text-[#0f2b46]">{m.value}</div></div>
              ))}
            </div>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Email</th><th className="text-left px-5 py-3">Role</th><th className="text-left px-5 py-3">Assigned</th><th className="text-left px-5 py-3">Last Login</th></tr></thead>
              <tbody>{STAFF.map(s => (<tr key={s.id} className="border-t border-gray-50"><td className="px-5 py-3 font-medium">{s.name}</td><td className="px-5 py-3 text-gray-500">{s.email}</td><td className="px-5 py-3 capitalize"><span className={`text-xs font-bold px-2 py-1 rounded-full ${s.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{s.role}</span></td><td className="px-5 py-3">{REQUESTS.filter(r => r.assignedTo?.includes(s.name.split(' ').pop())).length}</td><td className="px-5 py-3 text-gray-400">{s.lastLogin}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
