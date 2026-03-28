'use client'

import { useState } from 'react'
import { SCRAPED_LEADS } from '@/lib/demo-data'

export default function LeadScraperPage() {
  const [leads, setLeads] = useState(SCRAPED_LEADS)
  const [scraping, setScraping] = useState(false)
  const [filter, setFilter] = useState({ source: 'all', category: 'all', status: 'all' })
  const [url, setUrl] = useState('')

  const handleScrape = () => {
    if (!url) return
    setScraping(true)
    setTimeout(() => {
      const newLead = {
        id: 'LEAD-' + String(leads.length + 1).padStart(3, '0'),
        name: 'New Lead (Scraped)',
        source: url.includes('linkedin') ? 'LinkedIn' : url.includes('twitter') || url.includes('x.com') ? 'Twitter/X' : url.includes('facebook') ? 'Facebook' : 'Web',
        url: url,
        category: 'Employment',
        signal: 'Scraped from ' + url + ' - mentions legal issue needing assistance',
        email: null,
        phone: null,
        location: 'South Africa',
        score: Math.floor(Math.random() * 30) + 60,
        date: new Date().toISOString().split('T')[0],
        status: 'new',
      }
      setLeads([newLead, ...leads])
      setScraping(false)
      setUrl('')
      alert(`\u2705 Scraping complete!\n\nFound 1 new lead from ${newLead.source}:\n${newLead.signal}`)
    }, 2000)
  }

  const filtered = leads.filter(l => {
    if (filter.source !== 'all' && l.source !== filter.source) return false
    if (filter.category !== 'all' && l.category !== filter.category) return false
    if (filter.status !== 'all' && l.status !== filter.status) return false
    return true
  })

  const sources = [...new Set(leads.map(l => l.source))]
  const categories = [...new Set(leads.map(l => l.category))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>🔍 Lead Scraper</h1>
          <p className="text-gray-500 text-sm">AI-powered web & social media lead intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">{leads.length} leads found</span>
        </div>
      </div>

      {/* Scrape Input */}
      <div className="bg-[#0f2b46] rounded-2xl p-6 mb-6">
        <h3 className="text-white font-bold mb-3">Scrape New Source</h3>
        <div className="flex gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter URL (LinkedIn, Twitter/X, Facebook, News site...)" className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/10 text-white border border-white/20 placeholder-white/40 focus:ring-2 focus:ring-[#c9a961]/50" />
          <button onClick={handleScrape} disabled={scraping || !url} className="px-6 py-2.5 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl text-sm hover:bg-[#d4af37] disabled:opacity-50 transition-colors min-w-[120px]">
            {scraping ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#0f2b46] border-t-transparent rounded-full animate-spin" />Scraping...</span>
            ) : 'Scrape URL'}
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {['linkedin.com/feed', 'x.com/search?q=legal+SA', 'facebook.com/groups/tenants-sa', 'news24.com/legal'].map(u => (
            <button key={u} onClick={() => setUrl(u)} className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">{u.split('/')[0]}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filter.source} onChange={e => setFilter({...filter, source: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Sources</option>{sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Categories</option>{categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          <option value="all">All Statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-4 py-3">Lead</th><th className="text-left px-4 py-3">Source</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Signal</th><th className="text-left px-4 py-3">Score</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-700">{l.name}</div>
                  <div className="text-xs text-gray-400">{l.email || 'No email'} • {l.location}</div>
                </td>
                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${l.source === 'LinkedIn' ? 'bg-blue-100 text-blue-700' : l.source === 'Twitter/X' ? 'bg-sky-100 text-sky-700' : l.source === 'Facebook' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{l.source}</span></td>
                <td className="px-4 py-3"><span className="text-xs bg-[#0f2b46]/10 text-[#0f2b46] px-2 py-1 rounded-full">{l.category}</span></td>
                <td className="px-4 py-3 text-gray-600 max-w-[250px] text-xs">{l.signal}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1.5 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${l.score >= 80 ? 'bg-green-500' : l.score >= 60 ? 'bg-yellow-500' : 'bg-gray-400'}`} style={{ width: `${l.score}%` }} /></div>
                    <span className={`text-xs font-bold ${l.score >= 80 ? 'text-green-600' : l.score >= 60 ? 'text-yellow-600' : 'text-gray-500'}`}>{l.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${l.status === 'new' ? 'bg-green-100 text-green-700' : l.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{l.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {l.email && <button onClick={() => alert(`📧 Email sent to ${l.email}`)} className="text-xs text-blue-600 hover:underline">📧</button>}
                    {l.phone && <button onClick={() => alert(`📞 Calling ${l.phone}`)} className="text-xs text-green-600 hover:underline">📞</button>}
                    <button onClick={() => { const updated = leads.map(x => x.id === l.id ? {...x, status: 'contacted'} : x); setLeads(updated); alert('✅ Marked as contacted') }} className="text-xs text-[#c9a961] font-semibold hover:underline">✓</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
