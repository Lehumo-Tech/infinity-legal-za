'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function DocumentsPage() {
  const { profile, role, isOfficer, hasPermission } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState('all')
  const [actionMsg, setActionMsg] = useState('')
  const [activeTab, setActiveTab] = useState('vault') // 'vault' | 'templates' | 'ai'
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 'general', content: '', tags: '' })
  const [templateSaving, setTemplateSaving] = useState(false)

  // AI assistance
  const [aiAction, setAiAction] = useState('review')
  const [aiInput, setAiInput] = useState('')
  const [aiDocType, setAiDocType] = useState('contract')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchDocs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      let docs = data.documents || []
      if (filter !== 'all') docs = docs.filter(d => (d.workflow_status || 'draft') === filter)
      setDocuments(docs)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token, filter])

  const fetchTemplates = useCallback(async () => {
    if (!token) return
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/documents/templates', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []) }
    } catch (err) { console.error(err) }
    finally { setTemplatesLoading(false) }
  }, [token])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  useEffect(() => { if (activeTab === 'templates') fetchTemplates() }, [activeTab, fetchTemplates])

  const handleWorkflowAction = async (docId, newStatus) => {
    setActionMsg('')
    try {
      const res = await fetch(`/api/documents/${docId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newStatus }),
      })
      const data = await res.json()
      if (res.ok) { setActionMsg(`Document ${data.transition}`); fetchDocs() }
      else { setActionMsg(`Error: ${data.error}`) }
    } catch (err) { setActionMsg(`Error: ${err.message}`) }
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    if (!templateForm.name || !templateForm.content) return
    setTemplateSaving(true)
    try {
      const res = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...templateForm,
          tags: templateForm.tags ? templateForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })
      if (res.ok) {
        setShowTemplateForm(false)
        setTemplateForm({ name: '', description: '', category: 'general', content: '', tags: '' })
        fetchTemplates()
      }
    } catch (err) { console.error(err) }
    finally { setTemplateSaving(false) }
  }

  const handleAIAssist = async (e) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai/document-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: aiAction, content: aiInput, documentType: aiDocType }),
      })
      if (res.ok) { const d = await res.json(); setAiResult(d.result || 'No result') }
      else { setAiResult('AI service unavailable. Please try again.') }
    } catch (err) { setAiResult('Error: ' + err.message) }
    finally { setAiLoading(false) }
  }

  const STATUS_STYLES = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
    review: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    signed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Document Management</h1>
          <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
            {isOfficer ? 'Review, approve, sign, and manage document templates.' : 'Draft, file, and manage documents.'}
          </p>
        </div>
        <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
          {['vault', 'templates', 'ai'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === t ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
              {t === 'vault' ? 'Document Vault' : t === 'templates' ? 'Templates' : 'AI Assistant'}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${actionMsg.startsWith('Error') ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {actionMsg}
        </div>
      )}

      {/* VAULT TAB */}
      {activeTab === 'vault' && (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'draft', 'review', 'approved', 'signed', 'rejected'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12"><div className="text-3xl mb-2">📁</div><p className="text-sm text-gray-400">No documents found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Document</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Category</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Uploaded</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => {
                      const wfStatus = doc.workflow_status || 'draft'
                      return (
                        <tr key={doc.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-xs text-infinity-navy dark:text-white">{doc.file_name}</div>
                            <div className="text-[10px] text-gray-400">{doc.file_type || 'Unknown'}</div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">{doc.document_category || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[wfStatus] || ''}`}>{wfStatus}</span>
                          </td>
                          <td className="px-4 py-2.5 text-[10px] text-gray-400">{new Date(doc.created_at).toLocaleDateString('en-ZA')}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 flex-wrap">
                              {wfStatus === 'draft' && <button onClick={() => handleWorkflowAction(doc.id, 'review')} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-semibold hover:bg-blue-200">Submit for Review</button>}
                              {isOfficer && wfStatus === 'review' && (
                                <>
                                  <button onClick={() => handleWorkflowAction(doc.id, 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-semibold hover:bg-green-200">Approve</button>
                                  <button onClick={() => handleWorkflowAction(doc.id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-semibold hover:bg-red-200">Reject</button>
                                </>
                              )}
                              {isOfficer && wfStatus === 'approved' && <button onClick={() => handleWorkflowAction(doc.id, 'signed')} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold hover:bg-purple-200">Sign</button>}
                              {wfStatus === 'rejected' && <button onClick={() => handleWorkflowAction(doc.id, 'draft')} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold hover:bg-gray-200">Back to Draft</button>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!isOfficer && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
              <p className="text-xs text-orange-700 dark:text-orange-400">
                <strong>UPL Protection:</strong> Documents you draft are automatically tagged &quot;Prepared by Paralegal under supervision of [Assigned Officer]&quot;. Only Legal Officers can approve, sign, and send documents to clients.
              </p>
            </div>
          )}
        </>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowTemplateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Template
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {templatesLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm text-gray-400">No templates yet</p>
                <button onClick={() => setShowTemplateForm(true)} className="mt-2 text-xs text-infinity-gold font-semibold hover:underline">+ Create the first template</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {templates.map(t => (
                  <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-infinity-gold transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-infinity-navy dark:text-white">{t.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">{t.category}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{t.usageCount} uses</span>
                    </div>
                    {t.description && <p className="text-[10px] text-gray-400 mb-2 line-clamp-2">{t.description}</p>}
                    <div className="text-[10px] text-gray-300">by {t.createdByName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Template Modal */}
          {showTemplateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">New Template</h2>
                  <button onClick={() => setShowTemplateForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleCreateTemplate} className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Template Name *</label>
                      <input type="text" required value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. NDA Template" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                      <select value={templateForm.category} onChange={e => setTemplateForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                        {['general', 'contract', 'pleading', 'correspondence', 'affidavit', 'notice', 'agreement', 'compliance'].map(c =>
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input type="text" value={templateForm.description} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Brief description" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Template Content *</label>
                    <textarea rows={10} required value={templateForm.content} onChange={e => setTemplateForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none font-mono"
                      placeholder="Enter template content. Use {{PLACEHOLDER}} for variable fields..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tags (comma-separated)</label>
                    <input type="text" value={templateForm.tags} onChange={e => setTemplateForm(p => ({ ...p, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="e.g. nda, confidentiality" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowTemplateForm(false)}
                      className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" disabled={templateSaving}
                      className="flex-1 py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                      {templateSaving ? 'Creating...' : 'Create Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* AI ASSISTANT TAB */}
      {activeTab === 'ai' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">🤖 AI Document Assistant</h3>
            <p className="text-[11px] text-gray-400 mb-4">Use AI to review, draft, summarize, or suggest clauses for legal documents.</p>
            <form onSubmit={handleAIAssist} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Action</label>
                  <select value={aiAction} onChange={e => setAiAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    <option value="review">Review Document</option>
                    <option value="draft">Draft Document</option>
                    <option value="summarize">Summarize</option>
                    <option value="clause_suggest">Suggest Clauses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Document Type</label>
                  <select value={aiDocType} onChange={e => setAiDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {['contract', 'nda', 'employment', 'lease', 'settlement', 'pleading', 'affidavit', 'will', 'power_of_attorney', 'other'].map(t =>
                      <option key={t} value={t}>{t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1)}</option>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {aiAction === 'draft' ? 'Requirements & Instructions' : 'Paste Document Content'}
                </label>
                <textarea rows={8} value={aiInput} onChange={e => setAiInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none"
                  placeholder={aiAction === 'draft' ? 'Describe what you need drafted...' : 'Paste document text here...'} />
              </div>
              <button type="submit" disabled={aiLoading || !aiInput.trim()}
                className="w-full py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {aiLoading ? '🔄 Processing...' : `🤖 ${aiAction.charAt(0).toUpperCase() + aiAction.slice(1)}`}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">AI Output</h3>
            {aiResult ? (
              <div className="text-xs text-infinity-navy/80 dark:text-white/80 whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed">{aiResult}</div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm">AI results will appear here</p>
                  <p className="text-[10px] mt-1">Powered by GPT-4o Mini</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
