'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// SA Prescription Periods
const SA_PRESCRIPTION_PERIODS = {
  'general': { months: 36, label: 'General (3 years)' },
  'debt': { months: 36, label: 'Debt (3 years)' },
  'delict': { months: 36, label: 'Delict / Personal Injury (3 years)' },
  'defamation': { months: 12, label: 'Defamation (1 year)' },
  'labour_ccma': { months: 6, label: 'Labour - CCMA Referral (6 months)' },
  'labour_unfair_dismissal': { months: 12, label: 'Labour - Unfair Dismissal (12 months)' },
  'property': { months: 360, label: 'Property / Land (30 years)' },
  'tax': { months: 36, label: 'Tax Disputes (3 years)' },
  'insurance': { months: 24, label: 'Insurance Claims (2 years)' },
  'divorce': { months: 36, label: 'Divorce Proceedings (3 years)' },
  'maintenance': { months: 36, label: 'Maintenance (3 years)' },
  'criminal_assault': { months: 240, label: 'Criminal - Assault (20 years)' },
  'criminal_murder': { months: 0, label: 'Criminal - Murder (No prescription)' },
  'custom': { months: 0, label: 'Custom Period' },
}

function PrescriptionBadge({ metadata }) {
  if (!metadata?.prescription?.expiryDate) return null
  const p = metadata.prescription
  const days = p.daysRemaining

  if (p.type === 'criminal_murder') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">No Prescription</span>
  }
  if (p.isExpired) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse">PRESCRIBED ({Math.abs(days)}d overdue)</span>
  }
  if (p.isUrgent) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{days}d remaining</span>
  }
  if (p.isWarning) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{days}d remaining</span>
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{days}d remaining</span>
}

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
  const [activeTab, setActiveTab] = useState('details')
  const [caseMetadata, setCaseMetadata] = useState(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [caseMetadataMap, setCaseMetadataMap] = useState({})

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    type: 'general',
    startDate: '',
    customMonths: '',
    notes: '',
  })
  const [resourceForm, setResourceForm] = useState({
    estimatedHours: '',
    budgetAllocated: '',
    hourlyRate: '',
    notes: '',
  })
  const [timeEntryForm, setTimeEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
  })
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '' })

  const [newCase, setNewCase] = useState({
    title: '',
    case_type: 'civil',
    case_subtype: '',
    description: '',
    urgency: 'medium',
    court_date: '',
    court_location: '',
    prescription_type: 'general',
    prescription_start: '',
    prescription_custom_months: '',
    estimated_hours: '',
    budget_allocated: '',
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

  // Fetch metadata for all cases (for prescription badges)
  useEffect(() => {
    if (!token || cases.length === 0) return
    const fetchAllMetadata = async () => {
      const map = {}
      await Promise.all(cases.map(async (c) => {
        try {
          const res = await fetch(`/api/cases/${c.id}/metadata`, { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json()
            map[c.id] = data.metadata
          }
        } catch { /* ignore */ }
      }))
      setCaseMetadataMap(map)
    }
    fetchAllMetadata()
  }, [token, cases])

  const fetchCaseMetadata = async (caseId) => {
    setMetadataLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/metadata`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCaseMetadata(data.metadata)
        // Pre-fill forms
        if (data.metadata?.prescription) {
          setPrescriptionForm({
            type: data.metadata.prescription.type || 'general',
            startDate: data.metadata.prescription.startDate || '',
            customMonths: data.metadata.prescription.customMonths || '',
            notes: data.metadata.prescription.notes || '',
          })
        }
        if (data.metadata?.resources) {
          setResourceForm({
            estimatedHours: data.metadata.resources.estimatedHours || '',
            budgetAllocated: data.metadata.resources.budgetAllocated || '',
            hourlyRate: data.metadata.resources.hourlyRate || '',
            notes: data.metadata.resources.notes || '',
          })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setMetadataLoading(false)
    }
  }

  const fetchPrivilegedNotes = async (caseId) => {
    setNotesLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/privileged-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setPrivilegedNotes(data.notes || [])
      else setPrivilegedNotes([])
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
    setActiveTab('details')
    setCaseMetadata(null)
    fetchCaseMetadata(c.id)
    if (isOfficer) fetchPrivilegedNotes(c.id)
  }

  const savePrescription = async () => {
    if (!selectedCase) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prescription: prescriptionForm }),
      })
      fetchCaseMetadata(selectedCase.id)
    } catch (err) {
      console.error(err)
    }
  }

  const saveResources = async () => {
    if (!selectedCase) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resources: resourceForm }),
      })
      fetchCaseMetadata(selectedCase.id)
    } catch (err) {
      console.error(err)
    }
  }

  const addTimeEntry = async () => {
    if (!selectedCase || !timeEntryForm.hours) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timeEntry: timeEntryForm }),
      })
      setTimeEntryForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' })
      fetchCaseMetadata(selectedCase.id)
    } catch (err) {
      console.error(err)
    }
  }

  const addMilestone = async () => {
    if (!selectedCase || !milestoneForm.title) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ milestone: milestoneForm }),
      })
      setMilestoneForm({ title: '', dueDate: '' })
      fetchCaseMetadata(selectedCase.id)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleMilestone = async (milestoneId, completed) => {
    if (!selectedCase) return
    try {
      await fetch(`/api/cases/${selectedCase.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ milestoneId, completed }),
      })
      fetchCaseMetadata(selectedCase.id)
    } catch (err) {
      console.error(err)
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create case')

      // Save prescription & resources metadata
      const caseId = data.case?.id
      if (caseId) {
        // Save prescription if start date provided
        if (newCase.prescription_start) {
          await fetch(`/api/cases/${caseId}/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              prescription: {
                type: newCase.prescription_type,
                startDate: newCase.prescription_start,
                customMonths: newCase.prescription_custom_months,
              },
              resources: {
                estimatedHours: parseFloat(newCase.estimated_hours) || 0,
                budgetAllocated: parseFloat(newCase.budget_allocated) || 0,
              },
            }),
          })
        }
      }

      setCreateSuccess(true)
      setNewCase({
        title: '', case_type: 'civil', case_subtype: '', description: '', urgency: 'medium',
        court_date: '', court_location: '', prescription_type: 'general', prescription_start: '',
        prescription_custom_months: '', estimated_hours: '', budget_allocated: '',
      })

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: caseId, status: newStatus }),
      })
      if (res.ok) {
        fetchCases()
        if (selectedCase?.id === caseId) setSelectedCase(prev => ({ ...prev, status: newStatus }))
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
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'emergency', label: 'Emergency' },
  ]

  const statusOptions = ['intake', 'active', 'under_review', 'pending', 'resolved', 'closed']

  const prescriptionOptions = Object.entries(SA_PRESCRIPTION_PERIODS).map(([key, val]) => ({
    value: key, label: val.label,
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">
            {isOfficer ? 'Case Management' : 'Assigned Cases'}
          </h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            {isOfficer ? 'Manage cases, prescription periods, time and resources.' : 'View and work on your assigned cases.'}
          </p>
        </div>
        {(isOfficer || isManagingPartner) && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'intake', 'active', 'under_review', 'pending', 'resolved', 'closed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700'}`}>
            {s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden max-h-[75vh] overflow-y-auto">
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
                  <button onClick={() => setShowCreateModal(true)} className="mt-3 text-sm text-infinity-gold font-semibold hover:underline">+ Create your first case</button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-infinity-navy/5 dark:divide-gray-700/50">
                {cases.map((c) => (
                  <div key={c.id} onClick={() => selectCase(c)}
                    className={`p-4 cursor-pointer hover:bg-infinity-cream/50 dark:hover:bg-gray-700/50 transition-colors ${selectedCase?.id === c.id ? 'bg-infinity-cream dark:bg-gray-700 border-l-4 border-l-infinity-gold' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-infinity-navy dark:text-white truncate">{c.case_number || 'Case'}</div>
                        <div className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5 truncate">
                          {c.case_type} • {c.case_subtype || 'General'}
                          {c.urgency === 'emergency' && <span className="ml-1 text-red-500 font-bold">⚠</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          c.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          c.status === 'intake' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}>{c.status}</span>
                        <PrescriptionBadge metadata={caseMetadataMap[c.id]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Case Details Panel */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-1 flex gap-1">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'prescription', label: '⏱ Prescription' },
                  { id: 'resources', label: '💰 Resources & Time' },
                  { id: 'milestones', label: '📌 Milestones' },
                  ...(isOfficer ? [{ id: 'strategy', label: '🔒 Strategy' }] : []),
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === tab.id ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-infinity-navy/60 dark:text-white/60 hover:bg-infinity-navy/5 dark:hover:bg-white/5'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                  <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-4">{selectedCase.case_number}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Type</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.case_type}</span></div>
                    <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Sub-Type</span><span className="font-medium text-infinity-navy dark:text-white">{selectedCase.case_subtype || '—'}</span></div>
                    <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Status</span><span className="font-medium text-infinity-navy dark:text-white capitalize">{selectedCase.status}</span></div>
                    <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Urgency</span><span className={`font-medium capitalize ${selectedCase.urgency === 'emergency' ? 'text-red-600' : selectedCase.urgency === 'high' ? 'text-orange-600' : 'text-infinity-navy dark:text-white'}`}>{selectedCase.urgency}</span></div>
                    {selectedCase.court_date && <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Court Date</span><span className="font-medium text-infinity-navy dark:text-white">{new Date(selectedCase.court_date).toLocaleDateString('en-ZA')}</span></div>}
                    {selectedCase.court_location && <div><span className="text-infinity-navy/50 dark:text-white/50 block text-xs mb-0.5">Court Location</span><span className="font-medium text-infinity-navy dark:text-white">{selectedCase.court_location}</span></div>}
                  </div>
                  {selectedCase.description && <p className="text-sm text-infinity-navy/60 dark:text-white/60 mt-4 p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg">{selectedCase.description}</p>}

                  {/* Prescription Summary */}
                  {caseMetadata?.prescription?.expiryDate && (
                    <div className={`mt-4 p-3 rounded-lg border ${caseMetadata.prescription.isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : caseMetadata.prescription.isUrgent ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">{caseMetadata.prescription.isExpired ? '⚠️ PRESCRIPTION EXPIRED' : '⏱ Prescription Period'}</div>
                        <PrescriptionBadge metadata={caseMetadata} />
                      </div>
                      <div className="text-xs mt-1 opacity-70">{caseMetadata.prescription.typeLabel} • Expires: {new Date(caseMetadata.prescription.expiryDate).toLocaleDateString('en-ZA')}</div>
                    </div>
                  )}

                  {isOfficer && (
                    <div className="mt-4 pt-3 border-t border-infinity-navy/10 dark:border-gray-700">
                      <label className="block text-xs font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Update Status</label>
                      <select value={selectedCase.status} onChange={(e) => handleUpdateStatus(selectedCase.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                        {statusOptions.map(s => (<option key={s} value={s}>{s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* PRESCRIPTION TAB */}
              {activeTab === 'prescription' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                  <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-1">Prescription Period</h3>
                  <p className="text-xs text-infinity-navy/50 dark:text-white/50 mb-4">Set the statutory time limit for this case under South African law.</p>

                  {metadataLoading ? (
                    <div className="text-center py-6 text-sm text-infinity-navy/40">Loading...</div>
                  ) : (
                    <>
                      {/* Current Prescription Display */}
                      {caseMetadata?.prescription?.expiryDate && (
                        <div className={`mb-5 p-4 rounded-xl border-2 ${caseMetadata.prescription.isExpired ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : caseMetadata.prescription.isUrgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700' : 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-infinity-navy dark:text-white">{caseMetadata.prescription.isExpired ? '⚠️ PRESCRIPTION EXPIRED' : '⏱ Active Prescription'}</span>
                            <PrescriptionBadge metadata={caseMetadata} />
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="opacity-60">Type:</span> <span className="font-medium">{caseMetadata.prescription.typeLabel}</span></div>
                            <div><span className="opacity-60">Start:</span> <span className="font-medium">{new Date(caseMetadata.prescription.startDate).toLocaleDateString('en-ZA')}</span></div>
                            <div><span className="opacity-60">Expires:</span> <span className="font-medium">{new Date(caseMetadata.prescription.expiryDate).toLocaleDateString('en-ZA')}</span></div>
                            <div><span className="opacity-60">Set by:</span> <span className="font-medium">{caseMetadata.prescription.setBy}</span></div>
                          </div>
                          {caseMetadata.prescription.notes && <p className="text-xs mt-2 opacity-70 italic">{caseMetadata.prescription.notes}</p>}

                          {/* Visual Timeline */}
                          {!caseMetadata.prescription.isExpired && caseMetadata.prescription.daysRemaining > 0 && (
                            <div className="mt-3">
                              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                {(() => {
                                  const start = new Date(caseMetadata.prescription.startDate)
                                  const end = new Date(caseMetadata.prescription.expiryDate)
                                  const total = (end - start) / (1000 * 60 * 60 * 24)
                                  const elapsed = total - caseMetadata.prescription.daysRemaining
                                  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
                                  return <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                                })()}
                              </div>
                              <div className="flex justify-between text-[10px] opacity-50 mt-1">
                                <span>Start</span>
                                <span>Expiry</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Set/Update Prescription Form */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Prescription Type</label>
                          <select value={prescriptionForm.type} onChange={(e) => setPrescriptionForm(p => ({ ...p, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                            {prescriptionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        {prescriptionForm.type === 'custom' && (
                          <div>
                            <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Custom Period (months)</label>
                            <input type="number" value={prescriptionForm.customMonths} onChange={(e) => setPrescriptionForm(p => ({ ...p, customMonths: e.target.value }))}
                              className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. 24" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Cause of Action Date (Start)</label>
                          <input type="date" value={prescriptionForm.startDate} onChange={(e) => setPrescriptionForm(p => ({ ...p, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Notes</label>
                          <textarea rows={2} value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" placeholder="Any relevant notes about the prescription period..." />
                        </div>
                        <button onClick={savePrescription}
                          className="w-full py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
                          {caseMetadata?.prescription ? 'Update Prescription' : 'Set Prescription'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* RESOURCES & TIME TAB */}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  {/* Resource Allocation */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-3">💰 Resource Allocation</h3>
                    {caseMetadata?.resources?.estimatedHours > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-infinity-navy dark:text-white">{caseMetadata.resources.estimatedHours}h</div>
                          <div className="text-[10px] text-infinity-navy/50 dark:text-white/50">Est. Hours</div>
                        </div>
                        <div className="p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-infinity-navy dark:text-white">{caseMetadata.resources.hoursUsed || 0}h</div>
                          <div className="text-[10px] text-infinity-navy/50 dark:text-white/50">Hours Used</div>
                        </div>
                        <div className="p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-infinity-navy dark:text-white">R{(caseMetadata.resources.budgetAllocated || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-infinity-navy/50 dark:text-white/50">Budget</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Est. Hours</label>
                        <input type="number" value={resourceForm.estimatedHours} onChange={(e) => setResourceForm(r => ({ ...r, estimatedHours: e.target.value }))}
                          className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="40" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Budget (ZAR)</label>
                        <input type="number" value={resourceForm.budgetAllocated} onChange={(e) => setResourceForm(r => ({ ...r, budgetAllocated: e.target.value }))}
                          className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="50000" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Hourly Rate</label>
                        <input type="number" value={resourceForm.hourlyRate} onChange={(e) => setResourceForm(r => ({ ...r, hourlyRate: e.target.value }))}
                          className="w-full px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="1500" />
                      </div>
                    </div>
                    <button onClick={saveResources}
                      className="mt-3 w-full py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
                      Save Resources
                    </button>
                  </div>

                  {/* Time Entries */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-3">🕐 Time Tracking</h3>
                    {caseMetadata?.timeEntries?.length > 0 && (
                      <div className="mb-4 max-h-40 overflow-y-auto space-y-1">
                        {caseMetadata.timeEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-2 bg-infinity-cream/30 dark:bg-gray-700/30 rounded-lg text-xs">
                            <div>
                              <span className="font-semibold text-infinity-navy dark:text-white">{entry.hours}h</span>
                              <span className="ml-2 text-infinity-navy/50 dark:text-white/50">{entry.description || 'No description'}</span>
                            </div>
                            <div className="text-infinity-navy/40 dark:text-white/40">{entry.attorney} • {entry.date}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      <input type="date" value={timeEntryForm.date} onChange={(e) => setTimeEntryForm(t => ({ ...t, date: e.target.value }))}
                        className="px-2 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                      <input type="number" step="0.5" value={timeEntryForm.hours} onChange={(e) => setTimeEntryForm(t => ({ ...t, hours: e.target.value }))}
                        className="px-2 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Hours" />
                      <input type="text" value={timeEntryForm.description} onChange={(e) => setTimeEntryForm(t => ({ ...t, description: e.target.value }))}
                        className="px-2 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Description" />
                      <button onClick={addTimeEntry} className="px-3 py-1.5 bg-infinity-gold text-infinity-navy rounded-lg text-xs font-semibold hover:bg-infinity-gold/80">Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* MILESTONES TAB */}
              {activeTab === 'milestones' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                  <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-3">📌 Case Milestones</h3>
                  {caseMetadata?.milestones?.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {caseMetadata.milestones.map((ms) => (
                        <div key={ms.id} className={`flex items-center gap-3 p-3 rounded-lg border ${ms.completed ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30' : 'bg-white border-infinity-navy/10 dark:bg-gray-700/50 dark:border-gray-600'}`}>
                          <button onClick={() => toggleMilestone(ms.id, !ms.completed)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${ms.completed ? 'bg-green-500 border-green-500 text-white' : 'border-infinity-navy/30 dark:border-white/30'}`}>
                            {ms.completed && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${ms.completed ? 'line-through text-infinity-navy/40 dark:text-white/40' : 'text-infinity-navy dark:text-white'}`}>{ms.title}</div>
                            {ms.dueDate && <div className="text-[10px] text-infinity-navy/40 dark:text-white/40">Due: {new Date(ms.dueDate).toLocaleDateString('en-ZA')}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-infinity-navy/40 dark:text-white/40 mb-4">No milestones set yet.</p>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm(m => ({ ...m, title: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Milestone title..." />
                    <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm(m => ({ ...m, dueDate: e.target.value }))}
                      className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                    <button onClick={addMilestone} className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-xs font-semibold hover:bg-infinity-navy-light">Add</button>
                  </div>
                </div>
              )}

              {/* STRATEGY TAB (Officer Only) */}
              {activeTab === 'strategy' && isOfficer && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-red-500">🔒</span>
                    <h3 className="font-display font-semibold text-red-700 dark:text-red-400">Privileged Strategy Notes</h3>
                  </div>
                  <p className="text-xs text-red-500/60 dark:text-red-400/60 mb-3">Only Legal Officers and Managing Partners can view these notes. Protected by attorney-client privilege.</p>

                  {notesLoading ? (
                    <div className="text-xs text-infinity-navy/40 dark:text-white/40">Loading notes...</div>
                  ) : privilegedNotes.length === 0 ? (
                    <div className="text-xs text-infinity-navy/40 dark:text-white/40 mb-3">No strategy notes yet.</div>
                  ) : (
                    <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                      {privilegedNotes.map((n) => (
                        <div key={n.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                          <p className="text-xs text-infinity-navy dark:text-white">{n.content}</p>
                          <div className="text-[10px] text-infinity-navy/40 dark:text-white/40 mt-1">
                            {n.author?.full_name || 'Officer'} • {new Date(n.created_at).toLocaleString('en-ZA')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add strategy note..."
                      className="flex-1 px-3 py-2 border border-red-200 dark:border-red-800/30 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }} />
                    <button onClick={handleAddNote} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Add</button>
                  </div>
                </div>
              )}

              {isParalegal && activeTab === 'strategy' && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold">🔒 Privileged Notes:</span> Strategy notes are visible only to the assigned Legal Officer.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Select a case to view details, prescription periods, and resources</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-infinity-navy/10 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-infinity-navy/10 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white">Create New Case</h2>
                <p className="text-xs text-infinity-navy/50 dark:text-white/50 mt-0.5">Include prescription period and resource allocation</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); setCreateSuccess(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-infinity-navy/5 dark:hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5 text-infinity-navy/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {createSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-2xl">✅</span></div>
                  <h3 className="text-lg font-display font-bold text-infinity-navy dark:text-white mb-1">Case Created!</h3>
                  <p className="text-sm text-infinity-navy/50 dark:text-white/50">The case has been opened with prescription tracking.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateCase} className="space-y-5">
                  {createError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm">{createError}</div>
                  )}

                  {/* Section: Case Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-infinity-navy dark:text-white flex items-center gap-2">📋 Case Details</h4>
                    <div>
                      <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Case Title *</label>
                      <input type="text" required value={newCase.title} onChange={(e) => setNewCase(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                        placeholder="e.g. Smith v. Jones - Property Dispute" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Case Type</label>
                        <select value={newCase.case_type} onChange={(e) => setNewCase(p => ({ ...p, case_type: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                          {caseTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Sub-Type</label>
                        <input type="text" value={newCase.case_subtype} onChange={(e) => setNewCase(p => ({ ...p, case_subtype: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. Divorce, Eviction" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Urgency</label>
                        <select value={newCase.urgency} onChange={(e) => setNewCase(p => ({ ...p, urgency: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                          {urgencyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Court Date</label>
                        <input type="date" value={newCase.court_date} onChange={(e) => setNewCase(p => ({ ...p, court_date: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Description</label>
                      <textarea rows={2} value={newCase.description} onChange={(e) => setNewCase(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" placeholder="Brief description of the case..." />
                    </div>
                  </div>

                  {/* Section: Prescription Period */}
                  <div className="space-y-3 pt-2 border-t border-infinity-navy/10 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-infinity-navy dark:text-white flex items-center gap-2">⏱ Prescription Period</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Prescription Type</label>
                        <select value={newCase.prescription_type} onChange={(e) => setNewCase(p => ({ ...p, prescription_type: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                          {prescriptionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Cause of Action Date</label>
                        <input type="date" value={newCase.prescription_start} onChange={(e) => setNewCase(p => ({ ...p, prescription_start: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                      </div>
                    </div>
                    {newCase.prescription_type === 'custom' && (
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Custom Period (months)</label>
                        <input type="number" value={newCase.prescription_custom_months} onChange={(e) => setNewCase(p => ({ ...p, prescription_custom_months: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. 24" />
                      </div>
                    )}
                  </div>

                  {/* Section: Resources */}
                  <div className="space-y-3 pt-2 border-t border-infinity-navy/10 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-infinity-navy dark:text-white flex items-center gap-2">💰 Resource Allocation</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Estimated Hours</label>
                        <input type="number" value={newCase.estimated_hours} onChange={(e) => setNewCase(p => ({ ...p, estimated_hours: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. 40" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-infinity-navy/70 dark:text-white/70 mb-1">Budget (ZAR)</label>
                        <input type="number" value={newCase.budget_allocated} onChange={(e) => setNewCase(p => ({ ...p, budget_allocated: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. 50000" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowCreateModal(false); setCreateError('') }}
                      className="flex-1 py-2.5 bg-infinity-navy/5 dark:bg-white/5 text-infinity-navy dark:text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy/10 dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button type="submit" disabled={createLoading}
                      className="flex-1 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                      {createLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Creating...</span> : 'Create Case'}
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
