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
      const [docsRes, casesRes] = await Promise.all([
        documentsApi.list(),
        casesApi.list({ role: 'attorney' })
      ])
      setDocuments(docsRes.documents || [])
      setCases(casesRes.cases || [])
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFiles(files)
    }
  }

  const handleFileInput = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFiles = async (files) => {
    setUploading(true)
    let uploadedCount = 0

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit. Skipping.`)
        continue
      }

      setUploadProgress(`Uploading ${file.name}... (${uploadedCount + 1}/${files.length})`)

      try {
        await documentsApi.upload(file, selectedCase || null, selectedCategory)
        uploadedCount++
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error)
        alert(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    setUploading(false)
    setUploadProgress('')

    if (uploadedCount > 0) {
      await fetchData()
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getCategoryColor = (category) => {
    const colors = {
      contract: 'bg-blue-100 text-blue-700',
      evidence: 'bg-purple-100 text-purple-700',
      correspondence: 'bg-green-100 text-green-700',
      court_filing: 'bg-red-100 text-red-700',
      identification: 'bg-yellow-100 text-yellow-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return colors[category] || colors.other
  }

  const categories = [
    { value: 'contract', label: 'Contract' },
    { value: 'evidence', label: 'Evidence' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'court_filing', label: 'Court Filing' },
    { value: 'identification', label: 'Identification' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <AttorneyLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-infinity-navy mb-1">Document Vault</h1>
        <p className="text-infinity-navy/70 text-sm">Secure document storage with Supabase</p>
      </div>

      {/* Upload Options */}
      <div className="bg-white rounded-lg border border-infinity-gold/20 p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-infinity-navy/70 mb-1">Link to Case</label>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-infinity-navy"
            >
              <option value="">No case (general)</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-infinity-navy/70 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-infinity-navy"
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-10 text-center transition-all ${
          dragActive
            ? 'border-infinity-gold bg-infinity-gold/5'
            : 'border-infinity-gold/20 bg-white'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-infinity-navy mx-auto mb-3"></div>
            <p className="text-infinity-navy font-medium">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-3">📁</div>
            <h3 className="text-lg font-semibold text-infinity-navy mb-1">
              Drag & Drop Files Here
            </h3>
            <p className="text-infinity-navy/50 text-sm mb-4">or</p>
            <label className="cursor-pointer">
              <span className="px-5 py-2.5 bg-infinity-navy text-infinity-cream rounded-lg font-medium text-sm hover:bg-infinity-navy/90 inline-block">
                Browse Files
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
            </label>
            <p className="text-xs text-infinity-navy/40 mt-3">
              Max 5MB per file · PDF, DOC, DOCX, JPG, PNG, TXT
            </p>
          </>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-infinity-gold/20 overflow-hidden">
        <div className="p-4 border-b border-infinity-gold/10">
          <h2 className="font-semibold text-infinity-navy text-sm">
            All Documents ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-infinity-navy mx-auto mb-3"></div>
            <p className="text-infinity-navy/50 text-sm">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-infinity-navy/50">
            <p className="text-lg mb-2">No documents yet</p>
            <p className="text-sm">Upload your first document above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-infinity-cream/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-infinity-navy uppercase tracking-wider">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-infinity-gold/10 hover:bg-infinity-cream/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        <div>
                          <div className="font-medium text-infinity-navy text-sm">{doc.file_name}</div>
                          <div className="text-xs text-infinity-navy/40">{doc.file_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-infinity-navy/70">
                      {doc.cases?.case_number || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.document_category)}`}>
                        {doc.document_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-infinity-navy/70">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>
                    <td className="px-4 py-3 text-xs text-infinity-navy/50">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
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
