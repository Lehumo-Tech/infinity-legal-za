'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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
  'custom': { months: 0, label: 'Custom Period' },
}

const CASE_TYPES = [
  { value: 'family', label: 'Family Law' }, { value: 'criminal', label: 'Criminal Law' },
  { value: 'civil', label: 'Civil Litigation' }, { value: 'labour', label: 'Labour Law' },
  { value: 'commercial', label: 'Commercial Law' }, { value: 'property', label: 'Property Law' },
  { value: 'immigration', label: 'Immigration' }, { value: 'personal_injury', label: 'Personal Injury' },
  { value: 'other', label: 'Other' },
]

const STATUS_FLOW = ['new', 'active', 'pending_court', 'settlement', 'closed', 'archived']
const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  intake: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending_court: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  settlement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  archived: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
  under_review: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const TIMELINE_ICONS = {
  case_created: '🆕', status_changed: '🔄', case_assigned: '👤', note_added: '📝',
  task_created: '📋', task_completed: '✅', client_message: '💬', internal_message: '🔒',
  document: '📄', billing: '💰', activity: '📌',
}

function PrescriptionBadge({ metadata }) {
  if (!metadata?.prescription?.expiryDate) return null
  const p = metadata.prescription
  const days = p.daysRemaining
  if (p.type === 'criminal_murder') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">No Prescription</span>
  if (p.isExpired) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse">PRESCRIBED ({Math.abs(days)}d overdue)</span>
  if (p.isUrgent) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{days}d remaining</span>
  if (p.isWarning) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{days}d remaining</span>
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{days}d remaining</span>
}

