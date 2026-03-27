'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const URGENCY_COLORS = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
}

const STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  converted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dismissed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const CATEGORIES = [
  'Criminal Law', 'Family Law', 'Labour Law', 'Personal Injury', 'Property Law',
  'Debt Recovery', 'Civil Litigation', 'Commercial Law', 'Administrative Law', 'Other'
]

export default function IntakesPage() {
  const { profile, user } = useAuth()
  const [token, setToken] = useState(null)
  const [intakes, setIntakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIntake, setSelectedIntake] = useState(null)
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(null)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertForm, setConvertForm] = useState({ case_subtype: '', urgency: '', attorney_id: '', description: '' })

  useEffect(() => {
    const getToken = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.access_token) {
        setToken(data.session.access_token)
      }
    }
    getToken()
  }, [])

  const fetchIntakes = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      let url = '/api/intakes?'
      if (filter !== 'all') url += `status=${filter}&`
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setIntakes(data.intakes || [])
      }
    } catch (err) {
      console.error('Fetch intakes error:', err)
    }
    setLoading(false)
  }, [token, filter, categoryFilter, searchQuery])

  useEffect(() => {
    if (token) fetchIntakes()
  }, [token, fetchIntakes])

  const openConvertModal = (intake) => {
    setSelectedIntake(intake)
    setConvertForm({
      case_subtype: intake.analysis?.subcategory || intake.analysis?.category || '',
      urgency: intake.analysis?.urgency || 'medium',
      attorney_id: user?.id || '',
      description: intake.analysis?.summary || '',
    })
    setShowConvertModal(true)
    setConvertSuccess(null)
  }

  const handleConvert = async () => {
    if (!selectedIntake || !token) return
    setConverting(true)
    try {
      const res = await fetch(`/api/intakes/${selectedIntake.id}/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(convertForm),
      })
      const data = await res.json()
      if (res.ok) {
        setConvertSuccess(data)
        setShowConvertModal(false)
        fetchIntakes()
      } else {
        alert(data.error || 'Failed to convert intake')
      }
    } catch (err) {
      console.error('Convert error:', err)
      alert('Failed to convert intake')
    }
    setConverting(false)
  }

  const pendingCount = intakes.filter(i => i.status === 'pending').length
  const convertedCount = intakes.filter(i => i.status === 'converted').length
  const emergencyCount = intakes.filter(i => i.analysis?.urgency === 'emergency' && i.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          AI Intake Submissions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review AI-analyzed legal intake submissions and convert them to active cases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue-600">{intakes.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Submissions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Pending Review</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600">{convertedCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Converted to Cases</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red-600">{emergencyCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Emergency Intakes</div>
        </div>
      </div>

      {/* Success Banner */}
      {convertSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">{convertSuccess.message}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Case Number: {convertSuccess.caseNumber} — AI analysis saved as case note</p>
            </div>
          </div>
          <button onClick={() => setConvertSuccess(null)} className="text-green-600 hover:text-green-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-sm">
            {['all', 'pending', 'converted', 'dismissed'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >{s}</button>
            ))}
          </div>

          {/* Category Filter */}
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search intakes..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Intakes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading intake submissions...</p>
        </div>
      ) : intakes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">No intake submissions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">AI intake submissions from the public website will appear here for review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {intakes.map(intake => (
            <div key={intake.id} className={`bg-white dark:bg-gray-800 rounded-xl border ${intake.analysis?.urgency === 'emergency' ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} hover:shadow-md transition-shadow`}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Top row: category + badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {intake.analysis?.category || 'Uncategorized'}
                        {intake.analysis?.subcategory && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal"> — {intake.analysis.subcategory}</span>
                        )}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[intake.status] || STATUS_COLORS.pending}`}>
                        {intake.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${URGENCY_COLORS[intake.analysis?.urgency] || URGENCY_COLORS.medium}`}>
                        {intake.analysis?.urgency || 'medium'}
                      </span>
                      {intake.analysis?.confidence && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {intake.analysis.confidence}% confidence
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{intake.analysis?.summary || 'No summary available'}</p>

                    {/* Metadata row */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <span>📅 {new Date(intake.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {intake.userEmail && <span>👤 {intake.userEmail}</span>}
                      {intake.analysis?.estimatedCostRange && <span>💰 {intake.analysis.estimatedCostRange}</span>}
                      {intake.analysis?.estimatedTimeline && <span>⏱ {intake.analysis.estimatedTimeline}</span>}
                      {intake.convertedCaseNumber && <span className="text-green-600 font-semibold">✅ → {intake.convertedCaseNumber}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => setSelectedIntake(selectedIntake?.id === intake.id ? null : intake)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {selectedIntake?.id === intake.id ? 'Close' : 'Details'}
                    </button>
                    {intake.status === 'pending' && (
                      <button
                        onClick={() => openConvertModal(intake)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Convert to Case
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedIntake?.id === intake.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Client's Description */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Client's Problem Description</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                          {intake.responses?.problem || 'No description provided'}
                        </div>
                        {intake.responses?.timeline && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Timeline: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{intake.responses.timeline}</span>
                          </div>
                        )}
                        {intake.responses?.outcome && (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Desired Outcome: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{intake.responses.outcome}</span>
                          </div>
                        )}
                        {intake.responses?.parties && (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Parties: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{intake.responses.parties}</span>
                          </div>
                        )}
                        {intake.responses?.documents && (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Documents: </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{intake.responses.documents}</span>
                          </div>
                        )}
                      </div>

                      {/* AI Analysis */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">AI Analysis</h4>
                        
                        {intake.analysis?.nextSteps?.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recommended Next Steps:</span>
                            <ol className="list-decimal list-inside mt-1 space-y-0.5">
                              {intake.analysis.nextSteps.map((step, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {intake.analysis?.relevantLegislation?.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Relevant Legislation:</span>
                            <ul className="mt-1 space-y-0.5">
                              {intake.analysis.relevantLegislation.map((law, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1">
                                  <span className="text-amber-500">§</span> {law}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {intake.analysis?.warnings?.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                            <span className="text-xs font-bold text-red-700 dark:text-red-400">⚠️ Warnings:</span>
                            <ul className="mt-1 space-y-0.5">
                              {intake.analysis.warnings.map((w, i) => (
                                <li key={i} className="text-xs text-red-600 dark:text-red-400">{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && selectedIntake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Convert Intake to Case
                </h2>
                <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Source Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">AI Intake Source</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  <strong>{selectedIntake.analysis?.category}</strong> — {selectedIntake.analysis?.subcategory}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Confidence: {selectedIntake.analysis?.confidence}% • Cost: {selectedIntake.analysis?.estimatedCostRange}</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Title / Subtype</label>
                  <input
                    type="text" value={convertForm.case_subtype}
                    onChange={e => setConvertForm(p => ({ ...p, case_subtype: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Unfair Dismissal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
                  <select value={convertForm.urgency}
                    onChange={e => setConvertForm(p => ({ ...p, urgency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Description</label>
                  <textarea
                    value={convertForm.description} rows={4}
                    onChange={e => setConvertForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Case summary..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleConvert} disabled={converting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-2">
                  {converting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Converting...</>
                  ) : (
                    <>Create Case from Intake</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
