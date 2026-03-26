'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function IntelligencePage() {
  const { isOfficer, isManagingPartner, isParalegal } = useAuth()
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState('intelligence')

  // Intelligence state
  const [intelligence, setIntelligence] = useState(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const [focusArea, setFocusArea] = useState('')

  // Lead Scoring state
  const [leads, setLeads] = useState([])
  const [leadScores, setLeadScores] = useState(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  // Research state
  const [researchQuery, setResearchQuery] = useState('')
  const [researchCaseType, setResearchCaseType] = useState('')
  const [researchResult, setResearchResult] = useState('')
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchHistory, setResearchHistory] = useState([])

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  // Fetch leads for scoring
  useEffect(() => {
    if (!token) return
    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setLeads(data.leads || [])
      } catch (err) {
        console.error('Fetch leads error:', err)
      }
    }
    fetchLeads()
  }, [token])

  // Generate intelligence report
  const generateIntelligence = async () => {
    if (!token) return
    setIntelLoading(true)
    try {
      const res = await fetch('/api/ai/lead-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentLeads: leads, focusArea }),
      })
      const data = await res.json()
      if (res.ok) setIntelligence(data.intelligence)
    } catch (err) {
      console.error('Intelligence error:', err)
    } finally {
      setIntelLoading(false)
    }
  }

  // Score leads
  const scoreLeads = async () => {
    if (!token || leads.length === 0) return
    setScoreLoading(true)
    try {
      const res = await fetch('/api/ai/lead-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leads: leads.slice(0, 20) }),
      })
      const data = await res.json()
      if (res.ok) setLeadScores(data.result)
    } catch (err) {
      console.error('Lead score error:', err)
    } finally {
      setScoreLoading(false)
    }
  }

  // AI Research
  const handleResearch = async (e) => {
    e.preventDefault()
    if (!researchQuery.trim() || !token) return
    setResearchLoading(true)
    setResearchResult('')
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: researchQuery, caseType: researchCaseType }),
      })
      const data = await res.json()
      if (res.ok) {
        setResearchResult(data.research)
        setResearchHistory(prev => [{ q: researchQuery, type: researchCaseType, time: new Date() }, ...prev.slice(0, 4)])
      }
    } catch (err) {
      console.error('Research error:', err)
    } finally {
      setResearchLoading(false)
    }
  }

  if (!isOfficer && !isManagingPartner && !isParalegal) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Access Restricted</h2>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm">Legal staff only.</p>
      </div>
    )
  }

  const GRADE_COLORS = {
    A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    C: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">AI Intelligence Hub</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">AI-powered insights, competitive intelligence, and legal research.</p>
        </div>
        <div className="flex items-center gap-1 bg-infinity-navy/5 dark:bg-white/5 rounded-lg p-0.5">
          {[
            { key: 'intelligence', label: '📊 Market Intel', show: isOfficer || isManagingPartner },
            { key: 'leads', label: '📞 Lead Scoring', show: true },
            { key: 'research', label: '📚 AI Research', show: true },
          ].filter(t => t.show).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.key ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-infinity-navy/50 dark:text-white/50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ MARKET INTELLIGENCE TAB ============ */}
      {activeTab === 'intelligence' && (isOfficer || isManagingPartner) && (
        <div className="space-y-6">
          {/* Generate Button */}
          <div className="bg-gradient-to-br from-infinity-navy to-infinity-navy-light rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-infinity-gold/20 rounded-xl flex items-center justify-center text-xl">📊</div>
                <div>
                  <h2 className="font-display font-bold text-lg">Competitive Intelligence</h2>
                  <p className="text-white/50 text-xs">AI-generated market analysis & lead generation strategies</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <input type="text" value={focusArea} onChange={(e) => setFocusArea(e.target.value)}
                placeholder="Optional: Focus area (e.g. 'Labour law in Gauteng')"
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30" />
              <button onClick={generateIntelligence} disabled={intelLoading}
                className="px-5 py-2.5 bg-infinity-gold text-infinity-navy rounded-xl text-sm font-semibold hover:bg-infinity-gold-light transition-colors disabled:opacity-50 whitespace-nowrap">
                {intelLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-infinity-navy/30 border-t-infinity-navy rounded-full animate-spin"></span>
                    Generating...
                  </span>
                ) : intelligence ? '🔄 Refresh Report' : '▶ Generate Report'}
              </button>
            </div>

            {!intelligence && !intelLoading && (
              <div className="text-center py-6 text-white/30">
                <p className="text-sm">Click "Generate Report" for AI-powered competitive intelligence and lead recommendations.</p>
              </div>
            )}
          </div>

          {intelligence && (
            <div className="space-y-6">
              {/* Market Overview */}
              {intelligence.marketOverview && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-infinity-navy/10 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🌍</span>
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white">Market Overview</h3>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                      intelligence.marketOverview.marketSentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      intelligence.marketOverview.marketSentiment === 'cautious' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {intelligence.marketOverview.marketSentiment}
                    </span>
                  </div>
                  <p className="text-sm text-infinity-navy/70 dark:text-white/70 mb-4">{intelligence.marketOverview.summary}</p>
                  {intelligence.marketOverview.trendingPracticeAreas && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {intelligence.marketOverview.trendingPracticeAreas.map((area, i) => (
                        <div key={i} className="p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-infinity-navy dark:text-white">{area.area}</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{area.growth}</span>
                          </div>
                          <p className="text-xs text-infinity-navy/50 dark:text-white/50">{area.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Competitor Insights */}
              {intelligence.competitorInsights && intelligence.competitorInsights.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-infinity-navy/10 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🏢</span>
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white">Competitor Analysis</h3>
                  </div>
                  <div className="space-y-4">
                    {intelligence.competitorInsights.map((comp, i) => (
                      <div key={i} className="p-4 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
                        <div className="font-semibold text-sm text-infinity-navy dark:text-white mb-2">{comp.firmType}</div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Their Strengths</div>
                            <ul className="space-y-0.5">{(comp.strengths || []).map((s, j) => <li key={j} className="text-xs text-infinity-navy/60 dark:text-white/60">• {s}</li>)}</ul>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Their Weaknesses</div>
                            <ul className="space-y-0.5">{(comp.weaknesses || []).map((w, j) => <li key={j} className="text-xs text-infinity-navy/60 dark:text-white/60">• {w}</li>)}</ul>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Our Opportunity</div>
                            <p className="text-xs text-infinity-navy/60 dark:text-white/60">{comp.opportunityForUs}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lead Recommendations */}
              {intelligence.leadRecommendations && intelligence.leadRecommendations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-infinity-navy/10 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🎯</span>
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white">Lead Generation Recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    {intelligence.leadRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 border border-infinity-navy/10 dark:border-gray-600 rounded-xl hover:border-infinity-gold/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-infinity-navy dark:text-white">{rec.category}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rec.estimatedConversion === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            rec.estimatedConversion === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{rec.estimatedConversion} conversion</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs">
                          <div><span className="font-semibold text-infinity-navy/60 dark:text-white/60">Target:</span> <span className="text-infinity-navy/80 dark:text-white/80">{rec.targetDemographic}</span></div>
                          <div><span className="font-semibold text-infinity-navy/60 dark:text-white/60">Channel:</span> <span className="text-infinity-navy/80 dark:text-white/80">{rec.channel}</span></div>
                        </div>
                        <p className="text-xs text-infinity-navy/50 dark:text-white/50 mt-2">{rec.rationale}</p>
                        <div className="mt-2 p-2 bg-infinity-gold/5 dark:bg-infinity-gold/10 rounded-lg">
                          <p className="text-xs font-medium text-infinity-navy dark:text-white">📋 Action: {rec.actionPlan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Focus */}
              {intelligence.weeklyFocus && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">🔴 Top Priority</div>
                    <p className="text-sm text-infinity-navy dark:text-white">{intelligence.weeklyFocus.topPriority}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">⚡ Quick Win</div>
                    <p className="text-sm text-infinity-navy dark:text-white">{intelligence.weeklyFocus.quickWin}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">🎯 Long-Term Play</div>
                    <p className="text-sm text-infinity-navy dark:text-white">{intelligence.weeklyFocus.longTermPlay}</p>
                  </div>
                </div>
              )}

              {/* Pricing Insights */}
              {intelligence.pricingInsights && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💰</span>
                    <h3 className="font-display font-semibold text-infinity-navy dark:text-white text-sm">Pricing Insights</h3>
                  </div>
                  <p className="text-xs text-infinity-navy/60 dark:text-white/60 mb-2">{intelligence.pricingInsights.summary}</p>
                  <ul className="space-y-1">
                    {(intelligence.pricingInsights.recommendations || []).map((r, i) => (
                      <li key={i} className="text-xs text-infinity-navy/70 dark:text-white/70 flex gap-2"><span className="text-infinity-gold">→</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ LEAD SCORING TAB ============ */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">📞</div>
                <div>
                  <h2 className="font-display font-bold text-lg">AI Lead Scoring</h2>
                  <p className="text-white/60 text-xs">AI analyzes and prioritizes {leads.length} leads for conversion</p>
                </div>
              </div>
              <button onClick={scoreLeads} disabled={scoreLoading || leads.length === 0}
                className="px-5 py-2.5 bg-white text-orange-600 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50">
                {scoreLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></span>
                    Scoring...
                  </span>
                ) : leadScores ? '🔄 Re-score' : '▶ Score Leads'}
              </button>
            </div>
            {leads.length === 0 && (
              <p className="text-white/40 text-sm mt-4">No leads in the pipeline. Add leads through the Intake system first.</p>
            )}
          </div>

          {leadScores && (
            <div className="space-y-4">
              {leadScores.insights && (
                <div className="p-4 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl border border-infinity-navy/10 dark:border-gray-700">
                  <p className="text-sm text-infinity-navy dark:text-white"><span className="font-semibold">🤖 AI Insight:</span> {leadScores.insights}</p>
                </div>
              )}

              {leadScores.scores && leadScores.scores.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                          <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Lead</th>
                          <th className="text-center px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Score</th>
                          <th className="text-center px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Grade</th>
                          <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Recommendation</th>
                          <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Talking Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadScores.scores.map((s, i) => {
                          const lead = leads.find(l => l.id === s.leadId) || {}
                          return (
                            <tr key={i} className="border-b border-infinity-navy/5 dark:border-gray-700/50">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-infinity-navy dark:text-white">{lead.full_name || s.leadId}</div>
                                <div className="text-xs text-infinity-navy/40 dark:text-white/40 capitalize">{lead.case_type} • {lead.urgency}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                                  s.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  s.score >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  s.score >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>{s.score}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${GRADE_COLORS[s.grade] || ''}`}>{s.grade}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-infinity-navy/70 dark:text-white/70 max-w-[200px]">{s.recommendation}</td>
                              <td className="px-4 py-3">
                                <ul className="space-y-0.5">
                                  {(s.talkingPoints || []).slice(0, 2).map((tp, j) => (
                                    <li key={j} className="text-xs text-infinity-navy/50 dark:text-white/50">• {tp}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ AI RESEARCH TAB ============ */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">📚</div>
              <div>
                <h2 className="font-display font-bold text-lg">AI Legal Research Assistant</h2>
                <p className="text-white/50 text-xs">South African law research powered by AI • Case law, legislation, and strategy</p>
              </div>
            </div>

            <form onSubmit={handleResearch} className="space-y-3">
              <div className="flex gap-3">
                <select value={researchCaseType} onChange={(e) => setResearchCaseType(e.target.value)}
                  className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white">
                  <option value="" className="text-gray-900">All Practice Areas</option>
                  <option value="labour" className="text-gray-900">Labour Law</option>
                  <option value="family" className="text-gray-900">Family Law</option>
                  <option value="criminal" className="text-gray-900">Criminal Law</option>
                  <option value="civil" className="text-gray-900">Civil Law</option>
                  <option value="property" className="text-gray-900">Property Law</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input type="text" value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="e.g. What are the grounds for unfair dismissal under the LRA?"
                  className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30" />
                <button type="submit" disabled={researchLoading || !researchQuery.trim()}
                  className="px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                  {researchLoading ? '...' : '🔍 Research'}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                'CCMA referral deadlines',
                'Grounds for divorce under SA law',
                'Prescription periods for civil claims',
                'Eviction procedures under PIE Act',
                'Maintenance order enforcement',
              ].map((q, i) => (
                <button key={i} onClick={() => setResearchQuery(q)}
                  className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white/60 hover:bg-white/20 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Research Loading */}
          {researchLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 text-center">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-infinity-navy/50 dark:text-white/50">AI is researching South African law databases...</p>
            </div>
          )}

          {/* Research Result */}
          {researchResult && !researchLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-infinity-navy/10 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <h3 className="font-display font-semibold text-infinity-navy dark:text-white">Research Results</h3>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-semibold">AI Generated</span>
              </div>
              <div className="prose prose-sm max-w-none text-infinity-navy/80 dark:text-white/80 
                prose-headings:text-infinity-navy dark:prose-headings:text-white 
                prose-strong:text-infinity-navy dark:prose-strong:text-white
                prose-li:text-infinity-navy/70 dark:prose-li:text-white/70">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{researchResult}</div>
              </div>
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  <strong>⚠️ Disclaimer:</strong> This is AI-generated research and must be verified by a qualified South African attorney before being relied upon. 
                  AI research does not constitute legal advice.
                </p>
              </div>
            </div>
          )}

          {/* Research History */}
          {researchHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-infinity-navy/40 dark:text-white/40 mb-2">Recent Queries</h4>
              <div className="space-y-1">
                {researchHistory.map((rh, i) => (
                  <button key={i} onClick={() => { setResearchQuery(rh.q); setResearchCaseType(rh.type) }}
                    className="block w-full text-left text-xs text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white p-1.5 rounded hover:bg-infinity-cream/50 dark:hover:bg-gray-700/50 transition-colors">
                    🔍 {rh.q} <span className="text-infinity-navy/20 dark:text-white/20">• {rh.time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
