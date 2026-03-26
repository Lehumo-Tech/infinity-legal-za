'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['constitutional', 'criminal', 'civil', 'labour', 'family', 'commercial', 'property', 'administrative', 'tax', 'immigration', 'general']
const ARTICLE_TYPES = [
  { value: 'precedent', label: 'Case Precedent', icon: '⚖️' },
  { value: 'statute', label: 'Statute/Act', icon: '📜' },
  { value: 'article', label: 'Legal Article', icon: '📄' },
  { value: 'memo', label: 'Internal Memo', icon: '📝' },
  { value: 'template_guide', label: 'Template Guide', icon: '📋' },
  { value: 'practice_note', label: 'Practice Note', icon: '📌' },
]

const SA_COURTS = ['Constitutional Court', 'Supreme Court of Appeal', 'High Court - Gauteng', 'High Court - Western Cape', 'High Court - KwaZulu-Natal', 'Labour Court', 'Labour Appeal Court', 'Land Claims Court', 'Competition Appeal Court', 'Magistrate\'s Court', 'Other']

export default function KnowledgePage() {
  const { profile, hasPermission } = useAuth()
  const [token, setToken] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse') // 'browse' | 'conflicts' | 'add'
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)

  // Conflict check
  const [conflictChecks, setConflictChecks] = useState([])
  const [conflictLoading, setConflictLoading] = useState(false)
  const [conflictForm, setConflictForm] = useState({ clientName: '', adverseParty: '', caseType: '' })
  const [conflictResult, setConflictResult] = useState(null)

  // Add article form
  const [articleForm, setArticleForm] = useState({
    title: '', summary: '', content: '', type: 'precedent', category: 'general',
    caseReference: '', court: '', dateDecided: '', tags: '',
  })
  const [addLoading, setAddLoading] = useState(false)

  // AI Research
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchArticles = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCategory) params.set('category', filterCategory)
      if (filterType) params.set('type', filterType)

      const res = await fetch(`/api/knowledge?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setArticles(d.articles || []) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token, search, filterCategory, filterType])

  const fetchConflicts = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/compliance/conflicts', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setConflictChecks(d.checks || []) }
    } catch (err) { console.error(err) }
  }, [token])

  useEffect(() => { fetchArticles(); fetchConflicts() }, [fetchArticles, fetchConflicts])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchArticles()
  }

  const handleAddArticle = async (e) => {
    e.preventDefault()
    if (!articleForm.title || !articleForm.content) return
    setAddLoading(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...articleForm,
          tags: articleForm.tags ? articleForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          relatedCaseTypes: articleForm.category ? [articleForm.category] : [],
        }),
      })
      if (res.ok) {
        setArticleForm({ title: '', summary: '', content: '', type: 'precedent', category: 'general', caseReference: '', court: '', dateDecided: '', tags: '' })
        setActiveTab('browse')
        fetchArticles()
      }
    } catch (err) { console.error(err) }
    finally { setAddLoading(false) }
  }

  const handleConflictCheck = async (e) => {
    e.preventDefault()
    if (!conflictForm.clientName || !conflictForm.adverseParty) return
    setConflictLoading(true)
    setConflictResult(null)
    try {
      const res = await fetch('/api/compliance/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(conflictForm),
      })
      if (res.ok) {
        const d = await res.json()
        setConflictResult(d.check)
        fetchConflicts()
      }
    } catch (err) { console.error(err) }
    finally { setConflictLoading(false) }
  }

  const handleAIResearch = async (e) => {
    e.preventDefault()
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai/case-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'research', query: aiQuery }),
      })
      if (res.ok) {
        const d = await res.json()
        setAiResult(d.result || 'No results')
      } else {
        setAiResult('AI service unavailable. Please try again.')
      }
    } catch (err) { setAiResult('Error performing research.') }
    finally { setAiLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Knowledge & Compliance</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Legal research, precedents, and conflict checking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {[{ key: 'browse', label: 'Knowledge Base' }, { key: 'conflicts', label: 'Conflicts' }, { key: 'research', label: 'AI Research' }, { key: 'add', label: '+ Add' }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === t.key ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BROWSE TAB */}
      {activeTab === 'browse' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                placeholder="Search precedents, statutes, memos..." />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                <option value="">All Types</option>
                {ARTICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button type="submit" className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-xs font-semibold">Search</button>
            </form>

            {/* Articles List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-400"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Searching...</div>
              ) : articles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <p className="text-sm text-gray-400">No articles found. {hasPermission('MANAGE_KNOWLEDGE') && <button onClick={() => setActiveTab('add')} className="text-infinity-gold font-semibold hover:underline">Add the first one</button>}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {articles.map(a => {
                    const typeConfig = ARTICLE_TYPES.find(t => t.value === a.type)
                    return (
                      <div key={a.id} onClick={() => setSelectedArticle(a)}
                        className={`px-5 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${selectedArticle?.id === a.id ? 'bg-infinity-gold/5 border-l-4 border-l-infinity-gold' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{typeConfig?.icon || '📄'}</span>
                          <span className="text-xs font-bold text-infinity-navy dark:text-white">{a.title}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">{a.category}</span>
                        </div>
                        {a.summary && <p className="text-[11px] text-gray-500 line-clamp-2 ml-6">{a.summary}</p>}
                        <div className="flex items-center gap-3 mt-1 ml-6 text-[10px] text-gray-400">
                          <span>{typeConfig?.label}</span>
                          {a.caseReference && <span className="font-medium text-infinity-navy dark:text-white">{a.caseReference}</span>}
                          {a.court && <span>{a.court}</span>}
                          <span>{a.viewCount} views</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            {selectedArticle ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3 sticky top-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ARTICLE_TYPES.find(t => t.value === selectedArticle.type)?.icon || '📄'}</span>
                  <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white">{selectedArticle.title}</h3>
                </div>
                {selectedArticle.caseReference && <div className="text-xs font-medium text-infinity-gold">{selectedArticle.caseReference}</div>}
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{selectedArticle.category}</span>
                  {selectedArticle.court && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{selectedArticle.court}</span>}
                  {selectedArticle.dateDecided && <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500">{new Date(selectedArticle.dateDecided).toLocaleDateString('en-ZA')}</span>}
                </div>
                {selectedArticle.summary && <div className="text-xs text-gray-500 italic border-l-2 border-infinity-gold pl-3">{selectedArticle.summary}</div>}
                <div className="text-xs text-infinity-navy/80 dark:text-white/80 whitespace-pre-wrap max-h-[400px] overflow-y-auto">{selectedArticle.content}</div>
                {selectedArticle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedArticle.tags.map((t, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-500 rounded-full">{t}</span>)}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
                  Added by {selectedArticle.authorName} • {new Date(selectedArticle.createdAt).toLocaleDateString('en-ZA')}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="text-3xl mb-2">📖</div>
                <p className="text-sm text-gray-400">Select an article to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFLICTS TAB */}
      {activeTab === 'conflicts' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Check Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Run Conflict Check</h3>
            <form onSubmit={handleConflictCheck} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Client Name *</label>
                <input type="text" required value={conflictForm.clientName} onChange={e => setConflictForm(p => ({ ...p, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Full name of client" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Adverse Party *</label>
                <input type="text" required value={conflictForm.adverseParty} onChange={e => setConflictForm(p => ({ ...p, adverseParty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Opposing party name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Case Type</label>
                <select value={conflictForm.caseType} onChange={e => setConflictForm(p => ({ ...p, caseType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                  <option value="">Select type...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <button type="submit" disabled={conflictLoading}
                className="w-full py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-infinity-navy-light transition-colors">
                {conflictLoading ? 'Checking...' : '🔍 Run Conflict Check'}
              </button>
            </form>

            {/* Result */}
            {conflictResult && (
              <div className={`mt-4 p-4 rounded-lg border ${conflictResult.status === 'clear' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                <div className={`text-sm font-bold mb-1 ${conflictResult.status === 'clear' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {conflictResult.status === 'clear' ? '✅ No Conflicts Found' : `⚠️ ${conflictResult.conflictsFound.length} Conflict(s) Detected`}
                </div>
                {conflictResult.conflictsFound.map((cf, i) => (
                  <div key={i} className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cf.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{cf.severity}</span>
                      <span className="text-gray-500 capitalize">{cf.type.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-infinity-navy dark:text-white mt-1">{cf.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white">Conflict Check History</h3>
            </div>
            {conflictChecks.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No checks performed yet</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[400px] overflow-y-auto">
                {conflictChecks.map(c => (
                  <div key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-infinity-navy dark:text-white">{c.clientName} vs {c.adverseParty}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.status === 'clear' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {c.status === 'clear' ? 'Clear' : `${c.conflictsFound.length} conflict(s)`}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">by {c.checkedByName} • {new Date(c.createdAt).toLocaleDateString('en-ZA')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI RESEARCH TAB */}
      {activeTab === 'research' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">🤖 AI Legal Research</h3>
            <p className="text-xs text-gray-400 mb-4">Ask any South African legal question and get AI-powered research with case law references.</p>
            <form onSubmit={handleAIResearch} className="space-y-3">
              <textarea rows={4} value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none"
                placeholder="e.g. What are the requirements for a valid verbal contract under SA law?" />
              <button type="submit" disabled={aiLoading || !aiQuery.trim()}
                className="w-full py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {aiLoading ? '🔄 Researching...' : '🔍 Research'}
              </button>
            </form>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Research Results</h3>
            {aiResult ? (
              <div className="text-xs text-infinity-navy/80 dark:text-white/80 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">{aiResult}</div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Results will appear here</div>
            )}
          </div>
        </div>
      )}

      {/* ADD TAB */}
      {activeTab === 'add' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Add to Knowledge Base</h3>
            <form onSubmit={handleAddArticle} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type *</label>
                  <select value={articleForm.type} onChange={e => setArticleForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {ARTICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Category *</label>
                  <select value={articleForm.category} onChange={e => setArticleForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input type="text" required value={articleForm.title} onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                  placeholder="e.g. Minister of Safety v Van Duivenboden [2002]" />
              </div>
              {(articleForm.type === 'precedent' || articleForm.type === 'statute') && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Case/Act Reference</label>
                    <input type="text" value={articleForm.caseReference} onChange={e => setArticleForm(p => ({ ...p, caseReference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                      placeholder="e.g. 2002 (6) SA 431 (SCA)" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Court</label>
                    <select value={articleForm.court} onChange={e => setArticleForm(p => ({ ...p, court: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                      <option value="">Select court...</option>
                      {SA_COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date Decided</label>
                    <input type="date" value={articleForm.dateDecided} onChange={e => setArticleForm(p => ({ ...p, dateDecided: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Summary</label>
                <textarea rows={2} value={articleForm.summary} onChange={e => setArticleForm(p => ({ ...p, summary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none"
                  placeholder="Brief summary of key findings or provisions..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Content *</label>
                <textarea rows={8} required value={articleForm.content} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none"
                  placeholder="Full text, analysis, or provisions..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tags (comma-separated)</label>
                <input type="text" value={articleForm.tags} onChange={e => setArticleForm(p => ({ ...p, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                  placeholder="e.g. negligence, delict, vicarious liability" />
              </div>
              <button type="submit" disabled={addLoading}
                className="w-full py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {addLoading ? 'Adding...' : 'Add to Knowledge Base'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
