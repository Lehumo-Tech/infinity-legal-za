'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_COLORS = {
  new: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unqualified: 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  lost: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
}

const URGENCY_COLORS = {
  emergency: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

export default function LeadsPipelinePage() {
  const { profile, role, isOfficer, isIntakeAgent, isManagingPartner } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newLead, setNewLead] = useState({ fullName: '', email: '', phone: '', caseType: '', urgency: 'medium', description: '', source: 'call' })
  const [submitting, setSubmitting] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    async function getToken() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    getToken()
  }, [])

  const fetchLeads = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/leads${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Fetch leads error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleCreateLead = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newLead),
      })
      if (res.ok) {
        setShowNewForm(false)
        setNewLead({ fullName: '', email: '', phone: '', caseType: '', urgency: 'medium', description: '', source: 'call' })
        fetchLeads()
      }
    } catch (err) {
      console.error('Create lead error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQualify = async (leadId) => {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId, action: 'qualify', notes: 'Qualified via pipeline' }),
      })
      fetchLeads()
    } catch (err) { console.error(err) }
  }

  const handleReadyForStrategy = async (leadId) => {
    // For paralegals: mark ready for officer review
    const officerId = prompt('Enter Officer ID to assign:')
    if (!officerId) return
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId, action: 'ready_for_strategy', officerId }),
      })
      fetchLeads()
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Leads Pipeline</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            {isIntakeAgent ? 'Qualify leads and move them through the pipeline.' : 'Track and manage incoming leads.'}
          </p>
        </div>
        {(isIntakeAgent || isManagingPartner || isOfficer || role === 'attorney') && (
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-infinity-navy text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy-light transition-colors"
          >
            + New Lead
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy'
                : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700 hover:border-infinity-gold/40'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* New Lead Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-display font-semibold text-infinity-navy dark:text-white mb-4">New Lead Entry</h3>
          <form onSubmit={handleCreateLead} className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Full Name *" required value={newLead.fullName} onChange={(e) => setNewLead({...newLead, fullName: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <input placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <input placeholder="Email" type="email" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            <select value={newLead.caseType} onChange={(e) => setNewLead({...newLead, caseType: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
              <option value="">Case Type</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="labour">Labour</option>
              <option value="civil">Civil</option>
              <option value="property">Property</option>
              <option value="commercial">Commercial</option>
              <option value="other">Other</option>
            </select>
            <select value={newLead.urgency} onChange={(e) => setNewLead({...newLead, urgency: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
              <option value="low">Low Urgency</option>
              <option value="medium">Medium Urgency</option>
              <option value="high">High Urgency</option>
              <option value="emergency">Emergency</option>
            </select>
            <select value={newLead.source} onChange={(e) => setNewLead({...newLead, source: e.target.value})} className="px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
              <option value="call">Phone Call</option>
              <option value="web">Web Inquiry</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
            </select>
            <textarea placeholder="Description / Notes" value={newLead.description} onChange={(e) => setNewLead({...newLead, description: e.target.value})} className="sm:col-span-2 px-3 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white h-20 resize-none" />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-sm font-semibold hover:bg-infinity-navy-light disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Lead'}
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Urgency</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Created</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50 hover:bg-infinity-cream/30 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-semibold text-infinity-navy dark:text-white">{lead.full_name}</td>
                    <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60">
                      {lead.phone || lead.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60">{lead.case_type || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${URGENCY_COLORS[lead.urgency] || 'bg-gray-400'}`} />
                        <span className="text-xs capitalize">{lead.urgency}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[lead.status] || ''}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs">
                      {new Date(lead.created_at).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {isIntakeAgent && lead.status === 'new' && (
                          <button onClick={() => handleQualify(lead.id)} className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-semibold hover:bg-green-200">
                            Qualify
                          </button>
                        )}
                        {role === 'paralegal' && lead.status === 'qualified' && (
                          <button onClick={() => handleReadyForStrategy(lead.id)} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold hover:bg-blue-200">
                            Ready for Officer
                          </button>
                        )}
                      </div>
                    </td>
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
