'use client';

/**
 * CommunicationsView — Email & SMS Dashboard
 *
 * Features:
 * - Service status overview (SMTP/Resend/Twilio connection)
 * - Send email or SMS with template support
 * - Communication logs with filtering
 * - Quick actions (welcome, verification, test)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Phone, Send, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertCircle, Search, Filter, Plus, Eye, Settings, Activity,
  MessageSquare, Shield, TestTube, ChevronDown, ExternalLink,
  FileText, Zap, Radio, Server, Globe, Smartphone
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url?: string | null;
  phone?: string | null;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface CommLog {
  id: string;
  user_id?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_name?: string | null;
  channel: string;
  category: string;
  subject?: string | null;
  content: string;
  status: string;
  provider?: string | null;
  provider_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
  user?: { id: string; full_name: string | null; email: string; role: string } | null;
}

interface ServiceStatus {
  email: {
    configured: boolean;
    activeProvider: string;
    providerLabel: string;
    fromEmail: string;
    message: string;
    smtpConfigured: boolean;
    resendConfigured: boolean;
    smtpHost?: string | null;
    setupInstructions?: Record<string, string>;
  };
  sms: {
    configured: boolean;
    provider: string;
    phoneNumber: string;
    message: string;
  };
  stats: {
    totalEmails: number;
    totalSms: number;
    sentToday: number;
    failedToday: number;
  };
}

interface CommunicationsViewProps {
  token: string | null;
  user: User | null;
  staff: StaffMember[];
}

// ============================================
// COMPONENT
// ============================================

export function CommunicationsView({ token, user, staff }: CommunicationsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsFilter, setLogsFilter] = useState<{ channel?: string; status?: string }>({});
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Send dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<'email' | 'sms'>('email');
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sendTemplate, setSendTemplate] = useState('');
  const [sendRecipientName, setSendRecipientName] = useState('');
  const [sending, setSending] = useState(false);

  // Log detail dialog
  const [selectedLog, setSelectedLog] = useState<CommLog | null>(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);

  const isManagement = user && ['managing_director', 'admin', 'systems_admin'].includes(user.role);

  // ---- Load service status ----
  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/communications/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setServiceStatus(data.data || data);
      }
    } catch (err) {
      console.error('Failed to load comm status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, [token]);

  // ---- Load logs ----
  const loadLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (logsFilter.channel) params.set('channel', logsFilter.channel);
      if (logsFilter.status) params.set('status', logsFilter.status);

      const res = await fetch(`/api/communications/logs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const d = data.data || data;
        setLogs(Array.isArray(d.logs) ? d.logs : []);
        setLogsTotal(d.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [token, logsFilter]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadLogs(logsPage); }, [loadLogs, logsPage]);
  useEffect(() => {
    if (activeTab === 'logs') loadLogs(1);
  }, [activeTab, loadLogs]);

  // ---- Send message ----
  const handleSend = async () => {
    if (!sendTo) {
      toast.error('Recipient is required');
      return;
    }
    if (sendChannel === 'email' && !sendSubject && !sendTemplate) {
      toast.error('Subject is required for emails');
      return;
    }
    if (!sendBody && !sendTemplate) {
      toast.error('Message content or template is required');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/communications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          channel: sendChannel,
          to: sendTo,
          subject: sendSubject,
          body: sendBody,
          template: sendTemplate || undefined,
          variables: {
            full_name: sendRecipientName || sendTo,
            first_name: sendRecipientName?.split(' ')[0] || sendTo,
            email: sendChannel === 'email' ? sendTo : '',
            phone: sendChannel === 'sms' ? sendTo : '',
          },
          recipientName: sendRecipientName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const d = data.data || data;
        toast.success(d.message || 'Message sent successfully');
        setSendDialogOpen(false);
        resetSendForm();
        loadLogs(1);
        loadStatus();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err) {
      toast.error('Network error — please try again');
    } finally {
      setSending(false);
    }
  };

  // ---- Quick actions ----
  const handleQuickSend = async (action: 'test_email' | 'test_sms' | 'welcome') => {
    if (!user) return;

    try {
      if (action === 'test_email') {
        const res = await fetch('/api/communications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            channel: 'email',
            to: user.email,
            subject: 'Test Email from Infinity Legal SA',
            body: `<p>Hi ${user.full_name?.split(' ')[0] || 'there'},</p><p>This is a test email from your Infinity Legal SA communication system.</p><p>If you received this, your email service is working correctly!</p><p>— Infinity Legal SA</p>`,
            category: 'notification',
            recipientName: user.full_name,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Test email sent! Check the logs for delivery status.');
          loadLogs(1);
          loadStatus();
        } else {
          toast.error(data.error || 'Failed to send test email');
        }
      } else if (action === 'test_sms' && user.phone) {
        const res = await fetch('/api/communications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            channel: 'sms',
            to: user.phone,
            body: `Test SMS from Infinity Legal SA. If you received this, your SMS service is working!`,
            category: 'notification',
            recipientName: user.full_name,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Test SMS sent! Check the logs for delivery status.');
          loadLogs(1);
          loadStatus();
        } else {
          toast.error(data.error || 'Failed to send test SMS');
        }
      } else if (action === 'welcome') {
        const res = await fetch('/api/communications/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Welcome message sent!');
          loadLogs(1);
          loadStatus();
        } else {
          toast.error(data.error || 'Failed to send welcome message');
        }
      }
    } catch (err) {
      toast.error('Network error — please try again');
    }
  };

  const resetSendForm = () => {
    setSendTo('');
    setSendSubject('');
    setSendBody('');
    setSendTemplate('');
    setSendRecipientName('');
  };

  const openSendDialog = (channel: 'email' | 'sms', prefillTo?: string, prefillName?: string) => {
    setSendChannel(channel);
    setSendTo(prefillTo || '');
    setSendRecipientName(prefillName || '');
    setSendDialogOpen(true);
  };

  // ---- Helpers ----
  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'failed': case 'bounced': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const channelIcon = (channel: string) => channel === 'email' ? Mail : Smartphone;
  const channelColor = (channel: string) => channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return d; }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c] flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#c9a84c]" />
            Communications Hub
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">Manage email & SMS communications</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openSendDialog('email')}
            className="bg-[#0c1e3c] hover:bg-[#0c1e3c]/90 text-white gap-2"
          >
            <Mail className="w-4 h-4" /> Send Email
          </Button>
          <Button
            onClick={() => openSendDialog('sms')}
            className="bg-[#c9a84c] hover:bg-[#c9a84c]/90 text-white gap-2"
          >
            <Smartphone className="w-4 h-4" /> Send SMS
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Message Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ============================== OVERVIEW TAB ============================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Service Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Status */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Service
                  {serviceStatus?.email?.configured ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Active</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Simulation</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Provider</span>
                      <span className="font-medium text-[#0c1e3c]">{serviceStatus?.email?.providerLabel || 'Not configured'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">From</span>
                      <span className="font-medium text-[#0c1e3c] text-[12px]">{serviceStatus?.email?.fromEmail || '—'}</span>
                    </div>
                    {serviceStatus?.email?.smtpConfigured && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">SMTP Host</span>
                        <span className="font-medium text-[#0c1e3c]">{serviceStatus.email.smtpHost}</span>
                      </div>
                    )}
                    <p className="text-[12px] text-slate-400 mt-2 pt-2 border-t">
                      {serviceStatus?.email?.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMS Status */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  SMS Service
                  {serviceStatus?.sms?.configured ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Active</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Simulation</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Provider</span>
                      <span className="font-medium text-[#0c1e3c]">{serviceStatus?.sms?.provider || 'Not configured'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone Number</span>
                      <span className="font-medium text-[#0c1e3c]">{serviceStatus?.sms?.phoneNumber || '—'}</span>
                    </div>
                    <p className="text-[12px] text-slate-400 mt-2 pt-2 border-t">
                      {serviceStatus?.sms?.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Emails', value: serviceStatus?.stats?.totalEmails || 0, icon: Mail, color: 'text-blue-600' },
              { label: 'Total SMS', value: serviceStatus?.stats?.totalSms || 0, icon: Smartphone, color: 'text-purple-600' },
              { label: 'Sent Today', value: serviceStatus?.stats?.sentToday || 0, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'Failed Today', value: serviceStatus?.stats?.failedToday || 0, icon: XCircle, color: 'text-red-600' },
            ].map(stat => (
              <Card key={stat.label} className="py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold text-[#0c1e3c]">{stat.value}</p>
                    <p className="text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c9a84c]" />
                Quick Actions
              </CardTitle>
              <CardDescription>Test your communication setup or send quick messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 justify-start gap-3 hover:bg-blue-50"
                  onClick={() => handleQuickSend('test_email')}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Test Email</p>
                    <p className="text-[11px] text-slate-500">Send a test to yourself</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 justify-start gap-3 hover:bg-purple-50"
                  onClick={() => {
                    if (user?.phone) {
                      handleQuickSend('test_sms');
                    } else {
                      openSendDialog('sms');
                    }
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Test SMS</p>
                    <p className="text-[11px] text-slate-500">Send a test to yourself</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 justify-start gap-3 hover:bg-amber-50"
                  onClick={() => handleQuickSend('welcome')}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Welcome Message</p>
                    <p className="text-[11px] text-slate-500">Resend your welcome email</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Messages</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('logs')} className="text-[#c9a84c] text-xs">
                  View All <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No messages sent yet</p>
                  <p className="text-xs mt-1">Use the Quick Actions above to send your first message</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.slice(0, 5).map(log => {
                    const Icon = channelIcon(log.channel);
                    return (
                      <button
                        key={log.id}
                        onClick={() => { setSelectedLog(log); setLogDetailOpen(true); }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${channelColor(log.channel)}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#0c1e3c] truncate">
                              {log.subject || log.content?.slice(0, 40) || 'Message'}
                            </span>
                            <Badge className={`${statusColor(log.status)} text-[9px] px-1.5 py-0`}>
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            To: {log.recipient_name || log.recipient_email || log.recipient_phone}
                            {log.provider === 'simulated' && ' (simulated)'}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatDate(log.created_at)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== LOGS TAB ============================== */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={logsFilter.channel || 'all'} onValueChange={(v) => {
              setLogsFilter(prev => ({ ...prev, channel: v === 'all' ? undefined : v }));
              setLogsPage(1);
            }}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="sms">📱 SMS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={logsFilter.status || 'all'} onValueChange={(v) => {
              setLogsFilter(prev => ({ ...prev, status: v === 'all' ? undefined : v }));
              setLogsPage(1);
            }}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">✅ Sent</SelectItem>
                <SelectItem value="failed">❌ Failed</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="delivered">📦 Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => loadLogs(logsPage)} className="gap-1 h-9">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>

            <span className="text-xs text-slate-400 ml-auto">
              {logsTotal} total messages
            </span>
          </div>

          {/* Logs Table */}
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No messages found</p>
              <p className="text-xs mt-1">Try adjusting your filters or send a new message</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const Icon = channelIcon(log.channel);
                return (
                  <button
                    key={log.id}
                    onClick={() => { setSelectedLog(log); setLogDetailOpen(true); }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${channelColor(log.channel)}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#0c1e3c] truncate max-w-[200px] sm:max-w-none">
                          {log.subject || log.content?.slice(0, 50) || 'Message'}
                        </span>
                        <Badge className={`${statusColor(log.status)} text-[9px] px-1.5 py-0`}>
                          {log.status}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        To: {log.recipient_name || log.recipient_email || log.recipient_phone}
                        {log.provider === 'simulated' && ' ⚡ simulated'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-[11px] text-slate-500">{formatDate(log.created_at)}</p>
                      <p className="text-[10px] text-slate-400">{log.provider}</p>
                    </div>
                  </button>
                );
              })}

              {/* Pagination */}
              {logsTotal > 20 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline" size="sm"
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-slate-500">
                    Page {logsPage} of {Math.ceil(logsTotal / 20)}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    disabled={logsPage >= Math.ceil(logsTotal / 20)}
                    onClick={() => setLogsPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============================== SETTINGS TAB ============================== */}
        <TabsContent value="settings" className="space-y-6">
          {/* Email Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                Email Service Configuration
              </CardTitle>
              <CardDescription>Add these environment variables to your .env file to enable email sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SMTP Option */}
              <div className="p-4 rounded-lg bg-slate-50 border">
                <h4 className="font-semibold text-sm text-[#0c1e3c] mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Option 1: SMTP (Recommended)
                </h4>
                <p className="text-xs text-slate-500 mb-3">Works with Gmail, Outlook, AWS SES, Mailgun, or any SMTP provider</p>
                <div className="bg-[#0c1e3c] rounded-lg p-4 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto">
                  <p className="text-slate-500"># SMTP Configuration</p>
                  <p>SMTP_HOST=smtp.gmail.com</p>
                  <p>SMTP_PORT=587</p>
                  <p>SMTP_USER=you@gmail.com</p>
                  <p>SMTP_PASS=your-app-password</p>
                  <p>SMTP_SECURE=false</p>
                  <p className="text-slate-500"># Sender address</p>
                  <p>EMAIL_FROM=&quot;Infinity Legal SA &lt;you@gmail.com&gt;&quot;</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Gmail Users:</strong> Enable 2-Factor Authentication, then create an App Password at
                    myaccount.google.com/apppasswords. Use that 16-character password as SMTP_PASS.
                  </p>
                </div>
              </div>

              {/* Resend Option */}
              <div className="p-4 rounded-lg bg-slate-50 border">
                <h4 className="font-semibold text-sm text-[#0c1e3c] mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Option 2: Resend API
                </h4>
                <p className="text-xs text-slate-500 mb-3">Modern email API — free 100 emails/day at resend.com</p>
                <div className="bg-[#0c1e3c] rounded-lg p-4 font-mono text-xs text-emerald-400 space-y-1">
                  <p>RESEND_API_KEY=re_xxxxxxxxxxxx</p>
                  <p>EMAIL_FROM=&quot;Infinity Legal SA &lt;onboarding@resend.dev&gt;&quot;</p>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${serviceStatus?.email?.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-[#0c1e3c]">
                    Current: {serviceStatus?.email?.providerLabel || 'Not configured'}
                  </p>
                  <p className="text-xs text-slate-500">{serviceStatus?.email?.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                SMS Service Configuration
              </CardTitle>
              <CardDescription>Add these environment variables to enable SMS sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border">
                <h4 className="font-semibold text-sm text-[#0c1e3c] mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Twilio SMS
                </h4>
                <p className="text-xs text-slate-500 mb-3">Industry-standard SMS API — supports South African numbers (+27)</p>
                <div className="bg-[#0c1e3c] rounded-lg p-4 font-mono text-xs text-emerald-400 space-y-1">
                  <p className="text-slate-500"># Twilio Configuration</p>
                  <p>TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx</p>
                  <p>TWILIO_AUTH_TOKEN=your-auth-token</p>
                  <p>TWILIO_PHONE_NUMBER=+1XXXXXXXXXX</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${serviceStatus?.sms?.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-[#0c1e3c]">
                    Current: {serviceStatus?.sms?.provider || 'Not configured'}
                  </p>
                  <p className="text-xs text-slate-500">{serviceStatus?.sms?.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulation Mode Notice */}
          {!serviceStatus?.email?.configured && !serviceStatus?.sms?.configured && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Simulation Mode Active</p>
                  <p className="text-xs text-amber-700 mt-1">
                    No email or SMS providers are configured. All messages are logged to the database but not actually sent.
                    This is perfect for testing the UI and workflows. When you&apos;re ready to go live, follow the setup instructions above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================== SEND DIALOG ============================== */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sendChannel === 'email' ? <Mail className="w-5 h-5 text-blue-500" /> : <Smartphone className="w-5 h-5 text-purple-500" />}
              Send {sendChannel === 'email' ? 'Email' : 'SMS'}
            </DialogTitle>
            <DialogDescription>
              {sendChannel === 'email'
                ? 'Send an email using a template or custom content'
                : 'Send an SMS — use SA format: 0681234567 or +27681234567'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Channel Toggle */}
            <div className="flex gap-2">
              <Button
                variant={sendChannel === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSendChannel('email')}
                className={sendChannel === 'email' ? 'bg-blue-600' : ''}
              >
                <Mail className="w-3.5 h-3.5 mr-1" /> Email
              </Button>
              <Button
                variant={sendChannel === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSendChannel('sms')}
                className={sendChannel === 'sms' ? 'bg-purple-600' : ''}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1" /> SMS
              </Button>
            </div>

            {/* Template */}
            <div>
              <Label className="text-xs">Template (optional)</Label>
              <Select value={sendTemplate} onValueChange={setSendTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template or write custom..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="verification">Verification OTP</SelectItem>
                  <SelectItem value="consultation_reminder">Consultation Reminder</SelectItem>
                  <SelectItem value="case_update">Case Update</SelectItem>
                  <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div>
              <Label className="text-xs">
                {sendChannel === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                className="mt-1"
                placeholder={sendChannel === 'email' ? 'client@example.com' : '068 123 4567'}
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
            </div>

            {/* Recipient Name */}
            <div>
              <Label className="text-xs">Recipient Name (optional)</Label>
              <Input
                className="mt-1"
                placeholder="John Doe"
                value={sendRecipientName}
                onChange={(e) => setSendRecipientName(e.target.value)}
              />
            </div>

            {/* Subject (email only) */}
            {sendChannel === 'email' && (
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  className="mt-1"
                  placeholder="Email subject line"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  disabled={!!sendTemplate}
                />
              </div>
            )}

            {/* Body */}
            <div>
              <Label className="text-xs">
                {sendChannel === 'email' ? 'Message (HTML supported)' : 'Message'}
              </Label>
              <Textarea
                className="mt-1"
                placeholder={sendChannel === 'email' ? 'Type your email content here...' : 'Type your SMS message (max 160 chars per segment)...'}
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                rows={sendChannel === 'email' ? 6 : 3}
                disabled={!!sendTemplate}
              />
              {sendChannel === 'sms' && sendBody && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {sendBody.length}/160 characters
                </p>
              )}
            </div>

            {serviceStatus && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  (sendChannel === 'email' ? serviceStatus.email?.configured : serviceStatus.sms?.configured) ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {sendChannel === 'email'
                  ? (serviceStatus.email?.configured ? `Sending via ${serviceStatus.email.providerLabel}` : 'Simulation mode — email will be logged but not sent')
                  : (serviceStatus.sms?.configured ? `Sending via ${serviceStatus.sms.provider}` : 'Simulation mode — SMS will be logged but not sent')
                }
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || !sendTo}
              className={sendChannel === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {sending ? (
                <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send {sendChannel === 'email' ? 'Email' : 'SMS'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================== LOG DETAIL SHEET ============================== */}
      <Sheet open={logDetailOpen} onOpenChange={setLogDetailOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedLog && (() => {
                const Icon = channelIcon(selectedLog.channel);
                return <Icon className="w-5 h-5" />;
              })()}
              Message Details
            </SheetTitle>
            <SheetDescription>View sent message details and delivery status</SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                {[
                  { label: 'Channel', value: selectedLog.channel.toUpperCase() },
                  { label: 'Status', value: selectedLog.status, badge: true },
                  { label: 'Category', value: selectedLog.category },
                  { label: 'Provider', value: selectedLog.provider || '—' },
                  { label: 'Recipient', value: selectedLog.recipient_name || selectedLog.recipient_email || selectedLog.recipient_phone || '—' },
                  { label: 'Email', value: selectedLog.recipient_email },
                  { label: 'Phone', value: selectedLog.recipient_phone },
                  ...(selectedLog.subject ? [{ label: 'Subject', value: selectedLog.subject }] : []),
                  { label: 'Sent At', value: selectedLog.sent_at ? formatDate(selectedLog.sent_at) : 'Not yet sent' },
                  { label: 'Created', value: formatDate(selectedLog.created_at) },
                  ...(selectedLog.provider_id ? [{ label: 'Provider ID', value: selectedLog.provider_id }] : []),
                  ...(selectedLog.error_message ? [{ label: 'Error', value: selectedLog.error_message }] : []),
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-4 py-1">
                    <span className="text-xs text-slate-500 flex-shrink-0">{item.label}</span>
                    {item.badge ? (
                      <Badge className={`${statusColor(item.value)} text-xs`}>{item.value}</Badge>
                    ) : (
                      <span className="text-xs font-medium text-[#0c1e3c] text-right break-all">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-slate-500">Content Preview</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border text-xs text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                  {selectedLog.content?.length > 2000
                    ? selectedLog.content.slice(0, 2000) + '... (truncated)'
                    : selectedLog.content || 'No content'}
                </div>
              </div>

              {/* Resend Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const channel = selectedLog.channel as 'email' | 'sms';
                  openSendDialog(
                    channel,
                    selectedLog.recipient_email || selectedLog.recipient_phone || '',
                    selectedLog.recipient_name || ''
                  );
                  setLogDetailOpen(false);
                }}
              >
                <Send className="w-4 h-4" /> Resend to this recipient
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
