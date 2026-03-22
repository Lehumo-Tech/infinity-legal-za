'use client'

import { useState, useEffect, useRef } from 'react'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { documentsApi, casesApi } from '@/lib/api'

export default function DocumentsPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedCase, setSelectedCase] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [docsRes, casesRes] = await Promise.all([documentsApi.list(), casesApi.list({ role: 'attorney' })])
      setDocuments(docsRes.documents || [])
      setCases(casesRes.cases || [])
    } catch (error) { console.error('Fetch data error:', error) }
    finally { setLoading(false) }
  }

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.length) await handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = async (e) => {
    if (e.target.files?.length) await handleFiles(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFiles = async (files) => {
    setUploading(true); let count = 0
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} exceeds 5MB`); continue }
      setUploadProgress(`Uploading ${file.name}...`)
      try { await documentsApi.upload(file, selectedCase || null, selectedCategory); count++ }
      catch (error) { alert(`Failed: ${file.name} - ${error.message}`) }
    }
    setUploading(false); setUploadProgress('')
    if (count > 0) await fetchData()
  }

  const formatSize = (b) => {
    if (!b) return '0 B'
    if (b < 1024) return b + ' B'
    if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB'
    return (b/(1024*1024)).toFixed(1) + ' MB'
  }

  const getCatColor = (c) => ({
    contract: 'bg-blue-50 text-blue-600',
    evidence: 'bg-purple-50 text-purple-600',
    correspondence: 'bg-green-50 text-green-600',
    court_filing: 'bg-red-50 text-red-600',
    identification: 'bg-yellow-50 text-yellow-600',
    other: 'bg-gray-100 text-gray-500'
  }[c] || 'bg-gray-100 text-gray-500')

  const categories = [
    { value: 'contract', label: 'Contract' }, { value: 'evidence', label: 'Evidence' },
    { value: 'correspondence', label: 'Correspondence' }, { value: 'court_filing', label: 'Court Filing' },
    { value: 'identification', label: 'Identification' }, { value: 'other', label: 'Other' }
  ]

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📕'
    if (type?.includes('word') || type?.includes('doc')) return '📘'
    if (type?.includes('image') || type?.includes('jpg') || type?.includes('png')) return '🖼️'
    return '📄'
  }

  return (
    <AttorneyLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-sm text-gray-500 mt-0.5">Secure document storage and management</p>
        </div>
      </div>

      {/* Upload Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Link to Case</label>
            <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
              <option value="">No case (general)</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className={`mb-6 border-2 border-dashed rounded-xl p-10 text-center transition-all ${
        dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
      }`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        {uploading ? (
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600 mx-auto mb-3"></div>
            <p className="text-sm font-medium text-gray-700">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Drag & Drop Files Here</h3>
            <p className="text-xs text-gray-400 mb-4">or</p>
            <label className="cursor-pointer">
              <span className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 inline-block">Browse Files</span>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileInput} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" />
            </label>
            <p className="text-[11px] text-gray-400 mt-3">Max 5MB per file · PDF, DOC, DOCX, JPG, PNG, TXT</p>
          </>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">All Documents ({documents.length})</h2>
        </div>
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600 mx-auto"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-400 text-sm">No documents yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">File</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Case</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Size</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{getFileIcon(doc.file_type)}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{doc.file_name}</div>
                          <div className="text-[11px] text-gray-400">{doc.file_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{doc.cases?.case_number || 'General'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCatColor(doc.document_category)}`}>
                        {doc.document_category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatSize(doc.file_size_bytes)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AttorneyLayout>
  )
}
