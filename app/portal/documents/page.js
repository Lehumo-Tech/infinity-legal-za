'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function DocumentsPage() {
  const { profile, role, isOfficer } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState('all')
  const [actionMsg, setActionMsg] = useState('')

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
      if (filter !== 'all') {
        docs = docs.filter(d => (d.workflow_status || 'draft') === filter)
      }
      setDocuments(docs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleWorkflowAction = async (docId, newStatus) => {
    setActionMsg('')
    try {
      const res = await fetch(`/api/documents/${docId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg(`Document ${data.transition}`)
        fetchDocs()
      } else {
        setActionMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setActionMsg(`Error: ${err.message}`)
    }
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
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Document Vault</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">
          {isOfficer ? 'Review, approve, and sign documents.' : 'Draft and file documents for review.'}
        </p>
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${actionMsg.startsWith('Error') ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {actionMsg}
        </div>
      )}

      {/* Workflow filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'draft', 'review', 'approved', 'signed', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy'
                : 'bg-white dark:bg-gray-800 text-infinity-navy/60 dark:text-white/60 border border-infinity-navy/10 dark:border-gray-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">No documents found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-infinity-navy/10 dark:border-gray-700 bg-infinity-cream/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Document</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Uploaded</th>
                  <th className="text-left px-4 py-3 font-semibold text-infinity-navy/60 dark:text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const wfStatus = doc.workflow_status || 'draft'
                  return (
                    <tr key={doc.id} className="border-b border-infinity-navy/5 dark:border-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-infinity-navy dark:text-white">{doc.file_name}</div>
                        <div className="text-xs text-infinity-navy/40 dark:text-white/40">{doc.file_type || 'Unknown'}</div>
                      </td>
                      <td className="px-4 py-3 text-infinity-navy/60 dark:text-white/60 capitalize">{doc.document_category || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[wfStatus] || ''}`}>
                          {wfStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-infinity-navy/40 dark:text-white/40 text-xs">
                        {new Date(doc.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {/* Paralegal can submit for review */}
                          {wfStatus === 'draft' && (
                            <button onClick={() => handleWorkflowAction(doc.id, 'review')} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold hover:bg-blue-200">
                              Submit for Review
                            </button>
                          )}
                          {/* Officer can approve */}
                          {isOfficer && wfStatus === 'review' && (
                            <>
                              <button onClick={() => handleWorkflowAction(doc.id, 'approved')} className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-semibold hover:bg-green-200">
                                Approve
                              </button>
                              <button onClick={() => handleWorkflowAction(doc.id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-semibold hover:bg-red-200">
                                Reject
                              </button>
                            </>
                          )}
                          {/* Officer can sign approved docs */}
                          {isOfficer && wfStatus === 'approved' && (
                            <button onClick={() => handleWorkflowAction(doc.id, 'signed')} className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs font-semibold hover:bg-purple-200">
                              Sign Document
                            </button>
                          )}
                          {/* Send back to draft */}
                          {wfStatus === 'rejected' && (
                            <button onClick={() => handleWorkflowAction(doc.id, 'draft')} className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded text-xs font-semibold hover:bg-gray-200">
                              Back to Draft
                            </button>
                          )}
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

      {/* UPL Protection Notice */}
      {!isOfficer && (
        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
          <p className="text-xs text-orange-700 dark:text-orange-400">
            <strong>UPL Protection:</strong> Documents you draft are automatically tagged "Prepared by Paralegal under supervision of [Assigned Officer]". 
            Only Legal Officers can approve, sign, and send documents to clients.
          </p>
        </div>
      )}
    </div>
  )
}
