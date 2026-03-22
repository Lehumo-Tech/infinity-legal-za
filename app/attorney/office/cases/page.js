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
    title: '',
    case_type: 'other',
    description: '',
    urgency: 'medium',
    court_date: '',
    court_location: ''
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
      await casesApi.create({
        ...newCase,
        court_date: newCase.court_date || null,
        court_location: newCase.court_location || null
      })
      setShowCreateModal(false)
      setNewCase({ title: '', case_type: 'other', description: '', urgency: 'medium', court_date: '', court_location: '' })
      await fetchCases()
    } catch (error) {
      console.error('Create case error:', error)
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

  const getUrgencyColor = (urgency) => {
    const colors = {
      emergency: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    }
    return colors[urgency] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getStatusColor = (status) => {
    const colors = {
      intake: 'bg-blue-100 text-blue-700',
      matched: 'bg-purple-100 text-purple-700',
      active: 'bg-infinity-gold/10 text-infinity-navy',
      pending: 'bg-gray-100 text-gray-700',
      closed: 'bg-green-100 text-green-700',
      archived: 'bg-gray-50 text-gray-500'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getCourtDateCountdown = (courtDate) => {
    if (!courtDate) return null
    const today = new Date()
    const court = new Date(courtDate)
    const diffDays = Math.ceil((court - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Past', color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Today!', color: 'text-red-600 font-bold' }
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-orange-600 font-bold' }
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-orange-600' }
    return { text: `${diffDays} days`, color: 'text-infinity-navy/70' }
  }

  const filteredCases = cases.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.case_number?.toLowerCase().includes(q) ||
             c.title?.toLowerCase().includes(q) ||
             c.description?.toLowerCase().includes(q)
    }
    return true
  })

  const caseTypes = ['criminal', 'civil', 'family', 'other']

  return (
    <AttorneyLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-infinity-navy mb-1">Case Management</h1>
          <p className="text-infinity-navy/70 text-sm">Manage and track all your legal cases</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-infinity-navy text-infinity-cream rounded-lg font-medium text-sm hover:bg-infinity-navy/90 transition-colors"
        >
          + New Case
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg p-4 border border-infinity-gold/20 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
          />
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'intake', 'matched', 'active', 'closed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-infinity-navy text-infinity-cream'
                    : 'bg-infinity-cream text-infinity-navy hover:bg-infinity-gold/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg border border-infinity-gold/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-infinity-navy mx-auto mb-3"></div>
            <p className="text-infinity-navy/50 text-sm">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-infinity-navy/50 mb-4">No cases found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 bg-infinity-navy text-infinity-cream rounded-lg text-sm hover:bg-infinity-navy/90"
            >
              Create Your First Case
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-infinity-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Case #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Urgency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Court Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const countdown = getCourtDateCountdown(c.court_date)
                  return (
                    <tr key={c.id} className="border-t border-infinity-gold/10 hover:bg-infinity-cream/30">
                      <td className="px-4 py-3 font-mono text-sm text-infinity-navy">{c.case_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-infinity-navy text-sm">{c.title}</div>
                        {c.description && (
                          <div className="text-xs text-infinity-navy/50 mt-0.5 max-w-xs truncate">{c.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-infinity-navy/70 capitalize">{c.case_type}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${getStatusColor(c.status)}`}
                        >
                          {['intake', 'matched', 'active', 'closed', 'archived'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getUrgencyColor(c.urgency)}`}>
                          {c.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.court_date ? (
                          <div>
                            <div className="text-sm text-infinity-navy">{new Date(c.court_date).toLocaleDateString()}</div>
                            {countdown && <div className={`text-xs ${countdown.color}`}>{countdown.text}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-infinity-navy/40">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-infinity-navy/40">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-infinity-navy mb-4">Create New Case</h3>
            
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-infinity-navy mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  placeholder="e.g., Unfair Dismissal - John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Case Type</label>
                  <select
                    value={newCase.case_type}
                    onChange={(e) => setNewCase({ ...newCase, case_type: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  >
                    {caseTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Urgency</label>
                  <select
                    value={newCase.urgency}
                    onChange={(e) => setNewCase({ ...newCase, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-infinity-navy mb-1">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  placeholder="Brief case description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Court Date</label>
                  <input
                    type="date"
                    value={newCase.court_date}
                    onChange={(e) => setNewCase({ ...newCase, court_date: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Court Location</label>
                  <input
                    type="text"
                    value={newCase.court_location}
                    onChange={(e) => setNewCase({ ...newCase, court_location: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                    placeholder="e.g., Johannesburg High Court"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-infinity-gold/20 text-infinity-navy rounded-lg text-sm hover:bg-infinity-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-infinity-navy text-infinity-cream rounded-lg text-sm font-medium hover:bg-infinity-navy/90 disabled:opacity-50"
                >
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
