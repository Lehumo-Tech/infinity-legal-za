'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewRequestPage() {
  const [form, setForm] = useState({ category: 'Employment', subject: '', description: '', urgency: 'medium' })
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.description.length < 50) { alert('Please provide more detail (at least 50 characters)'); return }
    const reqId = 'REQ-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    alert(`✅ Request Submitted!\n\nRequest ID: ${reqId}\nCategory: ${form.category}\nUrgency: ${form.urgency}\n\nWe will contact you within 24 hours.`)
    router.push('/portal/member/requests')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6"><Link href="/portal/member/requests" className="text-sm text-[#c9a961] font-semibold">← Back to Requests</Link></div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>New Legal Request</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
            {['Employment', 'Property', 'Family', 'Criminal', 'Consumer', 'Corporate', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
          <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief description of your legal matter" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-gray-400">(min 50 chars)</span></label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={5} placeholder="Describe your legal issue in detail..." required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/50 characters minimum</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Urgency</label>
          <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Documents (optional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center"><p className="text-sm text-gray-400">📄 Drag files here or click to upload</p><input type="file" className="hidden" /><button type="button" onClick={() => alert('File upload is available in the full version.')} className="mt-2 text-xs text-[#c9a961] font-semibold">Browse Files</button></div>
        </div>
        <button type="submit" className="w-full py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d]">Submit Request</button>
      </form>
    </div>
  )
}
