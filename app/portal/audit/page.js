'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuditLogPage() {
  const { isManagingPartner, isITAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState({ resourceType: '', action: '' })

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
    return <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Access denied. Only Managing Partners and IT Admins can view audit logs.</div>
  }

  const ACTION_COLORS = {
    CREATE_LEAD: 'text-green-600',
    LEAD_QUALIFY: 'text-blue-600',
    LEAD_ASSIGN_PARALEGAL: 'text-teal-600',
    LEAD_READY_FOR_STRATEGY: 'text-purple-600',
    LEAD_CONVERT: 'text-infinity-gold',
    CREATE_PRIVILEGED_NOTE: 'text-red-600',
    VIEW_PRIVILEGED_NOTES: 'text-orange-600',
    DOCUMENT_APPROVED: 'text-green-600',
    DOCUMENT_SIGNED: 'text-infinity-navy',
    CREATE_STAFF_USER: 'text-blue-600',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Audit Logs</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Complete trail of all sensitive actions. {total} total entries.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filter.resourceType}
          onChange={(e) => setFilter({...filter, resourceType: e.target.value})}
          className="px-3 py-1.5 border border-infinity-navy/10 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
        >
          <option value="">All Resources</option>
          <option value="lead">Leads</option>
          <option value="case">Cases</option>
          <option value="document">Documents</option>
          <option value="privileged_note">Privileged Notes</option>
          <option value="user">Users</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Resource</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50">
                    <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-ZA')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-infinity-navy dark:text-white">{log.user?.full_name || 'System'}</div>
                      <div className="text-xs text-infinity-navy/40 dark:text-white/40">{log.user?.role}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-semibold ${ACTION_COLORS[log.action] || 'text-infinity-navy dark:text-white'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60 text-xs">
                      {log.resource_type} {log.resource_id ? `(${log.resource_id.slice(0, 8)}...)` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-infinity-navy/40 dark:text-white/40 max-w-xs truncate">
                      {JSON.stringify(log.details || {}).slice(0, 80)}
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
