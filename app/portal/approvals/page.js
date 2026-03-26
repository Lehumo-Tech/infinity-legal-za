'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ApprovalsPage() {
  const { isOfficer } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  useEffect(() => {
    if (!token) return
    fetchPendingDocs()
  }, [token])

  const fetchPendingDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      const docs = (data.documents || []).filter(d => d.workflow_status === 'review' || d.workflow_status === 'approved')
      setDocuments(docs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (docId, newStatus) => {
    setMessage('')
    try {
      const res = await fetch(`/api/documents/${docId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Document ${data.transition}`)
        fetchPendingDocs()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }
  }

  if (!isOfficer) {
    return <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Access denied. Only Legal Officers can access the Approvals queue.</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Pending Approvals</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Review and approve documents submitted by paralegals.</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700">
        {loading ? (
          <div className="text-center py-12 text-infinity-navy/40 dark:text-white/40">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-infinity-navy/40 dark:text-white/40">No pending approvals. You're all caught up!</div>
          </div>
        ) : (
          <div className="divide-y divide-infinity-navy/5 dark:divide-gray-700/50">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-infinity-navy dark:text-white">{doc.file_name}</div>
                  <div className="text-xs text-infinity-navy/50 dark:text-white/50">
                    {doc.document_category || 'Document'} • Status: <span className="font-semibold capitalize">{doc.workflow_status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.workflow_status === 'review' && (
                    <>
                      <button onClick={() => handleAction(doc.id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                        Approve
                      </button>
                      <button onClick={() => handleAction(doc.id, 'rejected')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">
                        Reject
                      </button>
                    </>
                  )}
                  {doc.workflow_status === 'approved' && (
                    <button onClick={() => handleAction(doc.id, 'signed')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">
                      Sign Document
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
