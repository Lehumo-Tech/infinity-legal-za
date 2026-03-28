'use client'

import { useState } from 'react'
import { STAFF } from '@/lib/demo-data'

export default function StaffMgmtPage() {
  const [staff] = useState(STAFF)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Staff Management</h1>
        <button onClick={() => alert('Add Staff form coming soon!')} className="px-4 py-2 bg-[#0f2b46] text-white text-sm font-bold rounded-xl">+ Add Staff</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Email</th><th className="text-left px-5 py-3">Role</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Last Login</th><th className="text-left px-5 py-3">Actions</th></tr></thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-700">{s.name}</td>
                <td className="px-5 py-3 text-gray-500">{s.email}</td>
                <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${s.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{s.role}</span></td>
                <td className="px-5 py-3"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Active</span></td>
                <td className="px-5 py-3 text-gray-400">{s.lastLogin}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => alert('Edit dialog for ' + s.name)} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                    <button onClick={() => alert(s.name + ' deactivated')} className="text-xs text-red-500 font-semibold hover:underline">Deactivate</button>
                    <button onClick={() => alert('Password reset email sent to ' + s.email)} className="text-xs text-gray-500 font-semibold hover:underline">Reset PW</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
