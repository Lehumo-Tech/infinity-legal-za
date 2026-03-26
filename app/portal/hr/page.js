'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ORG_CHART = [
  { dept: 'Executive Leadership', icon: '👔', roles: [
    { title: 'Managing Director', name: 'Tidimalo Tsatsi', status: 'active' },
    { title: 'Deputy Managing Director', name: 'Position Available', status: 'vacant' },
  ]},
  { dept: 'Legal Department', icon: '⚖️', roles: [
    { title: 'Senior Partners', count: '3-5', status: 'active' },
    { title: 'Associates', count: '8-12', status: 'active' },
    { title: 'Junior Attorneys', count: '5-8', status: 'active' },
    { title: 'Paralegals', count: '6-10', status: 'active' },
    { title: 'Legal Assistants', count: '4-6', status: 'active' },
  ]},
  { dept: 'Operations', icon: '🏢', roles: [
    { title: 'Operations Director', name: '', status: 'active' },
    { title: 'Office Manager', name: '', status: 'active' },
    { title: 'Administrative Staff', count: '3-5', status: 'active' },
  ]},
  { dept: 'Finance & Administration', icon: '💰', roles: [
    { title: 'Chief Financial Officer', name: '', status: 'active' },
    { title: 'Billing Specialists', count: '2-3', status: 'active' },
    { title: 'Payroll Administrator', name: '', status: 'active' },
  ]},
  { dept: 'Business Development', icon: '📈', roles: [
    { title: 'Marketing Director', name: '', status: 'active' },
    { title: 'Client Relations Managers', count: '2-3', status: 'active' },
  ]},
  { dept: 'IT & Technology', icon: '💻', roles: [
    { title: 'IT Director', name: '', status: 'active' },
    { title: 'Systems Administrators', count: '1-2', status: 'active' },
  ]},
  { dept: 'Human Resources', icon: '🤝', roles: [
    { title: 'HR Director', name: '', status: 'active' },
    { title: 'Recruitment Specialist', name: '', status: 'active' },
  ]},
]

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', days: 21, color: 'bg-blue-500' },
  { value: 'sick', label: 'Sick Leave', days: 30, color: 'bg-red-500' },
  { value: 'family', label: 'Family Responsibility', days: 3, color: 'bg-purple-500' },
  { value: 'study', label: 'Study Leave', days: 5, color: 'bg-amber-500' },
  { value: 'maternity', label: 'Maternity Leave', days: 120, color: 'bg-pink-500' },
  { value: 'paternity', label: 'Paternity Leave', days: 10, color: 'bg-cyan-500' },
  { value: 'unpaid', label: 'Unpaid Leave', days: 999, color: 'bg-gray-500' },
]

