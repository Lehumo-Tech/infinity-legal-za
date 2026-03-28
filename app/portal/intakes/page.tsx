'use client'

import React, { useState } from 'react'
import { useIntakeList } from '@/hooks/useIntakeList'
import { useIntakeConvert } from '@/hooks/useIntakeConvert'
import {
  getUrgencyColor,
  getStatusColor,
  formatDate,
  LEGAL_CATEGORIES,
  type IntakeSubmission,
  type IntakeStatus,
} from '@/lib/intake'

/* ─── Brand Tokens ─── */
const NAVY = '#0f2b46'
const GOLD = '#c9a961'

/* ─── Stat Card (Pure UI) ─── */
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-shadow hover:shadow-md">
      <div className="text-3xl font-extrabold" style={{ color: accent }}>{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  )
}

/* ─── Badge ─── */
function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${className}`}>
      {text}
    </span>
  )
}

/* ─── Intake Card (Pure UI) ─── */
function IntakeCard({
  intake,
  isExpanded,
  onToggleDetails,
  onConvert,
}: {
  intake: IntakeSubmission
  isExpanded: boolean
  onToggleDetails: () => void
  onConvert: () => void
}) {
  const isEmergency = intake.analysis?.urgency === 'emergency'
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border ${
        isEmergency ? 'border-red-300 dark:border-red-700 ring-1 ring-red-200' : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-lg transition-all duration-200`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Category + Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>
                {intake.analysis?.category || 'Uncategorized'}
                {intake.analysis?.subcategory && (
                  <span className="text-gray-400 font-normal"> — {intake.analysis.subcategory}</span>
                )}
              </h3>
              <Badge text={intake.status} className={getStatusColor(intake.status)} />
              <Badge text={intake.analysis?.urgency || 'medium'} className={getUrgencyColor(intake.analysis?.urgency || 'medium')} />
              {intake.analysis?.confidence && (
                <Badge
                  text={`${intake.analysis.confidence}% confidence`}
                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                />
              )}
            </div>
            {/* Summary */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
              {intake.analysis?.summary || 'No summary available'}
            </p>
            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span>📅 {formatDate(intake.createdAt)}</span>
              {intake.userEmail && <span>👤 {intake.userEmail}</span>}
              {intake.analysis?.estimatedCostRange && <span>💰 {intake.analysis.estimatedCostRange}</span>}
              {intake.analysis?.estimatedTimeline && <span>⏱ {intake.analysis.estimatedTimeline}</span>}
              {intake.convertedCaseNumber && (
                <span className="font-semibold" style={{ color: GOLD }}>✅ → {intake.convertedCaseNumber}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleDetails}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isExpanded ? 'Close' : 'Details'}
            </button>
            {intake.status === 'pending' && (
              <button
                onClick={onConvert}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1"
                style={{ backgroundColor: NAVY }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Convert to Case
              </button>
            )}
          </div>
        </div>

        {/* Expanded Detail */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Client Problem */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Client's Problem</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                  {intake.responses?.problem || 'No description'}
                </div>
                {intake.responses?.timeline && (
                  <p className="mt-2 text-xs"><span className="font-semibold text-gray-500">Timeline:</span> <span className="text-gray-600 dark:text-gray-300">{intake.responses.timeline}</span></p>
                )}
                {intake.responses?.outcome && (
                  <p className="mt-1 text-xs"><span className="font-semibold text-gray-500">Desired Outcome:</span> <span className="text-gray-600 dark:text-gray-300">{intake.responses.outcome}</span></p>
                )}
                {intake.responses?.parties && (
                  <p className="mt-1 text-xs"><span className="font-semibold text-gray-500">Parties:</span> <span className="text-gray-600 dark:text-gray-300">{intake.responses.parties}</span></p>
                )}
                {intake.responses?.documents && (
                  <p className="mt-1 text-xs"><span className="font-semibold text-gray-500">Documents:</span> <span className="text-gray-600 dark:text-gray-300">{intake.responses.documents}</span></p>
                )}
              </div>
              {/* Right: AI Analysis */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>AI Analysis</h4>
                {(intake.analysis?.nextSteps?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-600">Recommended Next Steps:</span>
                    <ol className="list-decimal list-inside mt-1 space-y-0.5">
                      {intake.analysis!.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {(intake.analysis?.relevantLegislation?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-600">Relevant Legislation:</span>
                    <ul className="mt-1 space-y-0.5">
                      {intake.analysis!.relevantLegislation.map((law, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1">
                          <span style={{ color: GOLD }}>§</span> {law}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(intake.analysis?.warnings?.length ?? 0) > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                    <span className="text-xs font-bold text-red-700 dark:text-red-400">⚠️ Warnings:</span>
                    <ul className="mt-1 space-y-0.5">
                      {intake.analysis!.warnings.map((w, i) => (
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
  )
}

/* ─── Convert Modal (Pure UI) ─── */
function ConvertModal({
  intake,
  form,
  validationErrors,
  converting,
  onSetField,
  onConvert,
  onClose,
}: {
  intake: IntakeSubmission
  form: { caseSubtype: string; urgency: string; description: string }
  validationErrors: Record<string, string>
  converting: boolean
  onSetField: (key: string, value: string) => void
  onConvert: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: NAVY }}>
              <svg className="w-5 h-5" style={{ color: GOLD }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Convert Intake to Case
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Source Info */}
          <div className="rounded-lg p-3 mb-4 border" style={{ backgroundColor: `${NAVY}08`, borderColor: `${NAVY}20` }}>
            <p className="text-xs font-semibold" style={{ color: GOLD }}>AI Intake Source</p>
            <p className="text-sm mt-1" style={{ color: NAVY }}>
              <strong>{intake.analysis?.category}</strong> — {intake.analysis?.subcategory}
            </p>
            <p className="text-xs mt-1" style={{ color: `${NAVY}99` }}>
              Confidence: {intake.analysis?.confidence}% • Cost: {intake.analysis?.estimatedCostRange}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Title / Subtype</label>
              <input
                type="text"
                value={form.caseSubtype}
                onChange={(e) => onSetField('caseSubtype', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  validationErrors.caseSubtype ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Unfair Dismissal"
              />
              {validationErrors.caseSubtype && <p className="text-xs text-red-500 mt-1">{validationErrors.caseSubtype}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => onSetField('urgency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Description</label>
              <textarea
                value={form.description}
                rows={4}
                onChange={(e) => onSetField('description', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Case summary..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={onConvert}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {converting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Converting...</>
              ) : (
                'Create Case from Intake'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE — Only orchestrates hooks + UI
   ═══════════════════════════════════════════ */
export default function IntakesPage() {
  const { intakes, loading, error, stats, filters, setFilter, refresh } = useIntakeList()
  const convertHook = useIntakeConvert()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [convertingIntake, setConvertingIntake] = useState<IntakeSubmission | null>(null)

  const openConvert = (intake: IntakeSubmission) => {
    convertHook.prefillFromIntake(intake)
    setConvertingIntake(intake)
  }

  const handleConvert = async () => {
    if (!convertingIntake) return
    const ok = await convertHook.convert(convertingIntake.id)
    if (ok) {
      setConvertingIntake(null)
      refresh()
    }
  }

  const statusTabs: Array<IntakeStatus | 'all'> = ['all', 'pending', 'converted', 'dismissed']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: NAVY }}>
          <svg className="w-7 h-7" style={{ color: GOLD }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Intake Submissions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review AI-analyzed legal intake submissions and convert them to active cases
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Submissions" value={stats.total} accent={NAVY} />
        <StatCard label="Pending Review" value={stats.pending} accent={GOLD} />
        <StatCard label="Converted to Cases" value={stats.converted} accent="#22c55e" />
        <StatCard label="Emergency Intakes" value={stats.emergency} accent="#ef4444" />
      </div>

      {/* Success Banner */}
      {convertHook.result && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{convertHook.result.message}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Case Number: {convertHook.result.caseNumber}</p>
            </div>
          </div>
          <button onClick={convertHook.reset} className="text-emerald-600 hover:text-emerald-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-sm">
            {statusTabs.map((s) => (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`px-3.5 py-1.5 capitalize font-medium transition-colors ${
                  filters.status === s
                    ? 'text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                style={filters.status === s ? { backgroundColor: NAVY } : undefined}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value as typeof filters.category)}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="">All Categories</option>
            {LEGAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search intakes..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Loading intake submissions...</p>
        </div>
      ) : intakes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: `${NAVY}30` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">No intake submissions</p>
          <p className="text-sm text-gray-400">AI intake submissions from the public website will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {intakes.map((intake) => (
            <IntakeCard
              key={intake.id}
              intake={intake}
              isExpanded={expandedId === intake.id}
              onToggleDetails={() => setExpandedId(expandedId === intake.id ? null : intake.id)}
              onConvert={() => openConvert(intake)}
            />
          ))
          }
        </div>
      )}

      {/* Convert Modal */}
      {convertingIntake && (
        <ConvertModal
          intake={convertingIntake}
          form={convertHook.form}
          validationErrors={convertHook.validationErrors}
          converting={convertHook.converting}
          onSetField={(k, v) => convertHook.setField(k as 'caseSubtype' | 'urgency' | 'description', v as never)}
          onConvert={handleConvert}
          onClose={() => { setConvertingIntake(null); convertHook.reset() }}
        />
      )}
    </div>
  )
}
