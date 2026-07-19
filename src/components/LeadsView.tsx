'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw, ChevronLeft, ChevronRight, Plus, X, Mail, Phone, Target,
  Briefcase, Calendar, AlertCircle, UserCircle2, Send, Sparkles,
  CheckCircle2, XCircle, Loader2, FileText, Clock, User, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { clientTrack } from '@/lib/posthog-client';
import { TableSkeleton } from '@/components/LoadingSkeleton';

// ============================================
// TYPES
// ============================================

interface LeadUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone?: string | null;
}

interface LeadsViewProps {
  leads: any[];
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  loading?: boolean;
  token: string | null;
  user: LeadUser | null;
}

interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  case_type: string | null;
  description: string | null;
  estimated_value: number | null;
  urgency: string | null;
  lead_score: number | null;
  ai_summary: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  client: { id: string; full_name: string; email: string; role: string } | null;
  case: { id: string; case_ref: string; title: string; status: string } | null;
  reviewer: { id: string; full_name: string; email: string } | null;
}

// ============================================
// CONSTANTS
// ============================================

const VALID_CASE_TYPES = [
  'civil', 'criminal', 'family', 'corporate', 'property',
  'labour', 'immigration', 'tax', 'personal_injury', 'debt_recovery', 'other',
];

const PIPELINE_STATUSES = [
  'new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'nurturing',
];

const STAFF_ROLES = ['managing_director', 'systems_admin', 'admin', 'attorney', 'paralegal'];

// Status badge styles — uses neutral tones with brand-aligned accents; NO blue/indigo
const statusColors: Record<string, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  consultation_scheduled: 'bg-violet-50 text-violet-700 border-violet-200',
  retained: 'bg-teal-50 text-teal-700 border-teal-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
  nurturing: 'bg-slate-50 text-slate-600 border-slate-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-violet-50 text-violet-700 border-violet-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const pipelineTopColors: Record<string, string> = {
  new: 'border-t-sky-500',
  contacted: 'border-t-amber-500',
  qualified: 'border-t-emerald-500',
  consultation_scheduled: 'border-t-violet-500',
  retained: 'border-t-teal-500',
  lost: 'border-t-red-500',
  nurturing: 'border-t-slate-400',
};