export default function PortalCasesPage() {
  const { profile, role, isOfficer, isParalegal, isManagingPartner, hasPermission, user } = useAuth()
  const [token, setToken] = useState(null)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCase, setSelectedCase] = useState(null)
  const [activeTab, setActiveTab] = useState('timeline')
  const [caseMetadataMap, setCaseMetadataMap] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Workspace data
  const [timeline, setTimeline] = useState([])
  const [caseNotes, setCaseNotes] = useState([])
  const [caseTasks, setCaseTasks] = useState([])
  const [caseMessages, setCaseMessages] = useState([])
  const [caseMetadata, setCaseMetadata] = useState(null)
  const [staff, setStaff] = useState([])
  const [clients, setClients] = useState([])
  const [tabLoading, setTabLoading] = useState(false)

  // Forms
  const [newNote, setNewNote] = useState('')
  const [noteCategory, setNoteCategory] = useState('general')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('normal')
  const [newMsg, setNewMsg] = useState('')
  const [msgInternal, setMsgInternal] = useState(false)
  const messagesEndRef = useRef(null)

  // Create case form
  const [createMode, setCreateMode] = useState('scratch') // 'scratch' | 'intake'
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [intakeSearch, setIntakeSearch] = useState('')
  const [intakeResults, setIntakeResults] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState([])
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', idNumber: '' })
  const [newCase, setNewCase] = useState({
    title: '', case_type: 'civil', description: '', urgency: 'medium',
    court_date: '', court_location: '', client_id: '', client_name: '',
    attorney_id: '', prescription_type: 'general', prescription_start: '',
    estimated_hours: '', budget_allocated: '', billing_rate: '',
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchCases = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/cases${params}`, { headers })
      const data = await res.json()
      setCases(data.cases || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { fetchCases() }, [fetchCases])

  // Fetch metadata for prescription badges
  useEffect(() => {
    if (!token || cases.length === 0) return
    const fetchMeta = async () => {
      const map = {}
      await Promise.all(cases.slice(0, 30).map(async c => {
        try {
          const res = await fetch(`/api/cases/${c.id}/metadata`, { headers })
          if (res.ok) { const d = await res.json(); map[c.id] = d.metadata }
        } catch { /* ignore */ }
      }))
      setCaseMetadataMap(map)
    }
    fetchMeta()
  }, [token, cases.length])

  // Fetch staff for assignment — from profiles via Supabase (auth system)
  useEffect(() => {
    if (!token) return
    const fetchStaff = async () => {
      try {
        const { data } = await supabase.from('profiles').select('id, full_name, role').neq('role', 'client').order('full_name')
        if (data) setStaff(data)
      } catch (e) {
        // Fallback: create minimal staff list from current user
        setStaff([{ id: user?.id, full_name: profile?.full_name || 'Current User', role: role || 'admin' }])
      }
    }
    fetchStaff()
  }, [token])

  // Tab data fetchers
  const fetchTimeline = async (id) => {
    setTabLoading(true)
    try { const r = await fetch(`/api/cases/${id}/timeline`, { headers }); if (r.ok) { const d = await r.json(); setTimeline(d.entries || []) } } catch { }
    finally { setTabLoading(false) }
  }
  const fetchNotes = async (id) => {
    setTabLoading(true)
    try { const r = await fetch(`/api/cases/${id}/notes`, { headers }); if (r.ok) { const d = await r.json(); setCaseNotes(d.notes || []) } } catch { }
    finally { setTabLoading(false) }
  }
  const fetchTasks = async (id) => {
    setTabLoading(true)
    try { const r = await fetch(`/api/cases/${id}/tasks`, { headers }); if (r.ok) { const d = await r.json(); setCaseTasks(d.tasks || []) } } catch { }
    finally { setTabLoading(false) }
  }
  const fetchMessages = async (id) => {
    setTabLoading(true)
    try {
      const r = await fetch(`/api/cases/${id}/messages`, { headers })
      if (r.ok) { const d = await r.json(); setCaseMessages(d.messages || []) }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch { }
    finally { setTabLoading(false) }
  }
  const fetchMetadata = async (id) => {
    setTabLoading(true)
    try { const r = await fetch(`/api/cases/${id}/metadata`, { headers }); if (r.ok) { const d = await r.json(); setCaseMetadata(d.metadata) } } catch { }
    finally { setTabLoading(false) }
  }

  const selectCase = (c) => {
    setSelectedCase(c)
    setActiveTab('timeline')
    setCaseMetadata(null)
    fetchTimeline(c.id)
    fetchMetadata(c.id)
  }

  useEffect(() => {
    if (!selectedCase) return
    const id = selectedCase.id
    if (activeTab === 'timeline') fetchTimeline(id)
    else if (activeTab === 'notes') fetchNotes(id)
    else if (activeTab === 'tasks') fetchTasks(id)
    else if (activeTab === 'messages') fetchMessages(id)
    else if (activeTab === 'billing') fetchMetadata(id)
  }, [activeTab, selectedCase?.id])

  // Actions
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCase) return
    await fetch(`/api/cases/${selectedCase.id}/notes`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newNote, category: noteCategory }) })
    setNewNote(''); fetchNotes(selectedCase.id); fetchTimeline(selectedCase.id)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedCase) return
    await fetch(`/api/cases/${selectedCase.id}/tasks`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTaskTitle, priority: newTaskPriority, dueDate: newTaskDue }) })
    setNewTaskTitle(''); setNewTaskDue(''); fetchTasks(selectedCase.id); fetchTimeline(selectedCase.id)
  }

  const handleToggleTask = async (taskId, completed) => {
    await fetch(`/api/cases/${selectedCase.id}/tasks`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, status: completed ? 'completed' : 'pending' }) })
    fetchTasks(selectedCase.id); fetchTimeline(selectedCase.id)
  }

  const handleSendMsg = async () => {
    if (!newMsg.trim() || !selectedCase) return
    await fetch(`/api/cases/${selectedCase.id}/messages`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMsg, isInternal: msgInternal }) })
    setNewMsg(''); fetchMessages(selectedCase.id)
  }

  const handleStatusChange = async (newStatus) => {
    if (!selectedCase) return
    await fetch('/api/cases', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedCase.id, status: newStatus }) })
    setSelectedCase(prev => ({ ...prev, status: newStatus }))
    fetchCases(); fetchTimeline(selectedCase.id)
  }

  // Client search
  const searchClients = async (q) => {
    setClientSearch(q)
    if (q.length < 2) { setClientResults([]); return }
    try {
      const r = await fetch(`/api/clients?search=${encodeURIComponent(q)}`, { headers })
      if (r.ok) { const d = await r.json(); setClientResults(d.clients || []) }
    } catch { }
  }

  const handleCreateClient = async () => {
    if (!newClient.name) return
    try {
      const r = await fetch('/api/clients', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) })
      if (r.ok) {
        const d = await r.json()
        setNewCase(prev => ({ ...prev, client_id: d.client.id, client_name: d.client.name }))
        setShowNewClient(false); setNewClient({ name: '', email: '', phone: '', idNumber: '' })
      }
    } catch { }
  }

  const handleCreateCase = async (e) => {
    e.preventDefault()
    setCreateLoading(true); setCreateError('')
    try {
      const payload = {
        title: newCase.title || 'New Case', case_type: newCase.case_type,
        description: newCase.description, urgency: newCase.urgency,
        court_date: newCase.court_date || null, court_location: newCase.court_location || null,
        client_id: newCase.client_id || undefined,
        attorney_id: newCase.attorney_id || undefined,
        status: 'new',
      }
      const res = await fetch('/api/cases', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      const caseId = data.case?.id
      if (caseId) {
        // Save metadata
        const metaPayload = {}
        if (newCase.prescription_start) metaPayload.prescription = { type: newCase.prescription_type, startDate: newCase.prescription_start }
        if (newCase.estimated_hours || newCase.budget_allocated) metaPayload.resources = { estimatedHours: parseFloat(newCase.estimated_hours) || 0, budgetAllocated: parseFloat(newCase.budget_allocated) || 0, hourlyRate: parseFloat(newCase.billing_rate) || 0 }
        if (Object.keys(metaPayload).length > 0) {
          await fetch(`/api/cases/${caseId}/metadata`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(metaPayload) })
        }
        // Assign attorney
        if (newCase.attorney_id) {
          await fetch(`/api/cases/${caseId}/assign`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ leadAttorneyId: newCase.attorney_id, billingRate: parseFloat(newCase.billing_rate) || null }) })
        }
      }

      setShowCreateModal(false)
      setNewCase({ title: '', case_type: 'civil', description: '', urgency: 'medium', court_date: '', court_location: '', client_id: '', client_name: '', attorney_id: '', prescription_type: 'general', prescription_start: '', estimated_hours: '', budget_allocated: '', billing_rate: '' })
      fetchCases()
    } catch (err) { setCreateError(err.message) }
    finally { setCreateLoading(false) }
  }

  const filteredCases = searchQuery
    ? cases.filter(c => (c.case_number || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.case_type || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.case_subtype || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : cases

  const WORKSPACE_TABS = [
    { id: 'timeline', label: '📅 Timeline' },
    { id: 'notes', label: '📝 Notes' },
    { id: 'tasks', label: '📋 Tasks' },
    { id: 'messages', label: '💬 Messages' },
    { id: 'billing', label: '💰 Billing' },
    { id: 'details', label: '⚙️ Details' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Case Management</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Manage cases, track progress, and collaborate</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Case
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Cases List Panel */}
        <div className="lg:col-span-4 xl:col-span-3">
          {/* Search + Filters */}
          <div className="mb-3 space-y-2">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cases..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <div className="flex gap-1 flex-wrap">
              {['all', 'new', 'active', 'pending_court', 'settlement', 'closed', 'archived'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${filter === s ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                  {s === 'pending_court' ? 'Court' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[68vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-8 text-center"><div className="text-3xl mb-2">📁</div><p className="text-xs text-gray-400">No cases found</p></div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredCases.map(c => (
                  <div key={c.id} onClick={() => selectCase(c)}
                    className={`p-3 cursor-pointer transition-colors ${selectedCase?.id === c.id ? 'bg-infinity-gold/10 border-l-4 border-l-infinity-gold' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-infinity-navy dark:text-white truncate">{c.case_number || 'Case'}</div>
                        <div className="text-[10px] text-gray-400 truncate">{c.case_type} • {c.case_subtype || 'General'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[c.status] || STATUS_COLORS.new}`}>{(c.status || 'new').replace(/_/g, ' ')}</span>
                        <PrescriptionBadge metadata={caseMetadataMap[c.id]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Case Workspace */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedCase ? (
            <div className="space-y-3">
              {/* Case Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">{selectedCase.case_number}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[selectedCase.status] || STATUS_COLORS.new}`}>{(selectedCase.status || 'new').replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedCase.case_type} • {selectedCase.case_subtype || 'General'} • {selectedCase.urgency} urgency</p>
                  </div>
                  {/* Status Workflow */}
                  <div className="flex items-center gap-1">
                    {STATUS_FLOW.filter(s => s !== selectedCase.status).slice(0, 3).map(s => (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-infinity-gold/20 transition-colors capitalize">
                        → {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workspace Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 flex gap-0.5 overflow-x-auto">
                {WORKSPACE_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-infinity-navy dark:text-white mb-3">Activity Timeline</h3>
                    {tabLoading ? <div className="text-center py-8 text-xs text-gray-400">Loading...</div> :
                    timeline.length === 0 ? <div className="text-center py-8 text-xs text-gray-400">No activity yet</div> : (
                      <div className="space-y-3">
                        {timeline.map(e => (
                          <div key={e.id} className="flex gap-3">
                            <div className="text-lg shrink-0">{TIMELINE_ICONS[e.action] || '📌'}</div>
                            <div className="min-w-0 flex-1 border-b border-gray-50 dark:border-gray-700/50 pb-2">
                              <div className="text-xs font-medium text-infinity-navy dark:text-white">{e.description}</div>
                              <div className="text-[10px] text-gray-400">{e.userName} • {new Date(e.createdAt).toLocaleString('en-ZA')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-infinity-navy dark:text-white mb-3">Internal Notes <span className="text-[10px] text-gray-400 font-normal">(client-invisible)</span></h3>
                    <div className="flex gap-2 mb-4">
                      <textarea rows={2} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..."
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" />
                      <div className="flex flex-col gap-1">
                        <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)}
                          className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                          {['general', 'strategy', 'research', 'client_update', 'court_prep'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                        </select>
                        <button onClick={handleAddNote} disabled={!newNote.trim()}
                          className="px-3 py-1 bg-infinity-navy text-white rounded text-[10px] font-semibold disabled:opacity-50">Add</button>
                      </div>
                    </div>
                    {caseNotes.length === 0 ? <div className="text-center py-6 text-xs text-gray-400">No notes yet</div> : (
                      <div className="space-y-2">
                        {caseNotes.map(n => (
                          <div key={n.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-infinity-navy dark:text-white">{n.authorName}</span>
                              <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[9px] capitalize">{n.category}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">{new Date(n.createdAt).toLocaleString('en-ZA')}</span>
                            </div>
                            <p className="text-xs text-infinity-navy/80 dark:text-white/80 whitespace-pre-wrap">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-infinity-navy dark:text-white mb-3">Tasks</h3>
                    <div className="flex gap-2 mb-4">
                      <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..."
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                      <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)}
                        className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                      <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}
                        className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700">
                        {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <button onClick={handleAddTask} disabled={!newTaskTitle.trim()}
                        className="px-3 py-2 bg-infinity-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50">Add</button>
                    </div>
                    {caseTasks.length === 0 ? <div className="text-center py-6 text-xs text-gray-400">No tasks yet</div> : (
                      <div className="space-y-1">
                        {caseTasks.map(t => (
                          <div key={t.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 ${t.status === 'completed' ? 'opacity-50' : ''}`}>
                            <button onClick={() => handleToggleTask(t.id, t.status !== 'completed')}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${t.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                              {t.status === 'completed' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-medium ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-infinity-navy dark:text-white'}`}>{t.title}</div>
                              <div className="text-[10px] text-gray-400">{t.assigneeName || 'Unassigned'}{t.dueDate ? ` • Due: ${new Date(t.dueDate).toLocaleDateString('en-ZA')}` : ''}</div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${t.priority === 'urgent' ? 'bg-red-100 text-red-700' : t.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === 'messages' && (
                  <div className="flex flex-col h-[450px]">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-infinity-navy dark:text-white">Communication Log</h3>
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                        <input type="checkbox" checked={msgInternal} onChange={e => setMsgInternal(e.target.checked)} className="rounded border-gray-300 w-3 h-3" />
                        <span className="text-gray-400">Internal only</span>
                      </label>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {caseMessages.length === 0 ? <div className="text-center py-8 text-xs text-gray-400">No messages yet</div> : (
                        caseMessages.map(m => {
                          const isMe = m.senderId === user?.id
                          return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-xl px-3 py-2 ${m.isInternal ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : isMe ? 'bg-infinity-navy text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                {m.isInternal && <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mb-0.5">🔒 Internal</div>}
                                {!isMe && <div className="text-[10px] font-bold opacity-70 mb-0.5">{m.senderName}</div>}
                                <div className="text-xs whitespace-pre-wrap">{m.content}</div>
                                <div className={`text-[9px] mt-0.5 ${isMe && !m.isInternal ? 'text-white/50' : 'text-gray-400'}`}>{new Date(m.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                      <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendMsg() }}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder={msgInternal ? 'Internal message...' : 'Message client...'} />
                      <button onClick={handleSendMsg} disabled={!newMsg.trim()} className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50">Send</button>
                    </div>
                  </div>
                )}

                {/* BILLING TAB */}
                {activeTab === 'billing' && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-infinity-navy dark:text-white mb-3">Billing & Resources</h3>
                    {caseMetadata ? (
                      <div className="grid sm:grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Estimated Hours</div>
                          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{caseMetadata.resources?.estimatedHours || 0}h</div>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                          <div className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Budget</div>
                          <div className="text-lg font-bold text-green-700 dark:text-green-300">R{(caseMetadata.resources?.budgetAllocated || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Hours Tracked</div>
                          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{(caseMetadata.timeEntries?.reduce((s, e) => s + (e.hours || 0), 0) || 0).toFixed(1)}h</div>
                        </div>
                      </div>
                    ) : <div className="text-center py-6 text-xs text-gray-400">No billing data</div>}
                    {caseMetadata?.timeEntries?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-2">Time Entries</h4>
                        <div className="space-y-1">
                          {caseMetadata.timeEntries.map((e, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                              <span className="text-infinity-navy dark:text-white">{e.description || 'Work'}</span>
                              <div className="text-gray-400"><span className="font-semibold text-infinity-navy dark:text-white">{e.hours}h</span> • {e.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-bold text-infinity-navy dark:text-white mb-3">Case Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><span className="text-gray-400 block mb-0.5">Case Number</span><span className="font-semibold text-infinity-navy dark:text-white">{selectedCase.case_number}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Type</span><span className="font-semibold text-infinity-navy dark:text-white capitalize">{selectedCase.case_type}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Sub-Type</span><span className="font-semibold text-infinity-navy dark:text-white">{selectedCase.case_subtype || '—'}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Urgency</span><span className={`font-semibold ${selectedCase.urgency === 'emergency' ? 'text-red-600' : selectedCase.urgency === 'high' ? 'text-orange-600' : 'text-infinity-navy dark:text-white'}`}>{selectedCase.urgency}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Court Date</span><span className="font-semibold text-infinity-navy dark:text-white">{selectedCase.court_date ? new Date(selectedCase.court_date).toLocaleDateString('en-ZA') : '—'}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Court Location</span><span className="font-semibold text-infinity-navy dark:text-white">{selectedCase.court_location || '—'}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Created</span><span className="font-semibold text-infinity-navy dark:text-white">{new Date(selectedCase.created_at).toLocaleDateString('en-ZA')}</span></div>
                      <div><span className="text-gray-400 block mb-0.5">Status</span><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[selectedCase.status] || ''}`}>{selectedCase.status}</span></div>
                    </div>
                    {caseMetadata?.prescription && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">⏱ Prescription Period</h4>
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          Type: {SA_PRESCRIPTION_PERIODS[caseMetadata.prescription.type]?.label || caseMetadata.prescription.type} <br />
                          Expires: {caseMetadata.prescription.expiryDate ? new Date(caseMetadata.prescription.expiryDate).toLocaleDateString('en-ZA') : '—'} <br />
                          <PrescriptionBadge metadata={caseMetadata} />
                        </div>
                      </div>
                    )}
                    {caseMetadata?.assignment && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">👤 Assignment</h4>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Assigned by: {caseMetadata.assignment.assignedByName || '—'} <br />
                          Billing Rate: R{caseMetadata.assignment.billingRate || '—'}/hr
                        </div>
                      </div>
                    )}

                    {/* Archive Section */}
                    {selectedCase.status === 'archived' && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🗄️</span>
                          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400">Archived Case — Read Only</h4>
                        </div>
                        <p className="text-xs text-gray-400">This case has been archived. All data is preserved for reference but cannot be modified.</p>
                      </div>
                    )}
                    {selectedCase.status === 'closed' && (
                      <div className="mt-4">
                        <button
                          onClick={async () => {
                            if (!confirm('Archive this case? It will become read-only.')) return
                            try {
                              const res = await fetch('/api/cases/archive', {
                                method: 'POST',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ caseId: selectedCase.id }),
                              })
                              const data = await res.json()
                              if (res.ok) { alert(data.message); fetchCases(); setSelectedCase(null) }
                              else { alert(data.error || 'Failed to archive') }
                            } catch (err) { alert('Error: ' + err.message) }
                          }}
                          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          🗄️ Archive This Case (Read-Only)
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1 text-center">Closed cases can be archived for long-term storage. Archived cases are read-only.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center h-[500px]">
              <div className="text-center">
                <div className="text-5xl mb-3">⚖️</div>
                <h3 className="text-lg font-display font-bold text-infinity-navy dark:text-white">Select a Case</h3>
                <p className="text-xs text-gray-400 mt-1">Choose a case from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">New Case</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-5 space-y-4">
              {createError && <div className="p-2 bg-red-50 text-red-700 rounded-lg text-xs">{createError}</div>}

              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Client</label>
                {newCase.client_name ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-700 dark:text-green-400 flex-1">✅ {newCase.client_name}</span>
                    <button type="button" onClick={() => setNewCase(p => ({ ...p, client_id: '', client_name: '' }))} className="text-xs text-red-500">Clear</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" value={clientSearch} onChange={e => searchClients(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Search existing clients..." />
                    {clientResults.length > 0 && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-32 overflow-y-auto">
                        {clientResults.map(c => (
                          <button key={c.id} type="button" onClick={() => { setNewCase(p => ({ ...p, client_id: c.id, client_name: c.name })); setClientResults([]); setClientSearch('') }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                            <span className="font-semibold text-infinity-navy dark:text-white">{c.name}</span>
                            <span className="text-gray-400 ml-2">{c.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => setShowNewClient(true)} className="text-xs text-infinity-gold font-semibold hover:underline">+ Create New Client</button>
                  </div>
                )}
              </div>

              {/* New Client Inline Form */}
              {showNewClient && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400">New Client</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Full Name *"
                      className="px-2 py-1.5 border border-blue-200 dark:border-blue-700 rounded text-xs bg-white dark:bg-gray-700" />
                    <input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="Email"
                      className="px-2 py-1.5 border border-blue-200 dark:border-blue-700 rounded text-xs bg-white dark:bg-gray-700" />
                    <input type="tel" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="Phone"
                      className="px-2 py-1.5 border border-blue-200 dark:border-blue-700 rounded text-xs bg-white dark:bg-gray-700" />
                    <input type="text" value={newClient.idNumber} onChange={e => setNewClient(p => ({ ...p, idNumber: e.target.value }))} placeholder="ID Number"
                      className="px-2 py-1.5 border border-blue-200 dark:border-blue-700 rounded text-xs bg-white dark:bg-gray-700" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowNewClient(false)} className="px-3 py-1 bg-gray-100 rounded text-[10px] font-semibold">Cancel</button>
                    <button type="button" onClick={handleCreateClient} disabled={!newClient.name} className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold disabled:opacity-50">Create Client</button>
                  </div>
                </div>
              )}

              {/* Case Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Case Title *</label>
                  <input type="text" required value={newCase.title} onChange={e => setNewCase(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Case title" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Case Type</label>
                  <select value={newCase.case_type} onChange={e => setNewCase(p => ({ ...p, case_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {CASE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea rows={3} value={newCase.description} onChange={e => setNewCase(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Urgency</label>
                  <select value={newCase.urgency} onChange={e => setNewCase(p => ({ ...p, urgency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700">
                    {['low', 'medium', 'high', 'emergency'].map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Court Date</label>
                  <input type="date" value={newCase.court_date} onChange={e => setNewCase(p => ({ ...p, court_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Court Location</label>
                  <input type="text" value={newCase.court_location} onChange={e => setNewCase(p => ({ ...p, court_location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" placeholder="e.g. Pretoria High Court" />
                </div>
              </div>

              {/* Team Assignment */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lead Attorney</label>
                <select value={newCase.attorney_id} onChange={e => setNewCase(p => ({ ...p, attorney_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                  <option value="">Assign later...</option>
                  {staff.filter(s => ['attorney', 'senior_partner', 'associate', 'junior_attorney', 'managing_director', 'legal_officer', 'managing_partner'].includes(s.role)).map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({(s.role || '').replace(/_/g, ' ')})</option>
                  ))}
                </select>
              </div>

              {/* Prescription & Budget */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Prescription Type</label>
                  <select value={newCase.prescription_type} onChange={e => setNewCase(p => ({ ...p, prescription_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700">
                    {Object.entries(SA_PRESCRIPTION_PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Prescription Start</label>
                  <input type="date" value={newCase.prescription_start} onChange={e => setNewCase(p => ({ ...p, prescription_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Rate (R/hr)</label>
                  <input type="number" value={newCase.billing_rate} onChange={e => setNewCase(p => ({ ...p, billing_rate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" placeholder="e.g. 2500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Est. Hours</label>
                  <input type="number" value={newCase.estimated_hours} onChange={e => setNewCase(p => ({ ...p, estimated_hours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Budget (R)</label>
                  <input type="number" value={newCase.budget_allocated} onChange={e => setNewCase(p => ({ ...p, budget_allocated: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={createLoading}
                  className="flex-1 py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {createLoading ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
