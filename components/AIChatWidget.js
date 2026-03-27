'use client'

import { useState, useRef, useEffect } from 'react'

const QUICK_QUESTIONS = [
  'What policies do you offer?',
  'How much does it cost?',
  'How do I join?',
  'I need urgent legal help',
  'What does Complete Cover include?',
]

const INSTANT_ANSWERS = {
  'what policies do you offer': {
    answer: 'We offer 3 legal protection policies:\n\n• **Labour Shield** (R95/mo) — Employment law coverage up to R72,300 per case\n• **Civil Guard** (R115/mo) — Civil law coverage up to R78,500 per case\n• **Complete Cover** (R130/mo) — Employment, civil AND criminal law coverage up to R100,000 per case\n\nAll policies include 24-hour legal assistance, free will & testament, and family coverage.',
    cta: { text: 'View Pricing', link: '/pricing' },
  },
  'how much does it cost': {
    answer: 'Our policies start from just **R95/month**:\n\n• Labour Shield — R95/mo\n• Civil Guard — R115/mo (most popular)\n• Complete Cover — R130/mo\n\nAll prices include cover for you, your spouse, and children under 21.',
    cta: { text: 'See Full Pricing', link: '/pricing' },
  },
  'how do i join': {
    answer: 'Joining is quick and easy! Just complete our online application form. You\'ll need:\n\n1. Your ID or passport number\n2. Contact details\n3. Banking details for the monthly debit order\n\nYou can start right away — applications are processed within 24 hours.',
    cta: { text: 'Join Now', link: '/apply' },
  },
  'i need urgent legal help': {
    answer: '🚨 For urgent legal matters, I recommend using our **AI Legal Intake** — it\'s free, instant, and available 24/7.\n\nOur AI will:\n• Analyze your legal situation\n• Identify relevant SA laws\n• Provide immediate next steps\n• Match you with a specialist attorney\n\nIf this is an emergency involving danger to life, please also contact SAPS at 10111.',
    cta: { text: 'Start AI Intake Now', link: '/intake' },
  },
  'what does complete cover include': {
    answer: 'Complete Cover (R130/mo) is our most comprehensive policy with **R100,000 coverage per case**. It includes:\n\n• Employment, civil AND criminal law matters\n• R22,000 accidental death benefit\n• Uncontested divorce & child maintenance\n• Antenuptial contracts\n• 20% discount on property conveyancing\n• Municipal services benefit\n• Legacy Accumulator (loyalty benefit)\n• Tax advice, assistance AND submission\n• Free last will & testament',
    cta: { text: 'Join Complete Cover', link: '/apply' },
  },
}

function findAnswer(question) {
  const lower = question.toLowerCase().trim()
  
  // Direct match
  if (INSTANT_ANSWERS[lower]) return INSTANT_ANSWERS[lower]
  
  // Keyword matching
  if (lower.includes('cost') || lower.includes('price') || lower.includes('how much') || lower.includes('afford'))
    return INSTANT_ANSWERS['how much does it cost']
  if (lower.includes('join') || lower.includes('sign up') || lower.includes('apply') || lower.includes('register') || lower.includes('member'))
    return INSTANT_ANSWERS['how do i join']
  if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('help') || lower.includes('arrested') || lower.includes('fired'))
    return INSTANT_ANSWERS['i need urgent legal help']
  if (lower.includes('policy') || lower.includes('policies') || lower.includes('offer') || lower.includes('plan') || lower.includes('cover'))
    return INSTANT_ANSWERS['what policies do you offer']
  if (lower.includes('complete') || lower.includes('comprehensive') || lower.includes('best') || lower.includes('premium'))
    return INSTANT_ANSWERS['what does complete cover include']
  if (lower.includes('labour') || lower.includes('employ') || lower.includes('work') || lower.includes('ccma') || lower.includes('dismiss'))
    return { answer: 'For employment-related legal matters, our **Labour Shield** policy (R95/mo) covers you for up to **R72,300 per case**. This includes unfair dismissal, CCMA disputes, workplace harassment, and more.\n\nFor immediate help, try our free AI Legal Intake.', cta: { text: 'Get AI Help Now', link: '/intake' } }
  if (lower.includes('divorce') || lower.includes('child') || lower.includes('maintenance') || lower.includes('family') || lower.includes('custody'))
    return { answer: 'Family law matters like divorce and child maintenance are covered under our **Complete Cover** policy (R130/mo, up to R100,000 per case).\n\nFor immediate guidance, use our free AI Intake.', cta: { text: 'Start AI Intake', link: '/intake' } }
  if (lower.includes('criminal') || lower.includes('arrest') || lower.includes('bail') || lower.includes('charge'))
    return { answer: 'Criminal law matters are covered under our **Complete Cover** policy (R130/mo, up to R100,000 per case).\n\nIf you need urgent help, our AI Intake can analyze your situation immediately — it\'s free and available 24/7.', cta: { text: 'Start AI Intake', link: '/intake' } }

  // Default for unmatched
  return {
    answer: 'I can help with questions about our legal policies, pricing, how to join, or urgent legal help. For detailed legal questions about your specific situation, I recommend using our **free AI Legal Intake** — it provides a full analysis with relevant SA legislation and next steps.',
    cta: { text: 'Try AI Legal Intake', link: '/intake' },
  }
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m **Infinity AI** 🤖\n\nI can help you understand our legal protection policies, pricing, and how to get started. What would you like to know?', time: new Date() },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSend = async (text) => {
    const question = text || input.trim()
    if (!question) return
    setInput('')

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: question, time: new Date() }])
    setIsTyping(true)

    // Simulate typing delay for natural feel
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))

    const { answer, cta } = findAnswer(question)
    setMessages(prev => [...prev, { role: 'bot', text: answer, cta, time: new Date() }])
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Simple markdown-ish rendering
  const renderText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-gray-700 rotate-0' : 'bg-infinity-navy hover:bg-[#1a3055] animate-bounce'
        }`}
        style={{ animationDuration: isOpen ? '0s' : '2s', animationIterationCount: 3 }}
        aria-label="Chat with Infinity AI"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Notification dot */}
      {!isOpen && (
        <div className="fixed bottom-[72px] right-6 z-50 bg-infinity-gold text-infinity-navy text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse pointer-events-none">
          Ask me anything!
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-infinity-navy p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-infinity-gold/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Infinity AI</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-[11px] text-white/60">Online — Instant replies</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-infinity-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'} rounded-2xl px-4 py-3 text-[13px] leading-relaxed`}>
                  <div dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                  {msg.cta && (
                    <a href={msg.cta.link} className="inline-block mt-2 bg-infinity-gold text-infinity-navy px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-400 transition-colors">
                      {msg.cta.text} →
                    </a>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)}
                  className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full hover:bg-infinity-gold/10 hover:text-infinity-navy dark:hover:text-infinity-gold transition-colors border border-gray-200 dark:border-gray-700">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-infinity-gold/50"
              />
              <button onClick={() => handleSend()}
                disabled={!input.trim()}
                className="px-4 py-2.5 bg-infinity-navy text-white rounded-xl text-sm font-semibold hover:bg-[#1a3055] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-1.5">
              Powered by Infinity AI • Not legal advice
            </p>
          </div>
        </div>
      )}
    </>
  )
}
