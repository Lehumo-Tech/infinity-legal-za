'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ROLE_BADGES = {
  managing_partner: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Managing Partner', icon: '👑' },
  legal_officer: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Legal Officer', icon: '⚖️' },
  attorney: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Legal Officer', icon: '⚖️' },
  paralegal: { bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', label: 'Paralegal', icon: '📝' },
  intake_agent: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Intake Agent', icon: '📞' },
  admin: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300', label: 'Admin', icon: '⚙️' },
  it_admin: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'IT Admin', icon: '🖥️' },
}

const DEPT_LABELS = {
  executive: 'Executive',
  legal: 'Legal',
  call_center: 'Call Center',
  operations: 'Operations',
  it: 'IT',
}

export default function StaffManagementPage() {
  const { isManagingPartner, isITAdmin } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [token, setToken] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [newStaff, setNewStaff] = useState({
    email: '', password: '', fullName: '', phone: '', role: 'paralegal', barNumber: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

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
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/auth/staff-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStaff),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: `${newStaff.fullName} has been onboarded successfully as ${ROLE_BADGES[newStaff.role]?.label || newStaff.role}!`, type: 'success' })
        setShowModal(false)
        setNewStaff({ email: '', password: '', fullName: '', phone: '', role: 'paralegal', barNumber: '' })
        fetchStaff()
      } else {
        setMessage({ text: data.error, type: 'error' })
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // Team composition stats
  const teamStats = {
    total: staff.length,
    officers: staff.filter(s => s.role === 'legal_officer' || s.role === 'attorney').length,
    paralegals: staff.filter(s => s.role === 'paralegal').length,
    intake: staff.filter(s => s.role === 'intake_agent').length,
    other: staff.filter(s => !['legal_officer', 'attorney', 'paralegal', 'intake_agent'].includes(s.role)).length,
  }

  // Filtered staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = !search || 
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (!isManagingPartner && !isITAdmin) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Access Restricted</h2>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm">Only Managing Partners and IT Admins can manage staff.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Staff Management</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Onboard, manage, and oversee your legal team.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Onboard Staff
        </button>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-3 ${
          message.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
            : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
        }`}>
          <span className="text-lg">{message.type === 'error' ? '❌' : '✅'}</span>
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Team Composition Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Staff', value: teamStats.total, icon: '👥', color: 'bg-infinity-navy/5 dark:bg-white/5 text-infinity-navy dark:text-white' },
          { label: 'Legal Officers', value: teamStats.officers, icon: '⚖️', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
          { label: 'Paralegals', value: teamStats.paralegals, icon: '📝', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' },
          { label: 'Intake Agents', value: teamStats.intake, icon: '📞', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
          { label: 'Admin / IT', value: teamStats.other, icon: '⚙️', color: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 ${stat.color} border border-current/10`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-2xl font-display font-bold">{loading ? '-' : stat.value}</span>
            </div>
            <div className="text-xs font-semibold opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-infinity-navy/30 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white placeholder:text-infinity-navy/30 dark:placeholder:text-white/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="legal_officer">Legal Officers</option>
          <option value="paralegal">Paralegals</option>
          <option value="intake_agent">Intake Agents</option>
          <option value="admin">Admins</option>
          <option value="it_admin">IT Admins</option>
          <option value="managing_partner">Managing Partners</option>
        </select>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Loading staff directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-infinity-navy/40 dark:text-white/40 text-sm">
              {search || roleFilter ? 'No staff match your filters.' : 'No staff members found. Click "Onboard Staff" to add your first team member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Team Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => {
                  const badge = ROLE_BADGES[s.role] || { bg: 'bg-gray-100 text-gray-600', label: s.role, icon: '👤' }
                  return (
                    <tr key={s.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50 hover:bg-infinity-cream/30 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            s.role === 'managing_partner' ? 'bg-purple-500' :
                            s.role === 'legal_officer' || s.role === 'attorney' ? 'bg-infinity-navy' :
                            s.role === 'paralegal' ? 'bg-teal-600' :
                            s.role === 'intake_agent' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}>
                            {s.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-infinity-navy dark:text-white">{s.full_name}</div>
                            <div className="text-xs text-infinity-navy/40 dark:text-white/40">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg}`}>
                          <span>{badge.icon}</span> {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60 text-sm capitalize">
                        {DEPT_LABELS[s.department] || s.department || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.is_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {s.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs">
                        {s.hire_date ? new Date(s.hire_date).toLocaleDateString('en-ZA') : s.created_at ? new Date(s.created_at).toLocaleDateString('en-ZA') : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && filteredStaff.length > 0 && (
        <div className="mt-3 text-xs text-infinity-navy/40 dark:text-white/40 text-right">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      )}

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-infinity-navy/10 dark:border-gray-700">
              <div>
                <h3 className="font-display font-bold text-lg text-infinity-navy dark:text-white">Onboard New Staff</h3>
                <p className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5">Create a new team member account</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-infinity-navy/5 dark:bg-white/5 flex items-center justify-center text-infinity-navy/40 dark:text-white/40 hover:bg-infinity-navy/10 dark:hover:bg-white/10 transition-colors">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Full Name *</label>
                  <input
                    placeholder="e.g. Thabo Molefe"
                    required
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})}
                    className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Email Address *</label>
                  <input
                    placeholder="thabo@infinitylegal.co.za"
                    required
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Temporary Password *</label>
                  <input
                    placeholder="Min 8 characters"
                    required
                    type="password"
                    minLength={8}
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Phone Number</label>
                  <input
                    placeholder="072 456 7890"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Role *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'legal_officer', label: 'Legal Officer', icon: '⚖️', desc: 'Licensed attorney' },
                    { value: 'paralegal', label: 'Paralegal', icon: '📝', desc: 'Legal support' },
                    { value: 'intake_agent', label: 'Intake Agent', icon: '📞', desc: 'Call center' },
                    { value: 'admin', label: 'Admin', icon: '⚙️', desc: 'Operations' },
                    { value: 'it_admin', label: 'IT Admin', icon: '🖥️', desc: 'Tech support' },
                    { value: 'managing_partner', label: 'Partner', icon: '👑', desc: 'Full access' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setNewStaff({...newStaff, role: r.value})}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        newStaff.role === r.value
                          ? 'border-infinity-gold bg-infinity-gold/5 dark:bg-infinity-gold/10'
                          : 'border-infinity-navy/10 dark:border-gray-600 hover:border-infinity-navy/20 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{r.icon}</div>
                      <div className="text-xs font-semibold text-infinity-navy dark:text-white">{r.label}</div>
                      <div className="text-[10px] text-infinity-navy/40 dark:text-white/40">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {newStaff.role === 'legal_officer' && (
                <div>
                  <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Bar Number / LPC Number *</label>
                  <input
                    placeholder="Required for Legal Officers"
                    required
                    value={newStaff.barNumber}
                    onChange={(e) => setNewStaff({...newStaff, barNumber: e.target.value})}
                    className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold focus:border-transparent"
                  />
                </div>
              )}

              {/* Info banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note:</strong> The new team member will receive a welcome email and notification. They can log in immediately with the credentials you set.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : 'Create Staff Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
