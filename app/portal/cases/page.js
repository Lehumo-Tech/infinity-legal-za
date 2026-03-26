'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function PortalCasesPage() {
  const { profile, role, isOfficer, isParalegal, isManagingPartner } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)
  const [privilegedNotes, setPrivilegedNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)
  const [newCase, setNewCase] = useState({
    title: '',
    case_type: 'civil',
    case_subtype: '',
    description: '',
    urgency: 'medium',
    court_date: '',
    court_location: '',
    client_email: '',
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchCases = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/cases${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setCases(data.cases || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchCases() }, [fetchCases])

  // Fetch privileged notes for a case (Officer only)
  const fetchPrivilegedNotes = async (caseId) => {
    setNotesLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/privileged-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setPrivilegedNotes(data.notes || [])
      } else {
        setPrivilegedNotes([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setNotesLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCase) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/privileged-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newNote, isStrategy: true }),
      })
      setNewNote('')
      fetchPrivilegedNotes(selectedCase.id)
    } catch (err) {
      console.error(err)
    }
  }

  const selectCase = (c) => {
    setSelectedCase(c)
    if (isOfficer) {
      fetchPrivilegedNotes(c.id)
    }
  }

  const handleCreateCase = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess(false)

    try {
      const payload = {
        title: newCase.title || newCase.case_subtype || 'New Case',
        case_type: newCase.case_type,
        case_subtype: newCase.case_subtype,
        description: newCase.description,
        urgency: newCase.urgency,
        court_date: newCase.court_date || null,
        court_location: newCase.court_location || null,
      }

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create case')
      }

      setCreateSuccess(true)
      setNewCase({
        title: '',
        case_type: 'civil',
        case_subtype: '',
        description: '',
        urgency: 'medium',
        court_date: '',
        court_location: '',
        client_email: '',
      })

      // Refresh case list and close modal after a moment
      setTimeout(() => {
        setShowCreateModal(false)
        setCreateSuccess(false)
        fetchCases()
      }, 1500)
    } catch (err) {
      console.error('Case creation error:', err)
      setCreateError(err.message || 'Failed to create case')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdateStatus = async (caseId, newStatus) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: caseId, status: newStatus }),
      })
      if (res.ok) {
        fetchCases()
        if (selectedCase?.id === caseId) {
          setSelectedCase(prev => ({ ...prev, status: newStatus }))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const caseTypeOptions = [
    { value: 'family', label: 'Family Law' },
    { value: 'criminal', label: 'Criminal Law' },
    { value: 'civil', label: 'Civil Litigation' },
    { value: 'labour', label: 'Labour Law' },
    { value: 'commercial', label: 'Commercial Law' },
    { value: 'property', label: 'Property Law' },
    { value: 'immigration', label: 'Immigration' },
    { value: 'personal_injury', label: 'Personal Injury' },
    { value: 'other', label: 'Other' },
  ]

  const urgencyOptions = [
    { value: 'low', label: 'Low', color: 'text-blue-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'emergency', label: 'Emergency', color: 'text-red-600' },
  ]

  const statusOptions = ['intake', 'active', 'under_review', 'pending', 'resolved', 'closed']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">
            {isOfficer ? 'Case Management' : 'Assigned Cases'}
          </h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            {isOfficer ? 'Manage cases, add strategy notes, and oversee progress.' : 'View and work on your assigned cases.'}
          </p>
        </div>

        {/* Create Case Button - Officers and Managing Partners */}
        {(isOfficer || isManagingPartner) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'intake', 'active', 'under_review', 'pending', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy'
                : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700'
            }`}
          >
            {s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">
                <div className="w-6 h-6 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading cases...
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📁</div>
                <p className="text-infinity-navy/40 dark:text-white/40 text-sm">No cases found</p>
                {(isOfficer || isManagingPartner) && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 text-sm text-infinity-gold font-semibold hover:underline"
                  >
                    + Create your first case
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-infinity-navy/5 dark:divide-gray-700/50">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectCase(c)}
                    className={`p-4 cursor-pointer hover:bg-infinity-cream/50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedCase?.id === c.id ? 'bg-infinity-cream dark:bg-gray-700 border-l-4 border-l-infinity-gold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-infinity-navy dark:text-white">
                          {c.case_number || 'Case'}
                          {c.title && c.title !== 'Untitled Case' && (
                            <span className="ml-2 font-normal text-infinity-navy/60 dark:text-white/60">— {c.title}</span>
                          )}
                        </div>
                        <div className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5">
                          {c.case_type} • {c.case_subtype || 'General'}
                          {c.urgency === 'emergency' && <span className="ml-2 text-red-500 font-bold">⚠ EMERGENCY</span>}
                          {c.urgency === 'high' && <span className="ml-2 text-orange-500 font-bold">↑ HIGH</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        c.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        c.status === 'intake' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        c.status === 'under_review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        c.status === 'closed' ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {c.status === 'under_review' ? 'Under Review' : c.status}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-infinity-navy/40 dark:text-white/40 mt-2 line-clamp-2">{c.description}</p>}
                    {c.court_date && (
                      <div className="text-xs text-infinity-navy/40 dark:text-white/40 mt-1">
                        📅 Court: {new Date(c.court_date).toLocaleDateString('en-ZA')}
                        {c.court_location && ` • ${c.court_location}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Case Details / Privileged Notes Panel */}
        <div className="lg:col-span-1">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Case Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-3">{selectedCase.case_number}</h3>
                <div className="space-y-2 text-sm">
                  {selectedCase.title && selectedCase.title !== 'Untitled Case' && (
                    <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Title</span><span className="font-medium text-infinity-navy dark:text-white">{selectedCase.title}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Type</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.case_type}</span></div>
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Status</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.status === 'under_review' ? 'Under Review' : selectedCase.status}</span></div>
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Urgency</span><span className={`font-medium capitalize ${
                    selectedCase.urgency === 'emergency' ? 'text-red-600' :
                    selectedCase.urgency === 'high' ? 'text-orange-600' :
                    selectedCase.urgency === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>{selectedCase.urgency}</span></div>
                  {selectedCase.court_date && <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Court Date</span><span className="font-medium text-infinity-navy dark:text-white">{new Date(selectedCase.court_date).toLocaleDateString('en-ZA')}</span></div>}
                  {selectedCase.court_location && <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Court</span><span className="font-medium text-infinity-navy dark:text-white">{selectedCase.court_location}</span></div>}
                </div>

                {/* Status Update (Officer Only) */}
                {isOfficer && (
                  <div className="mt-4 pt-3 border-t border-infinity-navy/10 dark:border-gray-700">
                    <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Update Status</label>
                    <select
                      value={selectedCase.status}
                      onChange={(e) => handleUpdateStatus(selectedCase.id, e.target.value)}
                      className="w-full px-3 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Privileged Notes — OFFICER ONLY */}
              {isOfficer && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-red-500">🔒</span>
                    <h3 className="font-display font-semibold text-red-700 dark:text-red-400 text-sm">Privileged Strategy Notes</h3>
                  </div>
                  <p className="text-xs text-red-500/60 dark:text-red-400/60 mb-3">Only Legal Officers and Managing Partners can view these notes. Protected by attorney-client privilege.</p>

                  {notesLoading ? (
                    <div className="text-xs text-infinity-navy/40 dark:text-white/40">Loading notes...</div>
                  ) : privilegedNotes.length === 0 ? (
                    <div className="text-xs text-infinity-navy/40 dark:text-white/40 mb-3">No strategy notes yet.</div>
                  ) : (
                    <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                      {privilegedNotes.map((n) => (
                        <div key={n.id} className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                          <p className="text-xs text-infinity-navy dark:text-white">{n.content}</p>
                          <div className="text-[10px] text-infinity-navy/40 dark:text-white/40 mt-1">
                            {n.author?.full_name || 'Officer'} • {new Date(n.created_at).toLocaleString('en-ZA')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add strategy note..."
                      className="flex-1 px-2 py-1.5 border border-red-200 dark:border-red-800/30 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }}
                    />
                    <button onClick={handleAddNote} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Paralegal Notice */}
              {isParalegal && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">🔒 Privileged Notes:</span> Strategy notes for this case are visible only to the assigned Legal Officer. This is enforced to protect attorney-client privilege.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Select a case to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-infinity-navy/10 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-infinity-navy/10 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white">Create New Case</h2>
                <p className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5">Fill in the details to open a new case</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); setCreateSuccess(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-infinity-navy/5 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-infinity-navy/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {createSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-infinity-navy dark:text-white mb-1">Case Created!</h3>
                  <p className="text-sm text-infinity-navy/50 dark:text-white/50">The case has been opened and assigned a case number.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateCase} className="space-y-4">
                  {createError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm">
                      {createError}
                    </div>
                  )}

                  {/* Case Title */}
                  <div>
                    <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Case Title</label>
                    <input
                      type="text"
                      required
                      value={newCase.title}
                      onChange={(e) => setNewCase(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                      placeholder="e.g. Smith v. Jones - Property Dispute"
                    />
                  </div>

                  {/* Case Type & Subtype */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Case Type</label>
                      <select
                        value={newCase.case_type}
                        onChange={(e) => setNewCase(prev => ({ ...prev, case_type: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                      >
                        {caseTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Sub-Type</label>
                      <input
                        type="text"
                        value={newCase.case_subtype}
                        onChange={(e) => setNewCase(prev => ({ ...prev, case_subtype: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                        placeholder="e.g. Divorce, Eviction"
                      />
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Urgency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {urgencyOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewCase(prev => ({ ...prev, urgency: opt.value }))}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            newCase.urgency === opt.value
                              ? opt.value === 'emergency' ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 ring-2 ring-red-300'
                                : opt.value === 'high' ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400 ring-2 ring-orange-300'
                                : opt.value === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-300'
                                : 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400 ring-2 ring-blue-300'
                              : 'bg-white dark:bg-gray-700 border-infinity-navy/10 dark:border-gray-600 text-infinity-navy/60 dark:text-white/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Description / Summary</label>
                    <textarea
                      rows={3}
                      value={newCase.description}
                      onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold resize-none"
                      placeholder="Brief description of the case and key facts..."
                    />
                  </div>

                  {/* Court Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Court Date <span className="font-normal text-infinity-navy/40">(Optional)</span></label>
                      <input
                        type="date"
                        value={newCase.court_date}
                        onChange={(e) => setNewCase(prev => ({ ...prev, court_date: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-infinity-navy/70 dark:text-white/70 mb-1.5">Court Location <span className="font-normal text-infinity-navy/40">(Optional)</span></label>
                      <input
                        type="text"
                        value={newCase.court_location}
                        onChange={(e) => setNewCase(prev => ({ ...prev, court_location: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                        placeholder="e.g. Johannesburg High Court"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowCreateModal(false); setCreateError('') }}
                      className="flex-1 py-2.5 bg-infinity-navy/5 dark:bg-white/5 text-infinity-navy dark:text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy/10 dark:hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="flex-1 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      {createLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Creating...
                        </span>
                      ) : 'Create Case'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