const LEAVE_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function HRPage() {
  const { profile, isHRStaff, isDirector, hasPermission } = useAuth()
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState('leave') // 'leave' | 'org' | 'directory'
  const [expandedDept, setExpandedDept] = useState(null)

  // Leave management state
  const [leaves, setLeaves] = useState([])
  const [balances, setBalances] = useState({})
  const [leaveLoading, setLeaveLoading] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState('all')

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'annual', startDate: '', endDate: '', reason: '',
  })

  // Staff directory from Supabase
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchLeaves = useCallback(async () => {
    if (!token) return
    setLeaveLoading(true)
    try {
      const res = await fetch('/api/hr/leave', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setLeaves(d.leaves || [])
        setBalances(d.balances || {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLeaveLoading(false)
    }
  }, [token])

  const fetchStaff = useCallback(async () => {
    if (!token) return
    setStaffLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, department, phone, is_active')
        .neq('role', 'client')
        .order('full_name')
      if (!error && data) setStaff(data)
    } catch (err) {
      console.error(err)
    } finally {
      setStaffLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchLeaves()
    fetchStaff()
  }, [fetchLeaves, fetchStaff])

  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const res = await fetch('/api/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(leaveForm),
      })
      if (res.ok) {
        setShowLeaveModal(false)
        setLeaveForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' })
        fetchLeaves()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleLeaveAction = async (id, action, rejectionReason) => {
    try {
      await fetch('/api/hr/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action, rejectionReason }),
      })
      fetchLeaves()
    } catch (err) {
      console.error(err)
    }
  }

  const canManageLeave = hasPermission('MANAGE_LEAVE')
  const filteredLeaves = leaveFilter === 'all' ? leaves : leaves.filter(l => l.status === leaveFilter)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Human Resources</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Leave management, staff directory, and organizational structure</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {['leave', 'org', 'directory'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === t ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
                {t === 'org' ? 'Org Chart' : t === 'directory' ? 'Staff' : 'Leave'}
              </button>
            ))}
          </div>
          {activeTab === 'leave' && (
            <button onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* LEAVE TAB */}
      {activeTab === 'leave' && (
        <>
          {/* Leave Balances */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Object.entries(balances).filter(([k]) => k !== 'unpaid').map(([type, bal]) => {
              const config = LEAVE_TYPES.find(t => t.value === type)
              const remaining = bal.total - bal.used - bal.pending
              return (
                <div key={type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config?.color || 'bg-gray-500'}`} />
                    <span className="text-xs font-bold text-infinity-navy dark:text-white">{config?.label || type}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-infinity-navy dark:text-white">{remaining}</div>
                      <div className="text-[10px] text-gray-400">days remaining</div>
                    </div>
                    <div className="text-right text-[10px] text-gray-400">
                      <div>{bal.used} used</div>
                      {bal.pending > 0 && <div className="text-amber-500">{bal.pending} pending</div>}
                      <div>of {bal.total} total</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${config?.color || 'bg-gray-500'}`} style={{ width: `${Math.min(100, ((bal.used + bal.pending) / bal.total) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leave Status Filter */}
          <div className="flex gap-2 mb-4">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setLeaveFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${leaveFilter === s ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && <span className="ml-1 opacity-60">({leaves.filter(l => l.status === s).length})</span>}
              </button>
            ))}
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {leaveLoading ? (
              <div className="p-8 text-center text-sm text-gray-400"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading...</div>
            ) : filteredLeaves.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-2">🏖️</div>
                <p className="text-sm text-gray-400">No leave requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      {canManageLeave && <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Employee</th>}
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Type</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Dates</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Days</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Reason</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Status</th>
                      {canManageLeave && <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredLeaves.map(l => {
                      const typeConfig = LEAVE_TYPES.find(t => t.value === l.leaveType)
                      return (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          {canManageLeave && <td className="px-4 py-2.5 font-medium text-infinity-navy dark:text-white">{l.requestedByName}</td>}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${typeConfig?.color || 'bg-gray-500'}`} />
                              <span className="text-infinity-navy dark:text-white">{typeConfig?.label || l.leaveType}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {new Date(l.startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} — {new Date(l.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-infinity-navy dark:text-white">{l.days}</td>
                          <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{l.reason || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${LEAVE_STATUS_COLORS[l.status] || ''}`}>
                              {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                            </span>
                          </td>
                          {canManageLeave && (
                            <td className="px-4 py-2.5 text-center">
                              {l.status === 'pending' && (
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => handleLeaveAction(l.id, 'approve')}
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-semibold hover:bg-green-200">Approve</button>
                                  <button onClick={() => handleLeaveAction(l.id, 'reject', 'Request declined')}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-semibold hover:bg-red-200">Reject</button>
                                </div>
                              )}
                              {l.status === 'approved' && l.approvedByName && (
                                <span className="text-[10px] text-gray-400">by {l.approvedByName}</span>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ORG CHART TAB */}
      {activeTab === 'org' && (
        <div className="space-y-3">
          {ORG_CHART.map((dept, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpandedDept(expandedDept === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{dept.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-display font-bold text-infinity-navy dark:text-white">{dept.dept}</div>
                    <div className="text-[10px] text-gray-400">{dept.roles.length} positions</div>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedDept === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {expandedDept === i && (
                <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-2 pt-3">
                    {dept.roles.map((role, j) => (
                      <div key={j} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div>
                          <div className="text-xs font-semibold text-infinity-navy dark:text-white">{role.title}</div>
                          {role.name && <div className="text-[10px] text-gray-400">{role.name}</div>}
                          {role.count && <div className="text-[10px] text-gray-400">Headcount: {role.count}</div>}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${role.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {role.status === 'active' ? 'Active' : 'Vacant'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* STAFF DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white">Staff Directory</h2>
          </div>
          {staffLoading ? (
            <div className="p-8 text-center text-sm text-gray-400"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading...</div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No staff members found</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <div className="w-9 h-9 bg-infinity-navy/10 dark:bg-infinity-gold/10 rounded-lg flex items-center justify-center text-sm font-bold text-infinity-navy dark:text-infinity-gold shrink-0">
                    {s.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-infinity-navy dark:text-white truncate">{s.full_name || 'Unknown'}</div>
                    <div className="text-[11px] text-gray-400 capitalize">{(s.role || 'staff').replace(/_/g, ' ')}{s.department ? ` • ${s.department}` : ''}</div>
                  </div>
                  {s.phone && <div className="text-xs text-gray-400 shrink-0">{s.phone}</div>}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${s.is_active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">Request Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmitLeave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Leave Type *</label>
                <select required value={leaveForm.leaveType} onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                  {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.days} days/yr)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date *</label>
                  <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Date *</label>
                  <input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
                <textarea rows={2} value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" placeholder="Brief reason for leave..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={createLoading}
                  className="flex-1 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {createLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
