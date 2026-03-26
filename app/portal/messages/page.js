'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const { profile, user } = useAuth()
  const [token, setToken] = useState(null)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [activeTab, setActiveTab] = useState('messages')
  const [showNewConv, setShowNewConv] = useState(false)
  const [staff, setStaff] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [convName, setConvName] = useState('')
  const messagesEndRef = useRef(null)

  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', category: 'general', priority: 'normal', pinned: false })
  const [annLoading, setAnnLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setConversations(d.conversations || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token])

  const fetchMessages = useCallback(async (convId) => {
    if (!token || !convId) return
    setMsgLoading(true)
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setMessages(d.messages || [])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err) { console.error(err) }
    finally { setMsgLoading(false) }
  }, [token])

  const fetchAnnouncements = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setAnnouncements(d.announcements || []) }
    } catch (err) { console.error(err) }
  }, [token])

  const fetchStaff = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, role, department').neq('role', 'client').order('full_name')
      if (data) setStaff(data.filter(s => s.id !== user?.id))
    } catch (err) { console.error(err) }
  }, [token, user])

  useEffect(() => { fetchConversations(); fetchAnnouncements(); fetchStaff() }, [fetchConversations, fetchAnnouncements, fetchStaff])

  useEffect(() => { if (selectedConv) fetchMessages(selectedConv.id) }, [selectedConv, fetchMessages])

  // Polling
  useEffect(() => {
    if (!selectedConv) return
    const interval = setInterval(() => fetchMessages(selectedConv.id), 5000)
    return () => clearInterval(interval)
  }, [selectedConv, fetchMessages])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: selectedConv.id, content: newMessage.trim() }),
      })
      if (res.ok) { setNewMessage(''); fetchMessages(selectedConv.id); fetchConversations() }
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const handleCreateConversation = async () => {
    if (!selectedStaff) return
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create_conversation', participants: [selectedStaff.id],
          name: convName || '', type: 'direct',
          participantNames: { [selectedStaff.id]: selectedStaff.full_name },
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setShowNewConv(false); setSelectedStaff(null); setConvName('')
        fetchConversations()
        setSelectedConv(d.conversation)
      }
    } catch (err) { console.error(err) }
  }

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    if (!annForm.title || !annForm.content) return
    setAnnLoading(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(annForm),
      })
      if (res.ok) { setShowAnnForm(false); setAnnForm({ title: '', content: '', category: 'general', priority: 'normal', pinned: false }); fetchAnnouncements() }
    } catch (err) { console.error(err) }
    finally { setAnnLoading(false) }
  }

  const getConvDisplayName = (conv) => {
    if (conv.name) return conv.name
    const otherNames = Object.entries(conv.participantNames || {}).filter(([id]) => id !== user?.id).map(([, name]) => name)
    return otherNames.join(', ') || 'Conversation'
  }

  const PRIORITY_COLORS = { urgent: 'bg-red-500', high: 'bg-orange-500', normal: 'bg-blue-500', low: 'bg-gray-400' }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Communication Hub</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Internal messaging and announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {['messages', 'announcements'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === t ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="grid lg:grid-cols-3 gap-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-[600px]">
          {/* Conversation List */}
          <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-infinity-navy dark:text-white">Conversations</h3>
              <button onClick={() => setShowNewConv(true)} className="w-7 h-7 bg-infinity-navy text-white rounded-lg flex items-center justify-center hover:bg-infinity-navy-light text-sm">+</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-xs text-gray-400">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-2xl mb-1">💬</div>
                  <p className="text-xs text-gray-400">No conversations yet</p>
                  <button onClick={() => setShowNewConv(true)} className="text-xs text-infinity-gold font-semibold mt-1 hover:underline">Start one</button>
                </div>
              ) : (
                conversations.map(c => (
                  <div key={c.id} onClick={() => setSelectedConv(c)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 transition-colors ${selectedConv?.id === c.id ? 'bg-infinity-gold/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                    <div className="w-8 h-8 bg-infinity-navy/10 dark:bg-infinity-gold/10 rounded-lg flex items-center justify-center text-xs font-bold text-infinity-navy dark:text-infinity-gold shrink-0">
                      {getConvDisplayName(c).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-infinity-navy dark:text-white truncate">{getConvDisplayName(c)}</div>
                      <div className="text-[10px] text-gray-400 truncate">{c.lastMessage || 'No messages yet'}</div>
                    </div>
                    {c.unreadCount > 0 && (
                      <div className="w-4 h-4 bg-infinity-gold rounded-full flex items-center justify-center text-[9px] font-bold text-infinity-navy shrink-0">{c.unreadCount}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Area */}
          <div className="lg:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="text-sm font-bold text-infinity-navy dark:text-white">{getConvDisplayName(selectedConv)}</div>
                  <div className="text-[10px] text-gray-400">{selectedConv.participants?.length || 0} participants</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading ? (
                    <div className="text-center text-xs text-gray-400 py-8">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-8">No messages yet. Say hello!</div>
                  ) : (
                    messages.map(m => {
                      const isMe = m.senderId === user?.id
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMe ? 'bg-infinity-navy text-white' : 'bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white'} rounded-xl px-3 py-2`}>
                            {!isMe && <div className="text-[10px] font-bold opacity-70 mb-0.5">{m.senderName}</div>}
                            <div className="text-xs whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[9px] mt-0.5 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                    placeholder="Type a message..." />
                  <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-infinity-navy-light transition-colors">
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm text-gray-400">Select a conversation or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAnnForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Announcement
            </button>
          </div>
          {announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="text-3xl mb-2">📢</div>
              <p className="text-sm text-gray-400">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${a.pinned ? 'ring-2 ring-infinity-gold/30' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.pinned && <span className="text-xs">📌</span>}
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[a.priority] || 'bg-blue-500'}`} />
                        <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white">{a.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">{a.category}</span>
                      </div>
                      <p className="text-xs text-infinity-navy/70 dark:text-white/70 whitespace-pre-wrap">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                        <span>by {a.authorName}</span>
                        <span>{new Date(a.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white mb-3">New Conversation</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Colleague</label>
                <select value={selectedStaff?.id || ''} onChange={e => setSelectedStaff(staff.find(s => s.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                  <option value="">Choose a person...</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({(s.role || '').replace(/_/g, ' ')})</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewConv(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-xs font-semibold">Cancel</button>
                <button onClick={handleCreateConversation} disabled={!selectedStaff}
                  className="flex-1 py-2 bg-infinity-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50">Start Chat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {showAnnForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">New Announcement</h2>
              <button onClick={() => setShowAnnForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handlePostAnnouncement} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input type="text" required value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Announcement title" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Content *</label>
                <textarea rows={4} required value={annForm.content} onChange={e => setAnnForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                  <select value={annForm.category} onChange={e => setAnnForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {['general', 'policy', 'event', 'training', 'hr', 'it', 'legal'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                  <select value={annForm.priority} onChange={e => setAnnForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm(p => ({ ...p, pinned: e.target.checked }))}
                  className="rounded border-gray-300" />
                <span className="text-gray-500">Pin this announcement</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAnnForm(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={annLoading}
                  className="flex-1 py-2.5 bg-infinity-navy text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {annLoading ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
