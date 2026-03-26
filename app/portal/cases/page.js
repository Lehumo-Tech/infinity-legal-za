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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">
          {isOfficer ? 'Case Management' : 'Assigned Cases'}
        </h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
          {isOfficer ? 'Manage cases, add strategy notes, and oversee progress.' : 'View and work on your assigned cases.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'intake', 'active', 'matched', 'pending', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy'
                : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading cases...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">No cases found</div>
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
                        <div className="font-semibold text-sm text-infinity-navy dark:text-white">{c.case_number || 'Case'}</div>
                        <div className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5">
                          {c.case_type} • {c.case_subtype || 'General'}
                          {c.urgency === 'emergency' && <span className="ml-2 text-red-500 font-bold">⚠ EMERGENCY</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        c.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        c.status === 'intake' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-infinity-navy/40 dark:text-white/40 mt-2 line-clamp-2">{c.description}</p>}
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
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Type</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.case_type}</span></div>
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Status</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.status}</span></div>
                  <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Urgency</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.urgency}</span></div>
                  {selectedCase.court_date && <div className="flex justify-between"><span className="text-infinity-navy/50 dark:text-white/50">Court Date</span><span className="font-medium text-infinity-navy dark:text-white">{new Date(selectedCase.court_date).toLocaleDateString('en-ZA')}</span></div>}
                </div>
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
              <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Select a case to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
