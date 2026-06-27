'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, MessageSquare, User, Clock, CheckCircle2,
  ShieldCheck, Phone, Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string | null; email: string };
  recipient?: { full_name: string | null; email: string };
}

interface ClientMessagesViewProps {
  token: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
}

export function ClientMessagesView({ token, user }: ClientMessagesViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [token]);

  const loadMessages = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/messages?perPage=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data?.data || data.data || []);
      }
    } catch (e) {
      console.error('Messages load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!token || !replyText.trim() || !selectedMessage) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: selectedMessage.sender_id === user?.id ? selectedMessage.recipient_id : selectedMessage.sender_id,
          subject: selectedMessage.subject ? `Re: ${selectedMessage.subject}` : undefined,
          content: replyText.trim(),
        }),
      });
      if (res.ok) {
        setReplyText('');
        await loadMessages();
      }
    } catch (e) {
      console.error('Send message error:', e);
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read && m.recipient_id === user?.id).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Messages</h2>
          <p className="text-[13px] text-slate-500">
            Secure communication with your legal advisor
            {unreadCount > 0 && <span className="ml-2 text-[#a88832]">({unreadCount} unread)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-[#c9a84c]/30 text-[#a88832]">
            <ShieldCheck className="w-3 h-3 mr-1" /> Encrypted
          </Badge>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="card-premium">
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No messages yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Your secure conversation with your legal advisor will appear here. Messages are encrypted and POPIA compliant.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="card-premium overflow-hidden">
            <div className="p-3 border-b border-slate-100/80">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inbox</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-[#c9a84c]/5 border-l-[3px] border-l-[#c9a84c]' :
                    !msg.is_read && msg.recipient_id === user?.id ? 'bg-blue-50/30 border-l-[3px] border-l-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-[10px] font-bold">
                        {msg.sender?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {msg.sender_id === user?.id ? 'You' : msg.sender?.full_name || 'Legal Advisor'}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {msg.subject || msg.content?.substring(0, 50)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Detail */}
          <div className="card-premium lg:col-span-2 overflow-hidden flex flex-col">
            {selectedMessage ? (
              <>
                <div className="p-4 border-b border-slate-100/80">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-xs font-bold">
                        {selectedMessage.sender?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-[#0c1e3c]">
                        {selectedMessage.sender_id === user?.id ? 'You' : selectedMessage.sender?.full_name || 'Legal Advisor'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(selectedMessage.created_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {selectedMessage.subject && (
                    <h3 className="text-base font-semibold text-[#0c1e3c] mt-3">{selectedMessage.subject}</h3>
                  )}
                </div>

                <div className="flex-1 p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>

                {/* Reply area */}
                <div className="p-3 border-t border-slate-100/80 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type your reply..."
                      className="flex-1 h-9 text-sm"
                      disabled={sending}
                    />
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={sending || !replyText.trim()}
                      className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] h-9"
                    >
                      {sending ? '...' : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 text-center">
                    <ShieldCheck className="w-2.5 h-2.5 inline" /> Messages are encrypted end-to-end
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400">Select a message to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
