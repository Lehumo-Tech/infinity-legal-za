'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: 'Welcome to Infinity Legal SA. I\'m your AI legal assistant — I can help you understand your rights, explain legal processes, and guide you on next steps. What legal matter can I help you with today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.data }]);
      } else {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: 'I\'m having trouble connecting right now. Please try again in a moment.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: 'Network error. Please check your connection and try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-[#f7f8fa]">
          <div className="w-8 h-8 rounded-full bg-[#0c1e3c] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#c9a84c]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0c1e3c]">Infinity Legal AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">Online · Confidential</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user'
                ? 'bg-[#0c1e3c] text-white rounded-2xl rounded-br-md'
                : 'bg-[#f7f8fa] text-slate-700 rounded-2xl rounded-bl-md border border-slate-100'
              } px-4 py-3`}>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#f7f8fa] border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about your legal matter..."
              className="flex-1 h-10 border-slate-200 focus:border-[#c9a84c]/40 focus:ring-[#c9a84c]/20 text-sm"
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-[#0c1e3c] text-white hover:bg-[#1a3358] rounded-xl h-10 w-10 p-0 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 text-center">AI responses are for informational purposes only and do not constitute legal advice.</p>
        </div>
      </div>
    </div>
  );
}
