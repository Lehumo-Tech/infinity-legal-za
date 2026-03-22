'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { casesApi } from '@/lib/api'

export default function CasesPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [cases, setCases] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCase, setNewCase] = useState({
    title: '', case_type: 'other', description: '', urgency: 'medium',
    court_date: '', court_location: ''
  })

  useEffect(() => {
    if (user) fetchCases()
  }, [user, filter])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const res = await casesApi.list({ role: profile?.role || 'attorney', status: filter })
      setCases(res.cases || [])
    } catch (error) {
      console.error('Fetch cases error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async (e) => {
    e.preventDefault()
    if (!newCase.title) return
    try {
      setCreating(true)
      await casesApi.create({ ...newCase, court_date: newCase.court_date || null, court_location: newCase.court_location || null })
      setShowCreateModal(false)
      setNewCase({ title: '', case_type: 'other', description: '', urgency: 'medium', court_date: '', court_location: '' })
      await fetchCases()
    } catch (error) {
      alert('Failed to create case: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await casesApi.update(caseId, { status: newStatus })
      await fetchCases()
    } catch (error) {
      console.error('Update case error:', error)
    }
  }

  const getStatusColor = (status) => ({
    intake: 'bg-blue-50 text-blue-600',
    matched: 'bg-purple-50 text-purple-600',
    active: 'bg-emerald-50 text-emerald-600',
    closed: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-50 text-gray-400'
  }[status] || 'bg-gray-100 text-gray-500')

  const getUrgencyColor = (urgency) => ({
    emergency: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  }[urgency] || 'text-gray-600 bg-gray-50')

  const filteredCases = cases.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.case_number?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  })

  const caseTypes = ['criminal', 'civil', 'family', 'other']

  return (
    <AttorneyLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your legal cases</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search cases..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-sm" />
          </div>
          <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
            {['all', 'intake', 'matched', 'active', 'closed'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-3">No cases found</p>
            <button onClick={() => setShowCreateModal(true)}
              className="text-sm text-gray-900 font-medium hover:underline">
              Create your first case →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Case #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Urgency</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Court Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{c.case_number}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-sm text-gray-900">{c.title || c.case_subtype || 'Untitled'}</div>
                      {c.description && <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{c.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 capitalize">{c.case_type}</td>
                    <td className="px-5 py-3.5">
                      <select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(c.status)}`}>
                        {['intake', 'matched', 'active', 'closed', 'archived'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {c.court_date ? new Date(c.court_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Create New Case</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Case Title *</label>
                <input type="text" required value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-sm"
                  placeholder="e.g., Unfair Dismissal - John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Case Type</label>
                  <select value={newCase.case_type} onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm">
                    {caseTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
                  <select value={newCase.urgency} onChange={(e) => setNewCase({ ...newCase, urgency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm">
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm"
                  placeholder="Brief case description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Court Date</label>
                  <input type="date" value={newCase.court_date}
                    onChange={(e) => setNewCase({ ...newCase, court_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Court Location</label>
                  <input type="text" value={newCase.court_location}
                    onChange={(e) => setNewCase({ ...newCase, court_location: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm"
                    placeholder="e.g., Johannesburg High Court" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AttorneyLayout>
  )
}
