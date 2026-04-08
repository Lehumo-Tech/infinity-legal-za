'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PRIORITY_COLORS = {
  hot: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  warm: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  cool: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  cold: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
}

export default function LeadsDashboardPage() {
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState('leads')
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cool: 0, cold: 0 })
  const [redditPosts, setRedditPosts] = useState([])
  const [redditLoading, setRedditLoading] = useState(false)
  const [redditError, setRedditError] = useState('')
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLeadsLoading(true)
    try {
      const res = await fetch('/api/waitlist')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setStats(data.stats || { total: 0, hot: 0, warm: 0, cool: 0, cold: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLeadsLoading(false)
    }
  }

  const fetchRedditLeads = async () => {
    setRedditLoading(true)
    setRedditError('')
    try {
      const res = await fetch('/api/reddit-leads')
      if (res.ok) {
        const data = await res.json()
        setRedditPosts(data.posts || [])
      } else {
        setRedditError('Failed to fetch Reddit leads')
      }
    } catch (err) {
      setRedditError('Network error fetching Reddit leads')
    } finally {
      setRedditLoading(false)
    }
  }

  const filteredLeads = filterPriority ? leads.filter(l => l.priority === filterPriority) : leads

  const consentFormUrl = typeof window !== 'undefined' ? `${window.location.origin}/signup` : '/signup'

  return (
    <div className="max-w-7xl mx-auto">
      {/* Compliance Banner */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl flex items-center gap-3">
        <span className="text-lg">🛡️</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-800 dark:text-blue-400">POPIA Compliant Lead Management</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-500">Only respond to public requests for help. Never send unsolicited DMs. Always link to the consent form when engaging publicly.</p>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Lead Intelligence</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40 mt-0.5">Qualified leads & social listening dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Leads', value: stats.total, color: 'bg-infinity-navy text-white' },
          { label: 'Hot', value: stats.hot, color: 'bg-red-500 text-white', emoji: '🔥' },
          { label: 'Warm', value: stats.warm, color: 'bg-orange-500 text-white', emoji: '🟠' },
          { label: 'Cool', value: stats.cool, color: 'bg-blue-500 text-white', emoji: '🔵' },
          { label: 'Cold', value: stats.cold, color: 'bg-gray-400 text-white', emoji: '⚪' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-xl p-3 text-center`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-80">{stat.emoji || ''} {stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${activeTab === 'leads' ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-gray-500 hover:text-infinity-navy'}`}>
          📋 Registered Leads ({stats.total})
        </button>
        <button onClick={() => { setActiveTab('reddit'); if (redditPosts.length === 0) fetchRedditLeads() }} className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${activeTab === 'reddit' ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-gray-500 hover:text-infinity-navy'}`}>
          🔍 Social Listening ({redditPosts.length})
        </button>
      </div>

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 font-semibold">Filter:</span>
            {['', 'hot', 'warm', 'cool', 'cold'].map(p => (
              <button key={p || 'all'} onClick={() => setFilterPriority(p)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filterPriority === p ? 'bg-infinity-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
                {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All'}
              </button>
            ))}
          </div>

          {leadsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-infinity-gold/30 border-t-infinity-gold rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-400">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-sm text-gray-500">No leads yet. Share your registration link to start capturing leads.</p>
              <p className="text-xs text-gray-400 mt-1">Registration URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{consentFormUrl}</code></p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Priority</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Legal Need</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Source</th>
                      <th className="py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, i) => {
                      const pc = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.cold
                      return (
                        <tr key={lead.id || i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                              {(lead.priority || 'cold').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-infinity-navy dark:text-white">{lead.name || '—'}</td>
                          <td className="py-2.5 px-4 text-gray-600 dark:text-gray-300">{lead.email || '—'}</td>
                          <td className="py-2.5 px-4">
                            {lead.legal_need ? (
                              <span className="inline-block px-2 py-0.5 bg-infinity-gold/10 text-infinity-gold text-[10px] font-bold rounded-full">{lead.legal_need}</span>
                            ) : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-infinity-navy dark:text-white">{lead.score ?? 0}</span>
                            <span className="text-gray-400">/5</span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-500">{lead.interestedPlan || '—'}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-400">{lead.source || 'website'}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-400">{lead.joinedAt ? new Date(lead.joinedAt).toLocaleDateString() : '—'}</td>
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

      {/* Reddit Social Listening Tab */}
      {activeTab === 'reddit' && (
        <div className="space-y-3">
          {/* Compliance Reminder */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>⚠️ Ethics Reminder:</strong> Only respond to <strong>public requests</strong> for help. Do not DM users unsolicited. When replying publicly, always include a link to your consent form: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{consentFormUrl}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button onClick={fetchRedditLeads} disabled={redditLoading} className="px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              {redditLoading ? '🔄 Fetching...' : '🔍 Refresh Reddit Feed'}
            </button>
            <span className="text-[10px] text-gray-400">r/SouthAfrica — legal keywords — cached 1 hour</span>
          </div>

          {redditError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-400">{redditError}</p>
            </div>
          )}

          {redditLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-400">Scanning Reddit for legal help requests...</p>
            </div>
          ) : redditPosts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-sm text-gray-500">No matching posts found. Click &quot;Refresh Reddit Feed&quot; to scan.</p>
              <p className="text-xs text-gray-400 mt-1">We search for: legal help, CCMA, eviction, divorce, unfair dismissal, and more.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redditPosts.map((post, i) => {
                const pc = PRIORITY_COLORS[post.priority] || PRIORITY_COLORS.cool
                return (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                            {post.priority?.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-400">r/{post.subreddit}</span>
                          <span className="text-[10px] text-gray-400">• Score: {post.score}/5</span>
                          {post.updated && <span className="text-[10px] text-gray-400">• {new Date(post.updated).toLocaleDateString()}</span>}
                        </div>
                        <h3 className="text-sm font-bold text-infinity-navy dark:text-white">{post.title}</h3>
                      </div>
                    </div>

                    {post.snippet && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-3">{post.snippet}</p>
                    )}

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(post.matchedKeywords || []).map((kw, j) => (
                        <span key={j} className="px-2 py-0.5 bg-infinity-gold/10 text-infinity-gold text-[10px] font-bold rounded-full">{kw}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {post.link && (
                        <a href={post.link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-semibold text-infinity-navy dark:text-white transition-colors">
                          📖 View Post
                        </a>
                      )}
                      {post.link && (
                        <a href={post.link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-infinity-gold/10 hover:bg-infinity-gold/20 rounded-lg text-xs font-semibold text-infinity-gold transition-colors">
                          💬 Respond Publicly
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