const statusBorderColor: Record<string, string> = {
  new: '#0ea5e9', contacted: '#f59e0b', qualified: '#10b981',
  consultation_scheduled: '#8b5cf6', retained: '#14b8a6', lost: '#ef4444',
  nurturing: '#94a3b8',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number | null | undefined): string {
  if (!value && value !== 0) return '—';
  return `R ${Number(value).toLocaleString('en-ZA')}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

function statusBadgeClass(status: string): string {
  return statusColors[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

function authHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LeadsView({
  leads, page, total, onPageChange, onRefresh, loading, token, user,
}: LeadsViewProps) {
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const isStaff = STAFF_ROLES.includes(user?.role || '');

  // Create-lead dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    case_type: 'civil', urgency: 'medium', description: '', estimated_value: '',
  });

  // Detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Email inline form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Reset form when dialog closes
  useEffect(() => {
    if (!showCreate) {
      setForm({
        first_name: '', last_name: '', email: '', phone: '',
        case_type: 'civil', urgency: 'medium', description: '', estimated_value: '',
      });
    }
  }, [showCreate]);

  // ---- Create a new lead ----
  const handleCreateLead = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('First name, last name, and email are required');
      return;
    }
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || undefined,
          case_type: form.case_type,
          urgency: form.urgency,
          description: form.description || undefined,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Lead created for ${form.first_name} ${form.last_name}`);
        clientTrack('lead_created', {
          leadId: data.data?.id,
          caseType: form.case_type,
          source: 'manual',
        });
        setShowCreate(false);
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to create lead');
      }
    } catch (e) {
      console.error('Create lead error:', e);
      toast.error('Network error creating lead');
    } finally {
      setCreating(false);
    }
  };

  // ---- Open the detail drawer for a lead ----
  const openDetail = async (leadId: string) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    setDrawerOpen(true);
    setSelectedLead(null);
    setDetailLoading(true);
    setShowEmailForm(false);
    setEmailSubject('');
    setEmailBody('');
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.data as LeadDetail);
      } else {
        toast.error(data.error?.message || 'Failed to load lead');
        setDrawerOpen(false);
      }
    } catch (e) {
      console.error('Load lead error:', e);
      toast.error('Network error loading lead');
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ---- Update lead status (PUT) ----
  const updateLeadStatus = async (newStatus: string, successMsg: string, eventName?: string) => {
    if (!selectedLead || !token) return;
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(successMsg);
        if (eventName) {
          clientTrack(eventName, { leadId: selectedLead.id, status: newStatus });
        }
        // Refresh the in-drawer lead + the list
        await openDetail(selectedLead.id);
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to update lead');
      }
    } catch (e) {
      console.error('Update lead error:', e);
      toast.error('Network error updating lead');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQualify = () =>
    updateLeadStatus('qualified', 'Lead marked as qualified', 'lead_qualified');

  const handleMarkLost = () =>
    updateLeadStatus('lost', 'Lead marked as lost', 'lead_lost');

  const handleStatusDropdown = (newStatus: string) => {
    if (newStatus === selectedLead?.status) return;
    updateLeadStatus(newStatus, `Status changed to ${newStatus.replace(/_/g, ' ')}`);
  };

  // ---- Send outreach email ----
  const handleSendEmail = async () => {
    if (!selectedLead || !token) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Subject and body are required');
      return;
    }
    if (!selectedLead.email) {
      toast.error('This lead has no email address on file');
      return;
    }
    setActionLoading('email');
    try {
      const res = await fetch('/api/communications/send', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          channel: 'email',
          to: selectedLead.email,
          subject: emailSubject,
          body: emailBody,
          category: 'outreach',
          recipientName: `${selectedLead.first_name} ${selectedLead.last_name}`.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Outreach email sent to lead');
        clientTrack('lead_contacted', { leadId: selectedLead.id, channel: 'email' });
        setShowEmailForm(false);
        setEmailSubject('');
        setEmailBody('');
        // Update lead status to 'contacted' (best-effort, don't block on failure)
        await fetch(`/api/leads/${selectedLead.id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify({ status: 'contacted' }),
        });
        await openDetail(selectedLead.id);
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to send email');
      }
    } catch (e) {
      console.error('Send email error:', e);
      toast.error('Network error sending email');
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Convert lead to client ----
  const handleConvert = async () => {
    if (!selectedLead || !token) return;
    setActionLoading('convert');
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ create_case: true }),
      });
      const data = await res.json();
      if (data.success) {
        const clientEmail = data.data?.client?.email || '';
        const caseRef = data.data?.case?.case_ref || '';
        toast.success(
          `Lead converted to client${caseRef ? ` — case ${caseRef} created` : ''}. Welcome email sent to ${clientEmail}.`,
          { duration: 6000 }
        );
        clientTrack('lead_converted', {
          leadId: selectedLead.id,
          clientId: data.data?.client?.id,
          caseId: data.data?.case?.id,
          caseRef,
        });
        setDrawerOpen(false);
        onRefresh();
      } else if (data.alreadyConverted) {
        toast.info('This lead was already converted');
        setDrawerOpen(false);
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to convert lead');
      }
    } catch (e) {
      console.error('Convert lead error:', e);
      toast.error('Network error converting lead');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const leadName = (l: any) =>
    [l.first_name, l.last_name].filter(Boolean).join(' ').trim() ||
    l.name || 'Unknown Lead';

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ---- Header ---- */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="border-l-2 border-[#c9a84c] pl-4">
              <h2 className="text-xl font-bold text-[#0c1e3c]">Leads Pipeline</h2>
              <p className="text-sm text-slate-500">{total} total leads</p>
            </div>
            <Badge className="bg-[#0c1e3c] text-white text-[10px] font-semibold ml-2 hover:bg-[#0c1e3c]">{total}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              className="text-slate-500 hover:text-[#0c1e3c]"
              aria-label="Refresh leads"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {isStaff && (
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="btn-gold px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Lead
              </Button>
            )}
          </div>
        </div>

        {/* ---- Pipeline Count Bar ---- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          {PIPELINE_STATUSES.map((status) => {
            const count = leads.filter((l) => l.status === status).length;
            return (
              <div
                key={status}
                className={`text-center p-2.5 rounded-lg bg-white border border-slate-100 border-t-2 ${pipelineTopColors[status] || 'border-t-slate-300'}`}
              >
                <div className="text-lg font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{count}</div>
                <div className="text-[10px] text-slate-500 capitalize">{status.replace(/_/g, ' ')}</div>
              </div>
            );
          })}
        </div>

        {/* ---- Loading skeleton ---- */}
        {loading && leads.length === 0 ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-2 w-2/3" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          /* ---- Empty state ---- */
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Target className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">No leads found</p>
            <p className="text-[11px] text-slate-300 mt-1">
              {isStaff ? 'Add a new lead to start tracking your pipeline' : 'Check back soon for new leads'}
            </p>
          </div>
        ) : (
          /* ---- Lead list (single column of clickable cards — works on mobile + desktop) ---- */
          <div className="space-y-3 stagger-children">
            {leads.map((l) => {
              const leadScore = l.lead_score || 0;
              const name = leadName(l);
              const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openDetail(l.id)}
                  className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-[#c9a84c]/40 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30"
                  style={{ borderLeft: `3px solid ${statusBorderColor[l.status] || '#94a3b8'}` }}
                  aria-label={`View lead details for ${name}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0c1e3c]/5 text-[#0c1e3c] text-xs font-bold flex items-center justify-center">
                    {initials || '??'}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0c1e3c] text-sm truncate">{name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border capitalize ${statusBadgeClass(l.status)}`}>
                        {(l.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 min-w-0">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{l.email}</span>
                        </span>
                      )}
                      {l.case_type && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {l.case_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {l.estimated_value ? (
                        <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
                          <span className="text-[#c9a84c] font-semibold">{formatCurrency(l.estimated_value)}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {/* Score */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${scoreColorClass(leadScore)}`}>
                    <span className="text-sm font-bold">{leadScore}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="hover-lift"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? 'default' : 'outline'}
                  onClick={() => onPageChange(p)}
                  className={p === page ? 'btn-navy' : 'hover-lift'}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="hover-lift"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CREATE LEAD DIALOG                           */}
      {/* ============================================ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0c1e3c] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#c9a84c]" />
              Create New Lead
            </DialogTitle>
            <DialogDescription>
              Add a new prospect to your pipeline. They will be saved with status <span className="font-medium">submitted</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lead-first" className="text-xs text-[#0c1e3c]">First name <span className="text-red-500">*</span></Label>
                <Input
                  id="lead-first"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Thabo"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-last" className="text-xs text-[#0c1e3c]">Last name <span className="text-red-500">*</span></Label>
                <Input
                  id="lead-last"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Molefe"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-email" className="text-xs text-[#0c1e3c]">Email <span className="text-red-500">*</span></Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="thabo@example.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-phone" className="text-xs text-[#0c1e3c]">Phone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="068 123 4567"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#0c1e3c]">Case type</Label>
                <Select
                  value={form.case_type}
                  onValueChange={(v) => setForm({ ...form, case_type: v })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_CASE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#0c1e3c]">Urgency</Label>
                <Select
                  value={form.urgency}
                  onValueChange={(v) => setForm({ ...form, urgency: v })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'critical'].map((u) => (
                      <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-value" className="text-xs text-[#0c1e3c]">Estimated value (ZAR)</Label>
              <Input
                id="lead-value"
                type="number"
                value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
                placeholder="50000"
                className="h-9"
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-desc" className="text-xs text-[#0c1e3c]">Description</Label>
              <Textarea
                id="lead-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe the prospect's legal matter..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              disabled={creating}
              className="btn-gold"
            >
              {creating ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4 mr-1.5" /> Create Lead</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* LEAD DETAIL DRAWER (Sheet)                   */}
      {/* ============================================ */}
      <Sheet open={drawerOpen} onOpenChange={(open) => {
        setDrawerOpen(open);
        if (!open) {
          setSelectedLead(null);
          setShowEmailForm(false);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <SheetTitle className="text-[#0c1e3c] text-base flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-[#c9a84c]" />
              Lead Detail
            </SheetTitle>
            <SheetDescription className="sr-only">
              View lead information and perform outreach actions
            </SheetDescription>
          </SheetHeader>

          {/* ---- Drawer body ---- */}
          <div className="px-5 py-4 space-y-5">
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : selectedLead ? (
              <LeadDetailBody
                lead={selectedLead}
                isStaff={isStaff}
                actionLoading={actionLoading}
                showEmailForm={showEmailForm}
                emailSubject={emailSubject}
                emailBody={emailBody}
                onEmailSubjectChange={setEmailSubject}
                onEmailBodyChange={setEmailBody}
                onToggleEmailForm={() => setShowEmailForm(!showEmailForm)}
                onSendEmail={handleSendEmail}
                onQualify={handleQualify}
                onConvert={handleConvert}
                onMarkLost={handleMarkLost}
                onStatusChange={handleStatusDropdown}
              />
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Lead not available.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================
// LEAD DETAIL BODY (in the Sheet drawer)
// ============================================

interface LeadDetailBodyProps {
  lead: LeadDetail;
  isStaff: boolean;
  actionLoading: string | null;
  showEmailForm: boolean;
  emailSubject: string;
  emailBody: string;
  onEmailSubjectChange: (v: string) => void;
  onEmailBodyChange: (v: string) => void;
  onToggleEmailForm: () => void;
  onSendEmail: () => void;
  onQualify: () => void;
  onConvert: () => void;
  onMarkLost: () => void;
  onStatusChange: (status: string) => void;
}

function LeadDetailBody({
  lead, isStaff, actionLoading, showEmailForm, emailSubject, emailBody,
  onEmailSubjectChange, onEmailBodyChange, onToggleEmailForm,
  onSendEmail, onQualify, onConvert, onMarkLost, onStatusChange,
}: LeadDetailBodyProps) {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'Unknown Lead';
  const initials = fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {/* ---- Header: avatar + name + status ---- */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#0c1e3c]/5 text-[#0c1e3c] font-bold flex items-center justify-center">
          {initials || '??'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#0c1e3c] truncate">{fullName}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadgeClass(lead.status)}`}>
              {(lead.status || '').replace(/_/g, ' ')}
            </span>
            {lead.urgency && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {lead.urgency} urgency
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- Contact details ---- */}
      <div className="space-y-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100">
        {lead.email && (
          <div className="flex items-center gap-2 text-xs">
            <Mail className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
            <a href={`mailto:${lead.email}`} className="text-[#0c1e3c] hover:underline truncate">{lead.email}</a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
            <span className="text-[#0c1e3c]">{lead.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
          <span className="text-slate-600 capitalize">Source: {lead.source?.replace(/_/g, ' ') || 'website'}</span>
        </div>
        {lead.reviewer && (
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
            <span className="text-slate-600">Reviewed by {lead.reviewer.full_name || lead.reviewer.email}</span>
          </div>
        )}
      </div>

      {/* ---- Case info ---- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Case Type</p>
          <p className="text-sm text-[#0c1e3c] font-medium capitalize">{lead.case_type?.replace(/_/g, ' ') || '—'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Estimated Value</p>
          <p className="text-sm text-[#c9a84c] font-bold">{formatCurrency(lead.estimated_value)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Lead Score</p>
          <p className="text-sm text-[#0c1e3c] font-medium">
            {lead.lead_score !== null ? `${lead.lead_score}/100` : '—'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Submitted</p>
          <p className="text-sm text-[#0c1e3c] font-medium">{formatDate(lead.submitted_at || lead.created_at)}</p>
        </div>
      </div>

      {/* ---- Description ---- */}
      {lead.description && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Matter Description
          </p>
          <div className="text-xs text-slate-700 bg-white border border-slate-100 rounded-lg p-3 leading-relaxed max-h-40 overflow-y-auto">
            {lead.description}
          </div>
        </div>
      )}

      {/* ---- AI summary ---- */}
      {lead.ai_summary && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Summary
          </p>
          <div className="text-xs text-slate-700 bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-lg p-3 leading-relaxed max-h-40 overflow-y-auto">
            {lead.ai_summary}
          </div>
        </div>
      )}

      {/* ---- Notes ---- */}
      {lead.notes && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Internal Notes</p>
          <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 leading-relaxed">
            {lead.notes}
          </div>
        </div>
      )}

      {/* ---- Linked records ---- */}
      {lead.client && (
        <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-800">
            Converted to client: <span className="font-semibold">{lead.client.full_name || lead.client.email}</span>
          </span>
        </div>
      )}
      {lead.case && (
        <div className="text-xs bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span className="text-teal-800">
            Linked case: <span className="font-semibold">{lead.case.case_ref}</span>
          </span>
        </div>
      )}

      {/* ============================================ */}
      {/* STAFF ACTIONS                                */}
      {/* ============================================ */}
      {isStaff && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Outreach & Conversion</p>

          {/* Status dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#0c1e3c]">Change Status</Label>
            <Select
              value={lead.status}
              onValueChange={onStatusChange}
              disabled={actionLoading !== null}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Send Email */}
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleEmailForm}
              disabled={actionLoading !== null || !lead.email}
              className="h-9 border-[#0c1e3c]/20 text-[#0c1e3c] hover:bg-[#0c1e3c]/5"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Send Email
            </Button>

            {/* Qualify */}
            <Button
              size="sm"
              variant="outline"
              onClick={onQualify}
              disabled={actionLoading !== null || lead.status === 'qualified' || lead.status === 'retained'}
              className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {actionLoading === 'qualified' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
              Qualify
            </Button>

            {/* Mark Lost */}
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkLost}
              disabled={actionLoading !== null || lead.status === 'lost'}
              className="h-9 border-red-200 text-red-700 hover:bg-red-50"
            >
              {actionLoading === 'lost' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
              Mark Lost
            </Button>

            {/* Convert to Client */}
            <Button
              size="sm"
              onClick={onConvert}
              disabled={actionLoading !== null || lead.status === 'retained'}
              className="h-9 btn-gold"
            >
              {actionLoading === 'convert' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Convert
            </Button>
          </div>

          {/* Convert hint when not yet qualified/contacted */}
          {lead.status !== 'qualified' && lead.status !== 'contacted' && lead.status !== 'retained' && (
            <p className="text-[10px] text-slate-400 italic">
              Tip: contact or qualify the lead first, then convert to a client.
            </p>
          )}

          {/* ---- Inline email form ---- */}
          {showEmailForm && (
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#0c1e3c] font-semibold">Send Outreach Email</Label>
                <button
                  type="button"
                  onClick={onToggleEmailForm}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Close email form"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <Input
                placeholder="Subject line"
                value={emailSubject}
                onChange={(e) => onEmailSubjectChange(e.target.value)}
                className="h-8 bg-white text-xs"
              />
              <Textarea
                placeholder="Write your message to the lead..."
                value={emailBody}
                onChange={(e) => onEmailBodyChange(e.target.value)}
                rows={4}
                className="bg-white text-xs resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400">To: {lead.email}</p>
                <Button
                  size="sm"
                  onClick={onSendEmail}
                  disabled={actionLoading === 'email' || !emailSubject.trim() || !emailBody.trim()}
                  className="h-8 btn-gold text-xs"
                >
                  {actionLoading === 'email' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Timestamps ---- */}
      <div className="pt-3 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" /> Created {formatDate(lead.created_at)}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" /> Updated {formatDate(lead.updated_at)}
        </div>
      </div>
    </>
  );
}

export default LeadsView;
