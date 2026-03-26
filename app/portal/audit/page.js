'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ACTION_META = {
  CREATE_LEAD: { icon: '➕', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Lead Created' },
  LEAD_QUALIFY: { icon: '✅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Lead Qualified' },
  LEAD_ASSIGN_PARALEGAL: { icon: '📝', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', label: 'Lead Assigned' },
  LEAD_READY_FOR_STRATEGY: { icon: '⚖️', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Strategy Review' },
  LEAD_CONVERT: { icon: '🎉', color: 'bg-amber-100 text-amber-700 dark:text-amber-400', label: 'Lead Converted' },
  CREATE_PRIVILEGED_NOTE: { icon: '🔒', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Privileged Note' },
  VIEW_PRIVILEGED_NOTES: { icon: '👁️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Notes Viewed' },
  DOCUMENT_APPROVED: { icon: '📄', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Doc Approved' },
  DOCUMENT_SIGNED: { icon: '🖊️', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Doc Signed' },
  CREATE_STAFF_USER: { icon: '👤', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Staff Created' },
  DOCUMENT_STATUS_CHANGE: { icon: '📋', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Doc Changed' },
}

const RESOURCE_ICONS = { lead: '📞', case: '📁', document: '📄', privileged_note: '🔒', user: '👤' }

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const SEVERITY_ICONS = { info: 'ℹ️', warning: '⚠️', alert: '🚨', critical: '🔴' }

export default function AuditLogPage() {
  const { isManagingPartner, isITAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState({ resourceType: '', action: '' })
  const [expandedLog, setExpandedLog] = useState(null)
  const [viewMode, setViewMode] = useState('ai') // 'ai', 'timeline', 'table'
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiQueryLoading, setAiQueryLoading] = useState(false)
  const [queryHistory, setQueryHistory] = useState([])

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
      params.set('limit', '100')

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

  // AI Audit Analysis
  const runAIAnalysis = async () => {
    if (!token || logs.length === 0) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/audit-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logs: logs.slice(0, 50) }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiAnalysis(data.analysis)
      } else {
        console.error('AI analysis error:', data.error)
      }
    } catch (err) {
      console.error('AI analysis error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  // AI Query
  const handleAIQuery = async (e) => {
    e.preventDefault()
    if (!aiQuery.trim() || !token) return
    setAiQueryLoading(true)
    setAiAnswer('')
    try {
      const res = await fetch('/api/ai/audit-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: aiQuery, logs: logs.slice(0, 50) }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiAnswer(data.answer)
        setQueryHistory(prev => [{ q: aiQuery, a: data.answer, time: new Date() }, ...prev.slice(0, 4)])
      }
    } catch (err) {
      console.error('AI query error:', err)
    } finally {
      setAiQueryLoading(false)
    }
  }

  if (!isManagingPartner && !isITAdmin) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Access Restricted</h2>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm">Only Managing Partners and IT Admins can view audit logs.</p>
      </div>
    )
  }

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
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">AI-Powered Audit Trail</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            Intelligent security monitoring with <span className="font-semibold">{total}</span> entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-infinity-navy/5 dark:bg-white/5 rounded-lg p-0.5">
            {['ai', 'timeline', 'table'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === mode ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-infinity-navy/50 dark:text-white/50'
                }`}>
                {mode === 'ai' ? '🤖 AI Analysis' : mode === 'timeline' ? '📅 Timeline' : '📋 Table'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filter.resourceType} onChange={(e) => setFilter({...filter, resourceType: e.target.value})}
          className="px-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
          <option value="">All Resources</option>
          <option value="lead">📞 Leads</option>
          <option value="case">📁 Cases</option>
          <option value="document">📄 Documents</option>
          <option value="privileged_note">🔒 Privileged Notes</option>
          <option value="user">👤 Users</option>
        </select>
        <select value={filter.action} onChange={(e) => setFilter({...filter, action: e.target.value})}
          className="px-4 py-2 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
          <option value="">All Actions</option>
          <option value="CREATE_LEAD">Create Lead</option>
          <option value="LEAD_QUALIFY">Qualify Lead</option>
          <option value="CREATE_STAFF_USER">Create Staff</option>
          <option value="CREATE_PRIVILEGED_NOTE">Privileged Note</option>
          <option value="DOCUMENT_APPROVED">Doc Approved</option>
          <option value="DOCUMENT_SIGNED">Doc Signed</option>
        </select>
        {(filter.resourceType || filter.action) && (
          <button onClick={() => setFilter({ resourceType: '', action: '' })} className="px-3 py-2 text-xs font-semibold text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">
            Clear ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-infinity-navy/40 dark:text-white/40 text-sm">Loading audit trail...</p>
        </div>
      ) : viewMode === 'ai' ? (
        /* ============ AI ANALYSIS VIEW ============ */
        <div className="space-y-6">
          {/* AI Analysis Panel */}
          <div className="bg-gradient-to-br from-infinity-navy to-infinity-navy-light rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-infinity-gold/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h2 className="font-display font-bold text-lg">AI Audit Analyst</h2>
                  <p className="text-white/50 text-xs">Powered by AI • Analyzes {logs.length} entries</p>
                </div>
              </div>
              <button onClick={runAIAnalysis} disabled={aiLoading || logs.length === 0}
                className="px-4 py-2 bg-infinity-gold text-infinity-navy rounded-xl text-sm font-semibold hover:bg-infinity-gold-light transition-colors disabled:opacity-50">
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-infinity-navy/30 border-t-infinity-navy rounded-full animate-spin"></span>
                    Analyzing...
                  </span>
                ) : aiAnalysis ? '🔄 Re-analyze' : '▶ Run AI Analysis'}
              </button>
            </div>

            {!aiAnalysis && !aiLoading && (
              <div className="text-center py-8 text-white/40">
                <p className="text-sm">Click "Run AI Analysis" to have AI review your audit logs for patterns, anomalies, and compliance insights.</p>
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-4 mt-4">
                {/* Risk Score */}
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                  <div className="text-center">
                    <div className={`text-4xl font-display font-bold ${
                      aiAnalysis.riskScore <= 30 ? 'text-green-400' :
                      aiAnalysis.riskScore <= 60 ? 'text-yellow-400' :
                      aiAnalysis.riskScore <= 80 ? 'text-orange-400' : 'text-red-400'
                    }`}>{aiAnalysis.riskScore}</div>
                    <div className="text-xs text-white/50">Risk Score</div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1 ${RISK_COLORS[aiAnalysis.riskLevel] || ''}`}>
                      {aiAnalysis.riskLevel?.toUpperCase()} RISK
                    </div>
                    <p className="text-sm text-white/80">{aiAnalysis.summary}</p>
                  </div>
                </div>

                {/* Patterns */}
                {aiAnalysis.patterns && aiAnalysis.patterns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-2">Detected Patterns</h3>
                    <div className="space-y-2">
                      {aiAnalysis.patterns.map((p, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{SEVERITY_ICONS[p.severity] || 'ℹ️'}</span>
                            <span className="text-sm font-semibold text-white">{p.title}</span>
                            <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              p.severity === 'alert' ? 'bg-orange-500/20 text-orange-300' :
                              p.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>{p.type}</span>
                          </div>
                          <p className="text-xs text-white/60">{p.description}</p>
                          <p className="text-xs text-infinity-gold mt-1">→ {p.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-2">AI Recommendations</h3>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            r.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            r.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>{r.priority?.toUpperCase()}</span>
                          <div>
                            <div className="text-sm font-medium text-white">{r.action}</div>
                            <div className="text-xs text-white/50">{r.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Notes */}
                {aiAnalysis.complianceNotes && aiAnalysis.complianceNotes.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-sm font-semibold text-white/70 mb-2">📋 Compliance Notes</h3>
                    <ul className="space-y-1">
                      {aiAnalysis.complianceNotes.map((note, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                          <span className="text-infinity-gold shrink-0">•</span>{note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ask the Audit — AI Query */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-infinity-navy/10 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-infinity-gold/10 rounded-lg flex items-center justify-center text-lg">💬</div>
              <div>
                <h3 className="font-display font-semibold text-infinity-navy dark:text-white">Ask the Audit</h3>
                <p className="text-xs text-infinity-navy/40 dark:text-white/40">Ask questions about your audit trail in natural language</p>
              </div>
            </div>
            
            <form onSubmit={handleAIQuery} className="flex gap-2 mb-4">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. Who accessed the most privileged notes this month?"
                className="flex-1 px-4 py-2.5 border border-infinity-navy/10 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
              />
              <button type="submit" disabled={aiQueryLoading || !aiQuery.trim()}
                className="px-5 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap">
                {aiQueryLoading ? '...' : 'Ask AI'}
              </button>
            </form>

            {/* Suggested queries */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'Any suspicious activity recently?',
                'Who viewed privileged notes most often?',
                'Are there any POPIA compliance concerns?',
                'Summarize document approval patterns',
              ].map((q, i) => (
                <button key={i} onClick={() => setAiQuery(q)}
                  className="px-3 py-1 bg-infinity-navy/5 dark:bg-white/5 rounded-lg text-xs text-infinity-navy/60 dark:text-white/60 hover:bg-infinity-navy/10 dark:hover:bg-white/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* AI Answer */}
            {aiQueryLoading && (
              <div className="p-4 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-2 text-infinity-navy/40 dark:text-white/40">
                  <div className="w-4 h-4 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">AI is analyzing your audit data...</span>
                </div>
              </div>
            )}

            {aiAnswer && !aiQueryLoading && (
              <div className="p-4 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl border border-infinity-navy/5 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-semibold text-infinity-navy/40 dark:text-white/40">AI Response</span>
                </div>
                <div className="text-sm text-infinity-navy dark:text-white/90 whitespace-pre-wrap leading-relaxed">{aiAnswer}</div>
              </div>
            )}

            {/* Query History */}
            {queryHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-infinity-navy/5 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-infinity-navy/40 dark:text-white/40 mb-2">Previous Queries</h4>
                <div className="space-y-2">
                  {queryHistory.map((qh, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">
                        <span className="text-infinity-gold">Q:</span> {qh.q}
                        <span className="ml-auto text-[10px] text-infinity-navy/30 dark:text-white/30">{qh.time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </summary>
                      <div className="mt-1 ml-4 p-2 bg-infinity-cream/30 dark:bg-gray-700/30 rounded-lg text-xs text-infinity-navy/70 dark:text-white/70 whitespace-pre-wrap">{qh.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent activity still visible below */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
              <h3 className="text-sm font-semibold text-infinity-navy dark:text-white">Recent Activity ({logs.length} entries)</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {logs.slice(0, 20).map((log) => {
                const meta = ACTION_META[log.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600', label: log.action }
                return (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-infinity-navy/5 dark:border-gray-700/50 text-sm">
                    <span className="text-xs text-infinity-navy/30 dark:text-white/30 w-20 shrink-0">{new Date(log.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap ${meta.color}`}>{meta.icon} {meta.label}</span>
                    <span className="text-sm text-infinity-navy dark:text-white truncate">{log.user?.full_name || 'System'}</span>
                    <span className="text-xs text-infinity-navy/30 dark:text-white/30 ml-auto">{RESOURCE_ICONS[log.resource_type]} {log.resource_type}</span>
                  </div>
                )
              })}
              {logs.length === 0 && <div className="text-center py-8 text-infinity-navy/30 dark:text-white/30 text-sm">No audit logs found</div>}
            </div>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-sm font-display font-semibold text-infinity-navy dark:text-white">{date}</div>
                <div className="flex-1 h-px bg-infinity-navy/10 dark:bg-gray-700"></div>
                <span className="text-xs text-infinity-navy/40 dark:text-white/40">{dateLogs.length} events</span>
              </div>
              <div className="relative pl-8 space-y-3">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-infinity-navy/10 dark:bg-gray-700"></div>
                {dateLogs.map((log) => {
                  const meta = ACTION_META[log.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600', label: log.action }
                  return (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full bg-infinity-navy dark:bg-infinity-gold border-2 border-infinity-cream dark:border-gray-900"></div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-4 hover:border-infinity-navy/20 dark:hover:border-gray-600 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${meta.color}`}>{meta.icon} {meta.label}</span>
                            <span className="text-sm text-infinity-navy dark:text-white font-medium truncate">{log.user?.full_name || 'System'}</span>
                            <span className="text-xs text-infinity-navy/30 dark:text-white/30">•</span>
                            <span className="text-xs text-infinity-navy/40 dark:text-white/40">{RESOURCE_ICONS[log.resource_type]} {log.resource_type}</span>
                          </div>
                          <span className="text-xs text-infinity-navy/30 dark:text-white/30 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {expandedLog === log.id && log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-infinity-navy/5 dark:border-gray-700">
                            <div className="text-xs font-mono bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg p-3 text-infinity-navy/60 dark:text-white/60">{JSON.stringify(log.details, null, 2)}</div>
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
                  const meta = ACTION_META[log.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600', label: log.action }
                  return (
                    <tr key={log.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50 hover:bg-infinity-cream/30 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-infinity-navy dark:text-white">{log.user?.full_name || 'System'}</div>
                        <div className="text-xs text-infinity-navy/40 dark:text-white/40">{log.user?.role}</div>
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${meta.color}`}>{meta.icon} {meta.label}</span></td>
                      <td className="px-4 py-3 text-xs text-infinity-navy/60 dark:text-white/60"><span className="inline-flex items-center gap-1">{RESOURCE_ICONS[log.resource_type]} <span className="capitalize">{log.resource_type}</span></span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="text-xs text-infinity-gold hover:underline font-medium">{expandedLog === log.id ? 'Hide' : 'View'}</button>
                        {expandedLog === log.id && log.details && <div className="mt-2 text-xs font-mono bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg p-2 text-infinity-navy/60 dark:text-white/60 max-w-xs overflow-x-auto">{JSON.stringify(log.details, null, 2)}</div>}
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
      {!loading && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-infinity-navy/40 dark:text-white/40">
            Showing {logs.length} of {total} • AI-analyzed for patterns and anomalies
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl">
            <p className="text-xs text-red-700 dark:text-red-400"><strong>Compliance:</strong> Audit logs are immutable. Retained for 7 years per POPIA.</p>
          </div>
        </div>
      )}
    </div>
  )
}
