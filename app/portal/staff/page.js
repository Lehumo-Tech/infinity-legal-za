'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaffManagementPage() {
  const { isManagingPartner, isITAdmin } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [token, setToken] = useState(null)
  const [newStaff, setNewStaff] = useState({
    email: '', password: '', fullName: '', phone: '', role: 'paralegal', barNumber: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchStaff = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      // Fetch all staff profiles (non-client roles)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'client')
        .order('created_at', { ascending: false })
      setStaff(data || [])
    } catch (err) {
      console.error('Fetch staff error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const res = await fetch('/api/auth/staff-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStaff),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Staff member ${newStaff.fullName} created successfully!`)
        setShowNewForm(false)
        setNewStaff({ email: '', password: '', fullName: '', phone: '', role: 'paralegal', barNumber: '' })
        fetchStaff()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const ROLE_BADGES = {
    managing_partner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    legal_officer: 'bg-infinity-navy/10 text-infinity-navy dark:bg-blue-900/30 dark:text-blue-400',
    attorney: 'bg-infinity-navy/10 text-infinity-navy dark:bg-blue-900/30 dark:text-blue-400',
    paralegal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    intake_agent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    admin: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    it_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const ROLE_LABELS = {
    managing_partner: 'Managing Partner',
    legal_officer: 'Legal Officer',
    attorney: 'Legal Officer',
    paralegal: 'Paralegal',
    intake_agent: 'Intake Agent',
    admin: 'Admin',
    it_admin: 'IT Admin',
  }

  if (!isManagingPartner && !isITAdmin) {
    return <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Access denied. Only Managing Partners and IT Admins can manage staff.</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Staff Management</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Onboard and manage team members.</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="px-4 py-2 bg-infinity-navy text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy-light transition-colors">
          + Onboard Staff
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.startsWith('Error') ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {message}
        </div>
      )}

      {/* New Staff Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-4">Onboard New Staff Member</h3>
          <form onSubmit={handleCreateStaff} className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Full Name *" required value={newStaff.fullName} onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <input placeholder="Email *" required type="email" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <input placeholder="Password *" required type="password" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <input placeholder="Phone" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <select required value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
              <option value="legal_officer">Legal Officer</option>
              <option value="paralegal">Paralegal</option>
              <option value="intake_agent">Intake Specialist</option>
              <option value="admin">Administrator</option>
              <option value="it_admin">IT Admin</option>
              <option value="managing_partner">Managing Partner</option>
            </select>
            {newStaff.role === 'legal_officer' && (
              <input placeholder="Bar Number / LPC Number *" required value={newStaff.barNumber} onChange={(e) => setNewStaff({...newStaff, barNumber: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            )}
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-sm font-semibold hover:bg-infinity-navy-light disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Staff Account'}
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">No staff members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Joined</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50">
                    <td className="px-4 py-3 font-semibold text-infinity-navy dark:text-white">{s.full_name}</td>
                    <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_BADGES[s.role] || ''}`}>
                        {ROLE_LABELS[s.role] || s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60 capitalize">{s.department || '-'}</td>
                    <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs">{new Date(s.created_at).toLocaleDateString('en-ZA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
