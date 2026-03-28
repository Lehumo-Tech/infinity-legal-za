'use client'

import { useState } from 'react'
import { MEMBERS, REQUESTS } from '@/lib/demo-data'

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const filtered = MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Member Database</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="mb-4 px-4 py-2.5 border border-gray-200 rounded-xl text-sm w-full md:w-80" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Email</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Joined</th><th className="text-left px-5 py-3">Requests</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => alert(`Member: ${m.name}\nEmail: ${m.email}\nPlan: ${m.plan} (R${m.planPrice}/mo)\nActive Requests: ${REQUESTS.filter(r => r.memberId === m.id && r.status !== 'resolved').length}`)}>
                <td className="px-5 py-3 font-medium text-gray-700">{m.name}</td>
                <td className="px-5 py-3 text-gray-500">{m.email}</td>
                <td className="px-5 py-3"><span className="text-xs bg-[#c9a961]/20 text-[#78621e] px-2 py-1 rounded-full font-bold uppercase">{m.plan}</span></td>
                <td className="px-5 py-3"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Active</span></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{m.joinDate}</td>
                <td className="px-5 py-3 font-bold text-[#0f2b46]">{REQUESTS.filter(r => r.memberId === m.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
