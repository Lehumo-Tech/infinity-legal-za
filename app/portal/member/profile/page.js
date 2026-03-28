'use client'

import { useEffect, useState } from 'react'
import { demoAuth } from '@/lib/demo-auth'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', idNumber: '0001015009088' })
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [notifs, setNotifs] = useState({ email: true, sms: true })

  useEffect(() => {
    const u = demoAuth.getUser()
    if (u) { setUser(u); setForm({ name: u.name, email: u.email, phone: u.phone, idNumber: '0001015009088' }) }
  }, [])

  if (!user) return null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Profile Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-bold text-gray-500 mb-4">PERSONAL INFORMATION</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">ID Number</label><input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
        </div>
        <button onClick={() => alert('✅ Profile updated successfully!')} className="mt-4 px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d]">Save Changes</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-bold text-gray-500 mb-4">CHANGE PASSWORD</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label><input type="password" value={pw.current} onChange={e => setPw({...pw, current: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label><input type="password" value={pw.newPw} onChange={e => setPw({...pw, newPw: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label><input type="password" value={pw.confirm} onChange={e => setPw({...pw, confirm: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
        </div>
        <button onClick={() => alert('✅ Password changed successfully!')} className="mt-4 px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d]">Change Password</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-500 mb-4">NOTIFICATIONS</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3"><input type="checkbox" checked={notifs.email} onChange={e => setNotifs({...notifs, email: e.target.checked})} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">Email notifications</span></label>
          <label className="flex items-center gap-3"><input type="checkbox" checked={notifs.sms} onChange={e => setNotifs({...notifs, sms: e.target.checked})} className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">SMS notifications</span></label>
        </div>
        <button onClick={() => alert('✅ Notification preferences saved!')} className="mt-4 px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d]">Save Preferences</button>
      </div>
    </div>
  )
}
