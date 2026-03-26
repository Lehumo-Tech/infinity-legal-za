'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ACTION_META = {
  CREATE_LEAD: { icon: '➕', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Lead Created' },
  LEAD_QUALIFY: { icon: '✅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Lead Qualified' },
  LEAD_ASSIGN_PARALEGAL: { icon: '📝', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', label: 'Lead Assigned' },
  LEAD_READY_FOR_STRATEGY: { icon: '⚖️', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Strategy Review' },
  LEAD_CONVERT: { icon: '🎉', color: 'bg-infinity-gold/20 text-infinity-navy dark:text-infinity-gold', label: 'Lead Converted' },
  CREATE_PRIVILEGED_NOTE: { icon: '🔒', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Privileged Note' },
  VIEW_PRIVILEGED_NOTES: { icon: '👁️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Notes Viewed' },
  DOCUMENT_APPROVED: { icon: '📄', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Doc Approved' },
  DOCUMENT_SIGNED: { icon: '🖊️', color: 'bg-infinity-navy/10 text-infinity-navy dark:bg-blue-900/30 dark:text-blue-400', label: 'Doc Signed' },
  CREATE_STAFF_USER: { icon: '👤', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Staff Created' },
  DOCUMENT_STATUS_CHANGE: { icon: '📋', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Doc Status Changed' },
  CASE_STATUS_CHANGE: { icon: '📁', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Case Updated' },
  LOGIN: { icon: '🔑', color: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300', label: 'Login' },
}

const RESOURCE_ICONS = {
  lead: '📞',
  case: '📁',
  document: '📄',
  privileged_note: '🔒',
  user: '👤',
}

export default function AuditLogPage() {
  const { isManagingPartner, isITAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState({ resourceType: '', action: '' })
  const [expandedLog, setExpandedLog] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'timeline'

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchLogs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.resourceType) params.set('resource_type', filter.resourceType)
      if (filter.action) params.set('action', filter.action)
      params.set('limit', '50')

      const res = await fetch(`/api/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Fetch audit logs error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (!isManagingPartner && !isITAdmin) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Access Restricted</h2>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm">Only Managing Partners and IT Admins can view audit logs.</p>
      </div>
    )
  }

  // Group logs by date for timeline
  const groupedByDate = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Audit Trail</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            Complete security log of all sensitive actions. <span className="font-semibold">{total}</span> total entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-infinity-navy/5 dark:bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-infinity-navy/50 dark:text-white/50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-infinity-navy/50 dark:text-white/50'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filter.resourceType}
          onChange={(e) => setFilter({...filter, resourceType: e.target.value})}
          className="px-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
        >
          <option value="">All Resources</option>
          <option value="lead">📞 Leads</option>
          <option value="case">📁 Cases</option>
          <option value="document">📄 Documents</option>
          <option value="privileged_note">🔒 Privileged Notes</option>
          <option value="user">👤 Users</option>
        </select>
        <select
          value={filter.action}
          onChange={(e) => setFilter({...filter, action: e.target.value})}
          className="px-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
        >
          <option value="">All Actions</option>
          <option value="CREATE_LEAD">Create Lead</option>
          <option value="LEAD_QUALIFY">Qualify Lead</option>
          <option value="CREATE_STAFF_USER">Create Staff</option>
          <option value="CREATE_PRIVILEGED_NOTE">Privileged Note</option>
          <option value="VIEW_PRIVILEGED_NOTES">View Notes</option>
          <option value="DOCUMENT_APPROVED">Doc Approved</option>
          <option value="DOCUMENT_SIGNED">Doc Signed</option>
        </select>
        {(filter.resourceType || filter.action) && (
          <button
            onClick={() => setFilter({ resourceType: '', action: '' })}
            className="px-3 py-2 text-xs font-semibold text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white"
          >
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-infinity-navy/40 dark:text-white/40 text-sm">No audit logs found matching your filters.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-sm font-display font-semibold text-infinity-navy dark:text-white">{date}</div>
                <div className="flex-1 h-px bg-infinity-navy/10 dark:bg-gray-700"></div>
                <span className="text-xs text-infinity-navy/40 dark:text-white/40 bg-infinity-cream dark:bg-gray-900 px-2">{dateLogs.length} events</span>
              </div>
              <div className="relative pl-8 space-y-3">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-infinity-navy/10 dark:bg-gray-700"></div>
                {dateLogs.map((log) => {
                  const meta = ACTION_META[log.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300', label: log.action }
                  return (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full bg-infinity-navy dark:bg-infinity-gold border-2 border-infinity-cream dark:border-gray-900"></div>
                      <div
                        className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-4 hover:border-infinity-navy/20 dark:hover:border-gray-600 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                            <span className="text-sm text-infinity-navy dark:text-white font-medium truncate">
                              {log.user?.full_name || 'System'}
                            </span>
                            <span className="text-xs text-infinity-navy/30 dark:text-white/30">•</span>
                            <span className="text-xs text-infinity-navy/40 dark:text-white/40 whitespace-nowrap">
                              {log.resource_type && `${RESOURCE_ICONS[log.resource_type] || '📌'} ${log.resource_type}`}
                            </span>
                          </div>
                          <span className="text-xs text-infinity-navy/30 dark:text-white/30 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {expandedLog === log.id && log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-infinity-navy/5 dark:border-gray-700">
                            <div className="text-xs font-mono bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg p-3 text-infinity-navy/60 dark:text-white/60 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Resource</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = ACTION_META[log.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300', label: log.action }
                  return (
                    <tr key={log.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50 hover:bg-infinity-cream/30 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-infinity-navy dark:text-white">{log.user?.full_name || 'System'}</div>
                        <div className="text-xs text-infinity-navy/40 dark:text-white/40">{log.user?.role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60 text-xs">
                        <span className="inline-flex items-center gap-1">
                          {RESOURCE_ICONS[log.resource_type] || '📌'}
                          <span className="capitalize">{log.resource_type}</span>
                        </span>
                        {log.resource_id && (
                          <span className="text-infinity-navy/30 dark:text-white/30 ml-1">({log.resource_id.slice(0, 8)}...)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-xs text-infinity-gold hover:underline font-medium"
                        >
                          {expandedLog === log.id ? 'Hide' : 'View'}
                        </button>
                        {expandedLog === log.id && log.details && (
                          <div className="mt-2 text-xs font-mono bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg p-2 text-infinity-navy/60 dark:text-white/60 max-w-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      {!loading && logs.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-infinity-navy/40 dark:text-white/40">
            Showing {logs.length} of {total} entries
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl">
            <p className="text-xs text-red-700 dark:text-red-400">
              <strong>Compliance:</strong> Audit logs are immutable and cannot be deleted. They are retained for 7 years per POPIA requirements.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
