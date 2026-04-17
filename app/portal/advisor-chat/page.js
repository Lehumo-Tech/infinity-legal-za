'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function AdvisorChatPage() {
  const { profile, role } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const isAdvisor = ['legal_advisor', 'senior_advisor', 'admin'].includes(role)

  useEffect(() => {
    if (isAdvisor) {
      fetchSessions()
    } else {
      // Members: check for existing session or start new
      fetchOrCreateMemberSession()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/advisor-chat')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchOrCreateMemberSession = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/advisor-chat')
      if (res.ok) {
        const data = await res.json()
        const mySessions = (data.sessions || []).filter(s => s.userEmail === profile?.email || s.userId === profile?.id)
        if (mySessions.length > 0) {
          const latest = mySessions[0]
          setActiveSession(latest.sessionId)
          await loadMessages(latest.sessionId)
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadMessages = async (sessionId) => {
    try {
      const res = await fetch(`/api/advisor-chat?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setActiveSession(sessionId)
      }
    } catch (err) { console.error(err) }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession || undefined,
          userId: profile?.id || profile?.user_id || 'anonymous',
          userEmail: profile?.email || '',
          userName: profile?.full_name || 'Member',
          message: newMessage.trim(),
          role: isAdvisor ? 'advisor' : 'member',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (!activeSession) setActiveSession(data.sessionId)

        // Add user message
        setMessages(prev => [...prev, data.userMessage])
        // Add AI response if present
        if (data.aiResponse) {
          setMessages(prev => [...prev, data.aiResponse])
        }
        setNewMessage('')
      }
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const getSenderStyle = (sender) => {
    switch (sender) {
      case 'member': return { bg: 'bg-[#0f2b46]', text: 'text-white', align: 'ml-auto', label: 'You', labelColor: 'text-white/50' }
      case 'advisor': return { bg: 'bg-[#c9a961]/10 border border-[#c9a961]/30', text: 'text-[#0f2b46]', align: 'mr-auto', label: 'Legal Advisor', labelColor: 'text-[#c9a961]' }
      case 'ai': return { bg: 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-200', align: 'mr-auto', label: 'Infinity AI', labelColor: 'text-blue-500' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', align: 'mr-auto', label: 'System', labelColor: 'text-gray-400' }
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Advisor Chat</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40">{isAdvisor ? 'Manage member conversations with AI-assisted responses' : 'Chat with your legal advisor — AI provides immediate guidance while a human advisor is assigned'}</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Sidebar - Sessions (Advisors see all, Members see theirs) */}
        {isAdvisor && (
          <div className="w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Active Chats ({sessions.length})</h3>
            </div>
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">No active chats</div>
            ) : (
              sessions.map(s => (
                <button key={s.sessionId} onClick={() => loadMessages(s.sessionId)} className={`w-full text-left p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${activeSession === s.sessionId ? 'bg-[#c9a961]/5 border-l-2 border-l-[#c9a961]' : ''}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-infinity-navy dark:text-white truncate">{s.userName || 'Member'}</span>
                    {!s.assignedAdvisor && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Unassigned" />}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{s.lastMessage || 'No messages'}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{s.lastActivity ? new Date(s.lastActivity).toLocaleString() : ''}</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!activeSession && !loading && (
              <div className="text-center py-12">
                <span className="text-5xl mb-4 block">💬</span>
                <h3 className="text-lg font-bold text-infinity-navy dark:text-white mb-1">Start a Conversation</h3>
                <p className="text-sm text-gray-500 mb-4">Describe your legal matter below. Our AI will provide immediate guidance while a human advisor is being assigned.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['I was unfairly dismissed', 'Landlord eviction issue', 'Need divorce advice', 'Consumer complaint'].map((q, i) => (
                    <button key={i} onClick={() => setNewMessage(q)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:bg-[#c9a961]/10 hover:text-[#c9a961] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-infinity-gold/30 border-t-infinity-gold rounded-full animate-spin mx-auto"></div>
              </div>
            )}

            {messages.map((msg, i) => {
              const style = getSenderStyle(msg.sender)
              return (
                <div key={msg.id || i} className={`max-w-[80%] ${style.align}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-bold ${style.labelColor}`}>
                      {msg.sender === 'member' && !isAdvisor ? 'You' : msg.sender === 'ai' ? '🤖 Infinity AI' : msg.sender === 'advisor' ? '⚖️ Legal Advisor' : msg.userName || style.label}
                    </span>
                    <span className="text-[9px] text-gray-300">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</span>
                  </div>
                  <div className={`${style.bg} ${style.text} rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap`}>
                    {msg.message}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isAdvisor ? 'Reply to member...' : 'Describe your legal matter or ask a question...'}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50"
              />
              <button type="submit" disabled={sending || !newMessage.trim()} className="px-5 py-2.5 bg-[#0f2b46] hover:bg-[#1a365d] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {sending ? '...' : 'Send'}
              </button>
            </div>
            {!isAdvisor && (
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">AI provides immediate guidance. A human legal advisor will follow up on your matter.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
