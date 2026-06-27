'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AskInfinityBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: 'Hello! I\'m Ask Infinity, your AI legal assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    'What are my rights as a tenant?',
    'How does CCMA work?',
    'What is POPIA?',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: messages.slice(-6) }),
      });
      const data = await res.json();
      if (data.success && data.data?.response) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.data.response }]);
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'I\'m sorry, I couldn\'t process that. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Network error. Please check your connection and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#0c1e3c] to-[#1a3358] shadow-lg shadow-[#0c1e3c]/30 flex items-center justify-center group hover:shadow-xl hover:shadow-[#0c1e3c]/40 transition-all duration-300 hover:scale-105 border border-[#c9a84c]/20"
          aria-label="Ask Infinity AI Assistant"
        >
          <Sparkles className="w-6 h-6 text-[#c9a84c] group-hover:scale-110 transition-transform duration-200" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#c9a84c] rounded-full flex items-center justify-center animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#0c1e3c] rounded-full" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-[#1a3358] bg-[#0c1e3c] animate-scale-in flex flex-col" style={{ height: '480px' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1a3358] bg-gradient-to-r from-[#0c1e3c] to-[#132d52] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#c9a84c]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ask Infinity</p>
                <p className="text-[9px] text-[#7a94b8]">AI Legal Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[#132d52] rounded-lg transition-colors" aria-label="Close chat">
              <X className="w-4 h-4 text-[#7a94b8]" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#c9a84c]/15 border border-[#c9a84c]/25 text-[#e0c97a]'
                    : 'bg-[#0c1e3c] border border-[#1a3358] text-[#8fa4c4]'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-[#c9a84c]" />
                      <span className="text-[10px] font-medium text-[#c9a84c]">Ask Infinity</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#0c1e3c] border border-[#1a3358] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#c9a84c] animate-pulse" />
                    <span className="text-sm text-[#7a94b8]">Thinking...</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-[#7a94b8] uppercase tracking-wider mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#1a3358] text-[#8fa4c4] hover:bg-[#0c1e3c] hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-[#1a3358] bg-[#0c1e3c]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your legal question..."
                aria-label="Type your legal question for Ask Infinity"
                className="flex-1 bg-[#132d52] border border-[#1a3358] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a7199] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 transition-colors"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] disabled:opacity-50 h-10 w-10 p-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[9px] text-[#7a94b8] mt-1.5 text-center">
              General legal information only — not legal advice. <ShieldCheck className="w-2.5 h-2.5 inline" /> POPIA Compliant
            </p>
          </div>
        </div>
      )}
    </>
  );
}
