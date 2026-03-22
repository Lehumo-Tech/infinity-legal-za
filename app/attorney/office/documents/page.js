'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Mock documents
  const mockDocuments = [
    {
      id: '1',
      fileName: 'Employment_Contract.pdf',
      caseNumber: 'INF-2025-1234',
      category: 'contract',
      size: '2.4 MB',
      uploadedBy: 'John Doe',
      uploadedAt: '2025-03-20 14:30',
      isAiProcessed: true,
      aiNotes: 'Contract appears complete. No missing signatures detected.',
      attorneyApproved: true,
      version: 1
    },
    {
      id: '2',
      fileName: 'Dismissal_Letter.pdf',
      caseNumber: 'INF-2025-1234',
      category: 'correspondence',
      size: '850 KB',
      uploadedBy: 'Attorney',
      uploadedAt: '2025-03-20 10:15',
      isAiProcessed: true,
      aiNotes: '⚠️ Missing date field on page 2',
      attorneyApproved: false,
      version: 2
    },
    {
      id: '3',
      fileName: 'Client_ID_Copy.pdf',
      caseNumber: 'INF-2025-1233',
      category: 'identification',
      size: '1.2 MB',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2025-03-19 16:45',
      isAiProcessed: false,
      aiNotes: null,
      attorneyApproved: false,
      version: 1
    }
  ]

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
  }

  const handleFiles = async (files) => {
    setUploading(true)
    
    // Simulate upload and AI processing
    for (let file of files) {
      // Client-side compression would happen here
      console.log(`Uploading ${file.name}...`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setUploading(false)
    alert('Files uploaded successfully! AI processing will complete shortly.')
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

  return (
    <div className="min-h-screen bg-infinity-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/attorney/office" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
              <span className="font-bold text-xl text-infinity-navy">Attorney Office</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/attorney/office" className="text-infinity-navy/70 hover:text-infinity-navy">Dashboard</Link>
              <Link href="/attorney/office/cases" className="text-infinity-navy/70 hover:text-infinity-navy">Cases</Link>
              <Link href="/attorney/office/documents" className="text-infinity-navy font-medium border-b-2 border-infinity-gold pb-1">Documents</Link>
              <Link href="/attorney/office/tasks" className="text-infinity-navy/70 hover:text-infinity-navy">Tasks</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Document Vault</h1>
          <p className="text-infinity-navy/70">Secure storage with AI-powered document review</p>
        </div>

        {/* Upload Area */}
        <div
          className={`mb-8 border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive 
              ? 'border-infinity-gold bg-infinity-gold/5' 
              : 'border-infinity-gold/20 bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-infinity-navy mb-2">
            Drag & Drop Files Here
          </h3>
          <p className="text-infinity-navy/70 mb-4">or</p>
          <label className="cursor-pointer">
            <span className="px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 inline-block">
              Browse Files
            </span>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </label>
          <p className="text-xs text-infinity-navy/50 mt-4">
            Max 5MB per file • PDF, DOC, DOCX, JPG, PNG • Files compressed automatically
          </p>
        </div>

        {uploading && (
          <div className="mb-8 bg-infinity-gold/10 border border-infinity-gold/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-infinity-navy"></div>
              <span className="text-infinity-navy">Uploading and processing documents...</span>
            </div>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-lg border border-infinity-gold/20 overflow-hidden">
          <div className="p-4 bg-infinity-cream border-b border-infinity-gold/20">
            <h2 className="font-semibold text-infinity-navy">All Documents</h2>
          </div>

          <table className="w-full">
            <thead className="bg-infinity-cream/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">File Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">Case</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">Size</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">AI Review</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-infinity-navy">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockDocuments.map((doc, i) => (
                <tr key={doc.id} className="border-t border-infinity-gold/10 hover:bg-infinity-cream/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      <div>
                        <div className="font-medium text-infinity-navy">{doc.fileName}</div>
                        <div className="text-xs text-infinity-navy/50">
                          Uploaded {doc.uploadedAt} by {doc.uploadedBy}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-infinity-navy">{doc.caseNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-infinity-navy/70">{doc.size}</td>
                  <td className="px-6 py-4">
                    {doc.isAiProcessed ? (
                      <div>
                        <div className="text-xs text-green-600 font-medium mb-1">✓ Processed</div>
                        {doc.aiNotes && (
                          <div className="text-xs text-infinity-navy/70">{doc.aiNotes}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-infinity-navy/50">Pending...</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {doc.attorneyApproved ? (
                      <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                    ) : (
                      <button className="text-xs text-infinity-gold hover:text-infinity-navy">
                        Review →
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-infinity-navy hover:text-infinity-gold">👁️</button>
                      <button className="text-infinity-navy hover:text-infinity-gold">⬇️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Processing Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Document Review</h3>
          <p className="text-sm text-blue-800">
            Our AI automatically scans uploaded documents for:
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
            <li>• Missing signatures or dates</li>
            <li>• Incomplete fields</li>
            <li>• Document quality issues</li>
            <li>• Compliance requirements</li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            ⚠️ AI suggestions are for guidance only. Attorney approval required before submission.
          </p>
        </div>
      </div>
    </div>
  )
}
