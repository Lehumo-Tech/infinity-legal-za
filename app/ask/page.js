'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const SUGGESTED_QUESTIONS = [
  "What are my rights if I've been unfairly dismissed?",
  "Can I return a defective product to the store?",
  "My landlord won't return my deposit. What can I do?",
  "What happens if I'm arrested?",
  "How do I apply for a protection order?",
  "What are the rules for overtime pay?",
  "Can my employer fire me without a hearing?",
  "How does debt review work in South Africa?",
]

export default function AskInfinityPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (queryOverride) => {
    const query = queryOverride || input.trim()
    if (!query || loading) return

    setInput('')
    const userMsg = { role: 'user', content: query, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          messageCount,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date(), categories: data.categories }])
        setMessageCount(data.messageCount || messageCount + 1)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Something went wrong. Please try again.', timestamp: new Date(), isError: true }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection and try again.', timestamp: new Date(), isError: true }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <div>
              <span className="text-lg font-bold text-[#0f2b46] block leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Ask Infinity</span>
              <span className="text-[10px] text-gray-400 leading-tight">AI Legal Information • South Africa</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="text-xs text-[#c9a961] font-bold hover:text-[#0f2b46] hidden sm:block">View Plans</Link>
            <Link href="/intake" className="text-xs px-3 py-1.5 bg-[#0f2b46] text-white rounded-lg font-semibold hover:bg-[#1a365d]">Free Analysis</Link>
          </div>
        </div>
      </nav>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#0f2b46] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">⚖️</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0f2b46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ask Infinity
              </h1>
              <p className="text-gray-500 mb-1 max-w-md mx-auto">
                Free AI-powered legal information based on South African law.
              </p>
              <p className="text-xs text-gray-400 mb-8">
                Get instant answers about your rights, citing specific Acts and Sections.
              </p>

              {/* Suggested Questions */}
              <div className="max-w-xl mx-auto">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Popular Questions</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-left text-sm px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all group"
                    >
                      <span className="text-[#c9a961] mr-2 group-hover:text-[#0f2b46]">→</span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Benefits */}
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                <span>✓ Free to use</span>
                <span>✓ Cites SA legislation</span>
                <span>✓ No sign-up required</span>
                <span>✓ POPIA compliant</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-[#0f2b46] rounded-lg flex items-center justify-center">
                      <span className="text-xs">⚖️</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Ask Infinity</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-[#0f2b46] text-white rounded-br-md' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md' 
                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                      <FormattedResponse content={msg.content} />
                    </div>
                  )}
                </div>
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-right text-gray-400' : 'text-gray-300'}`}>
                  {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="mb-4 flex justify-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-[#0f2b46] rounded-lg flex items-center justify-center">
                    <span className="text-xs">⚖️</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Ask Infinity</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#c9a961] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#c9a961] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#c9a961] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-400">Researching SA legislation...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your legal rights in South Africa..."
                rows={1}
                className="w-full resize-none px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all bg-gray-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-[#0f2b46] text-white rounded-xl font-bold text-sm hover:bg-[#1a365d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
          {/* Disclaimer Footer */}
          <p className="text-[9px] text-gray-400 mt-2 text-center leading-relaxed">
            Ask Infinity provides general legal information based on SA legislation. Not legal advice. No attorney-client relationship created. 
            Join <Link href="/pricing" className="text-[#c9a961] hover:underline">Infinity Legal</Link> for personalised assistance. Subject to terms, waiting periods, coverage limits.
          </p>
        </div>
      </div>
    </div>
  )
}

/* Markdown-like formatter for AI responses */
function FormattedResponse({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let i = 0

  for (const line of lines) {
    i++
    const trimmed = line.trim()
    if (!trimmed) { elements.push(<br key={i} />); continue }

    // Headers
    if (trimmed.startsWith('###')) {
      elements.push(<h4 key={i} className="font-bold text-[#0f2b46] mt-3 mb-1 text-sm">{trimmed.replace(/^#+\s*/, '')}</h4>)
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(<p key={i} className="font-bold text-[#0f2b46] mt-2 mb-1">{trimmed.replace(/\*\*/g, '')}</p>)
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('✓') || trimmed.startsWith('✗')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-[#c9a961] mt-0.5 flex-shrink-0">{trimmed[0] === '✓' ? '✓' : trimmed[0] === '✗' ? '✗' : '•'}</span>
          <span><InlineFormat text={trimmed.replace(/^[•\-✓✗]\s*/, '')} /></span>
        </div>
      )
    } else if (trimmed.startsWith('→')) {
      const isLink = trimmed.includes('(/') 
      if (isLink) {
        const match = trimmed.match(/\[(.+?)\]\((.+?)\)/)
        if (match) {
          elements.push(
            <div key={i} className="mt-2">
              <Link href={match[2]} className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg text-xs hover:bg-[#d4af37] transition-colors">
                {match[1]} →
              </Link>
            </div>
          )
        } else {
          elements.push(<p key={i} className="text-sm text-[#c9a961] font-medium"><InlineFormat text={trimmed} /></p>)
        }
      } else {
        elements.push(<p key={i} className="ml-3 text-gray-600 italic text-xs"><InlineFormat text={trimmed.replace(/^→\s*/, '')} /></p>)
      }
    } else if (trimmed.startsWith('⚠️')) {
      elements.push(
        <div key={i} className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed"><InlineFormat text={trimmed} /></p>
        </div>
      )
    } else if (trimmed.match(/^[🔍📜💡🚀⚖️]/)) {
      elements.push(<p key={i} className="font-bold text-[#0f2b46] mt-3 mb-1"><InlineFormat text={trimmed} /></p>)
    } else {
      elements.push(<p key={i} className="my-0.5"><InlineFormat text={trimmed} /></p>)
    }
  }

  return <>{elements}</>
}

function InlineFormat({ text }) {
  // Handle **bold** and _italic_
  const parts = text.split(/(\*\*.*?\*\*|_.*?_)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-[#0f2b46]">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('_') && part.endsWith('_')) {
          return <em key={i} className="text-gray-500">{part.slice(1, -1)}</em>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
