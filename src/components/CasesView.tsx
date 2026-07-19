'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, ChevronLeft, ChevronRight, Plus, FileText, CheckCircle2,
  Clock, Scale, User as UserIcon, Mail, Gavel, Building2, MapPin, Calendar,
  Banknote, Briefcase, AlertTriangle, History, FolderKanban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';
import { clientTrack } from '@/lib/posthog-client';
import type { User, StaffMember } from '@/components/types';

// ---- Constants ----------------------------------------------------------
const VALID_CASE_TYPES = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Family' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'property', label: 'Property' },
  { value: 'labour', label: 'Labour' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'tax', label: 'Tax' },
  { value: 'personal_injury', label: 'Personal Injury' },
  { value: 'debt_recovery', label: 'Debt Recovery' },
  { value: 'other', label: 'Other' },
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CASE_STATUSES = [
  { value: 'intake', label: 'Intake' },
  { value: 'review', label: 'Review' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  intake: 'bg-blue-50 text-blue-700 border-blue-100',
  review: 'bg-amber-50 text-amber-700 border-amber-100',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  on_hold: 'bg-orange-50 text-orange-700 border-orange-100',
  closed: 'bg-slate-50 text-slate-700 border-slate-100',
  archived: 'bg-slate-50 text-slate-500 border-slate-100',
};

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-red-50 text-red-700 border-red-100',
};

const STAFF_ROLES = ['managing_director', 'systems_admin', 'admin', 'attorney', 'paralegal'];
const ATTORNEY_ROLES = ['attorney', 'associate', 'candidate_attorney'];

// ---- Types --------------------------------------------------------------
interface CaseRow {
  id: string;
  case_ref: string;
  case_number?: string | null;
  title: string;
  description?: string | null;
  case_type: string;
  urgency: string;
  status: string;
  client_id?: string;
  attorney_id?: string | null;
  opposing_party?: string | null;
  court_name?: string | null;
  jurisdiction?: string | null;
  estimated_value?: number | null;
  retainer_amount?: number | null;
  next_deadline?: string | null;
  notes?: string | null;
  tags?: unknown;
  is_high_risk?: boolean;
  created_at: string;
  client?: { id: string; full_name: string | null; email: string } | null;
  lead_attorney?: { id: string; full_name: string | null; email: string } | null;
}

interface CaseDocument {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  version: number;
  created_at: string;
}

interface CaseTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string | null;
}

interface CaseTimelineEvent {
  id: string;
  event_type: string;
  event_description?: string | null;
  created_at: string;
  performed_by?: string | null;
  is_system_event?: boolean;
}

interface CaseDetail extends CaseRow {
  documents?: CaseDocument[];
  tasks?: CaseTask[];
  timeline?: CaseTimelineEvent[];
  attorney?: { id: string; full_name: string | null; email: string; role?: string } | null;
}

interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface CreateFormState {
  title: string;
  case_type: string;
  client_id: string;
  urgency: string;
  description: string;
  estimated_value: string;
  opposing_party: string;
  court_name: string;
  jurisdiction: string;
  attorney_id: string;
}

const EMPTY_FORM: CreateFormState = {
  title: '',
  case_type: '',
  client_id: '',
  urgency: 'medium',
  description: '',
  estimated_value: '',
  opposing_party: '',
  court_name: '',
  jurisdiction: '',
  attorney_id: '',
};

// ---- Helpers ------------------------------------------------------------
function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `R ${Number(value).toLocaleString('en-ZA')}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function humanize(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ========================================================================
// MAIN CasesView
// ========================================================================
export function CasesView({
  cases, page, total, onPageChange, onRefresh, loading, token, user, staff,
}: {
  cases: CaseRow[];
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  loading?: boolean;
  token: string | null;
  user: User | null;
  staff: StaffMember[];
}) {
  const role = user?.role || 'client';
  const isStaff = STAFF_ROLES.includes(role);
  const isClient = role === 'client';
  const attorneys = staff.filter((s) => ATTORNEY_ROLES.includes(s.role) || s.role === 'attorney');

  const totalPages = Math.max(1, Math.ceil(total / 10));

  // ---- Create dialog state ----
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // ---- Detail drawer state ----
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ---- Fetch clients for the create-case selector (staff only) ----
  const loadClients = useCallback(async () => {
    if (!token || !isStaff) return;
    setLoadingClients(true);
    try {
      // Extract unique clients from existing cases. We use the case's
      // top-level `client_id` field (the actual Client profile PK required by
      // POST /api/cases), NOT `case.client.id` (which is the user.id — a known
      // API inconsistency). This is the most reliable way to populate a client
      // selector that will succeed at case-creation time.
      const res = await fetch('/api/cases?page=1&perPage=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: ClientOption[] = [];
      if (data.success && Array.isArray(data.data?.data)) {
        const seen = new Set<string>();
        for (const c of data.data.data as CaseRow[]) {
          if (!c.client_id || seen.has(c.client_id)) continue;
          seen.add(c.client_id);
          list.push({
            id: c.client_id,
            full_name: c.client?.full_name || null,
            email: c.client?.email || '(no email)',
          });
        }
      }
      list.sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
      setClients(list);
    } catch (e) {
      console.error('Client list load error:', e);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, [token, isStaff]);

  useEffect(() => {
    // Fetch on dialog open. setState calls happen after `await fetch`, never
    // synchronously in the effect body — canonical "fetch on open" pattern.
    if (showCreate && isStaff) loadClients();
  }, [showCreate, isStaff, loadClients]);

  // ---- Fetch case detail when drawer opens ----
  const loadCaseDetail = useCallback(async (caseId: string) => {
    if (!token) return;
    setLoadingDetail(true);
    setCaseDetail(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCaseDetail(data.data as CaseDetail);
      } else {
        toast.error(data.error || 'Failed to load case detail');
        setDetailOpen(false);
      }
    } catch (e) {
      console.error('Case detail load error:', e);
      toast.error('Network error loading case detail');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }, [token]);

  useEffect(() => {
    if (detailOpen && selectedCase) loadCaseDetail(selectedCase.id);
  }, [detailOpen, selectedCase, loadCaseDetail]);

  // ---- Handlers ----
  const openCaseDetail = (c: CaseRow) => {
    setSelectedCase(c);
    setCaseDetail(null);
    setActiveTab('overview');
    setDetailOpen(true);
  };

  const closeCaseDetail = () => {
    setDetailOpen(false);
    // Defer state reset until after the Sheet close animation
    setTimeout(() => {
      setSelectedCase(null);
      setCaseDetail(null);
    }, 300);
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!form.title.trim() || !form.case_type) {
      toast.error('Title and case type are required');
      return;
    }
    if (isStaff && !form.client_id) {
      toast.error('Please select a client');
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        case_type: form.case_type,
        urgency: form.urgency,
        description: form.description.trim() || undefined,
        opposing_party: form.opposing_party.trim() || undefined,
        court_name: form.court_name.trim() || undefined,
        jurisdiction: form.jurisdiction.trim() || undefined,
        attorney_id: form.attorney_id || undefined,
      };
      if (form.estimated_value) {
        const parsed = Number(form.estimated_value);
        if (!Number.isNaN(parsed)) body.estimated_value = parsed;
      }
      // For staff: send the selected client_id (resolved from /api/crm/users).
      // For client users: omit so the API auto-resolves their own profile.
      if (isStaff && form.client_id) body.client_id = form.client_id;

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const caseRef = data.data?.case_ref || 'New case';
        toast.success(`Case created: ${caseRef}`);
        clientTrack('case_created', {
          caseId: data.data?.id,
          caseRef,
          caseType: form.case_type,
        });
        setShowCreate(false);
        setForm(EMPTY_FORM);
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to create case');
      }
    } catch (e) {
      console.error('Create case error:', e);
      toast.error('Network error creating case');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !selectedCase || !caseDetail) return;
    if (newStatus === caseDetail.status) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${humanize(newStatus)}`);
        clientTrack('case_status_changed', {
          caseId: selectedCase.id,
          newStatus,
        });
        // Refresh the detail view + the list
        await loadCaseDetail(selectedCase.id);
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (e) {
      console.error('Status update error:', e);
      toast.error('Network error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const setField = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ---- Render ----
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Cases</h2>
          <p className="text-[13px] text-slate-500">{total} total cases</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          {isStaff && (
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px] h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Case
            </Button>
          )}
        </div>
      </div>

      {/* Cases table / cards */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading && cases.length === 0 ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3 p-3">
                {cases.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No cases found
                  </div>
                ) : (
                  cases.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCaseDetail(c)}
                      className="w-full text-left bg-white border rounded-lg p-3 space-y-2 hover:border-[#c9a84c] hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[#a88832] truncate">{c.case_ref}</span>
                        <Badge
                          className={`text-[9px] border shrink-0 ${STATUS_COLORS[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}
                        >
                          {humanize(c.status)}
                        </Badge>
                      </div>
                      <div className="font-medium text-[#0c1e3c] text-sm line-clamp-2">{c.title}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600">
                          {humanize(c.case_type)}
                        </Badge>
                        <span className="truncate">{c.client?.full_name || '—'}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {formatCurrency(c.estimated_value)}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b bg-[#0c1e3c]/[0.03]">
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Case Ref</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Title</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Type</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Status</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Client</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Value (ZAR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No cases found</td>
                      </tr>
                    ) : (
                      cases.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => openCaseDetail(c)}
                          className="border-b hover:bg-[#f7f8fa] transition-colors cursor-pointer"
                        >
                          <td className="p-2.5 font-mono text-[#a88832]">{c.case_ref}</td>
                          <td className="p-2.5 font-medium text-[#0c1e3c] max-w-xs truncate">{c.title}</td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600">
                              {humanize(c.case_type)}
                            </Badge>
                          </td>
                          <td className="p-2.5">
                            <Badge className={`text-[9px] border ${STATUS_COLORS[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                              {humanize(c.status)}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-slate-600">{c.client?.full_name || '—'}</td>
                          <td className="p-2.5 font-medium text-[#0c1e3c]">{formatCurrency(c.estimated_value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-slate-500">
            Page {page} of {totalPages} ({total} results)
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 w-7 p-0 border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
                  className={`h-7 w-7 p-0 text-[11px] ${p === page ? 'bg-[#0c1e3c] hover:bg-[#0c1e3c]' : 'border-slate-200 text-slate-600'}`}
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
              className="h-7 w-7 p-0 border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================ CREATE CASE DIALOG ============================ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0c1e3c]">Open New Case</DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500">
              Create a new case file. A unique case reference (INF-YYYYMM-XXXXX) is generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label className="text-[12px] text-[#0c1e3c]">Case Title <span className="text-red-500">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. Mthembu — Unlawful Eviction Defence"
                className="mt-1 text-[13px]"
              />
            </div>

            {/* Case Type + Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Case Type <span className="text-red-500">*</span></Label>
                <Select value={form.case_type} onValueChange={(v) => setField('case_type', v)}>
                  <SelectTrigger className="mt-1 text-[12px] w-full">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_CASE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => setField('urgency', v)}>
                  <SelectTrigger className="mt-1 text-[12px] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client (staff only) */}
            {isStaff && (
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Client <span className="text-red-500">*</span></Label>
                {loadingClients ? (
                  <div className="mt-1 space-y-1.5">
                    <Skeleton className="h-8 w-full bg-slate-100" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="mt-1 p-2.5 border border-amber-200 bg-amber-50/50 rounded-md text-[11px] text-amber-800">
                    No clients yet — convert a lead first (use the Leads view to convert an intake submission into a client).
                  </div>
                ) : (
                  <Select value={form.client_id} onValueChange={(v) => setField('client_id', v)}>
                    <SelectTrigger className="mt-1 text-[12px] w-full">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name || c.email} ({c.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <Label className="text-[12px] text-[#0c1e3c]">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Brief description of the matter…"
                rows={3}
                className="mt-1 text-[13px]"
              />
            </div>

            {/* Estimated Value + Opposing Party */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Estimated Value (ZAR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.estimated_value}
                  onChange={(e) => setField('estimated_value', e.target.value)}
                  placeholder="0.00"
                  className="mt-1 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Opposing Party</Label>
                <Input
                  value={form.opposing_party}
                  onChange={(e) => setField('opposing_party', e.target.value)}
                  placeholder="e.g. ABC Pty Ltd"
                  className="mt-1 text-[13px]"
                />
              </div>
            </div>

            {/* Court + Jurisdiction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Court Name</Label>
                <Input
                  value={form.court_name}
                  onChange={(e) => setField('court_name', e.target.value)}
                  placeholder="e.g. Johannesburg High Court"
                  className="mt-1 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Jurisdiction</Label>
                <Input
                  value={form.jurisdiction}
                  onChange={(e) => setField('jurisdiction', e.target.value)}
                  placeholder="e.g. Gauteng"
                  className="mt-1 text-[13px]"
                />
              </div>
            </div>

            {/* Attorney assignment (staff only) */}
            {isStaff && attorneys.length > 0 && (
              <div>
                <Label className="text-[12px] text-[#0c1e3c]">Assign Legal Advisor (optional)</Label>
                <Select
                  value={form.attorney_id}
                  onValueChange={(v) => setField('attorney_id', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger className="mt-1 text-[12px] w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {attorneys.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name || a.email} ({humanize(a.role)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-[12px]">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.title.trim() || !form.case_type || (isStaff && !form.client_id)}
              className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px]"
            >
              {creating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
              ) : (
                <FolderKanban className="w-3.5 h-3.5 mr-2" />
              )}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================ CASE DETAIL SHEET ============================ */}
      <Sheet open={detailOpen} onOpenChange={(open) => { if (!open) closeCaseDetail(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="p-5 pb-3 border-b border-slate-100 bg-gradient-to-br from-[#0c1e3c] to-[#1a3a65] text-white">
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="space-y-1 min-w-0">
                <SheetTitle className="text-white text-base leading-snug">
                  {selectedCase?.title || 'Case detail'}
                </SheetTitle>
                <SheetDescription className="text-[#c9a84c] font-mono text-[12px] tracking-wide">
                  {selectedCase?.case_ref || ''}
                </SheetDescription>
              </div>
              <Badge
                className={`text-[10px] border shrink-0 ${STATUS_COLORS[selectedCase?.status || ''] || 'bg-slate-50 text-slate-700 border-slate-100'}`}
              >
                {humanize(selectedCase?.status)}
              </Badge>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loadingDetail || !caseDetail ? (
              <DetailSkeleton />
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col gap-0"
              >
                <div className="px-4 pt-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <TabsList className="bg-slate-100 h-9 w-full flex overflow-x-auto">
                    <TabsTrigger value="overview" className="flex-1 text-[12px]">Overview</TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1 text-[12px]">
                      Documents ({caseDetail.documents?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex-1 text-[12px]">
                      Tasks ({caseDetail.tasks?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex-1 text-[12px]">
                      Timeline ({caseDetail.timeline?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* ===== OVERVIEW ===== */}
                <TabsContent value="overview" className="p-5 space-y-5 m-0">
                  {/* Staff actions */}
                  {isStaff && (
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-[#0c1e3c]/[0.03] border border-[#0c1e3c]/10 rounded-lg p-3">
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label className="text-[11px] text-[#0c1e3c] uppercase tracking-wider whitespace-nowrap">
                          Change Status
                        </Label>
                        <Select
                          value={caseDetail.status}
                          onValueChange={handleStatusChange}
                          disabled={statusUpdating}
                        >
                          <SelectTrigger className="text-[12px] h-8 w-full sm:w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CASE_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[11px] h-8"
                              >
                                <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule Consultation
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Schedule from the Consultations view
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Case info grid */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Case Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <InfoCell icon={Scale} label="Type" value={humanize(caseDetail.case_type)} />
                      <InfoCell
                        icon={AlertTriangle}
                        label="Urgency"
                        value={
                          <Badge className={`text-[9px] border ${URGENCY_COLORS[caseDetail.urgency] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {humanize(caseDetail.urgency)}
                          </Badge>
                        }
                      />
                      <InfoCell icon={Banknote} label="Est. Value" value={formatCurrency(caseDetail.estimated_value)} />
                      <InfoCell icon={Briefcase} label="Retainer" value={formatCurrency(caseDetail.retainer_amount)} />
                      <InfoCell icon={UserIcon} label="Opposing Party" value={caseDetail.opposing_party || '—'} />
                      <InfoCell icon={Building2} label="Court" value={caseDetail.court_name || '—'} />
                      <InfoCell icon={MapPin} label="Jurisdiction" value={caseDetail.jurisdiction || '—'} />
                      <InfoCell icon={Clock} label="Next Deadline" value={formatDate(caseDetail.next_deadline)} />
                      <InfoCell icon={Calendar} label="Opened" value={formatDate(caseDetail.created_at)} />
                      {caseDetail.is_high_risk && (
                        <InfoCell
                          icon={AlertTriangle}
                          label="Risk"
                          value={<span className="text-red-700 font-semibold">High Risk</span>}
                        />
                      )}
                    </div>
                  </div>

                  {/* Client + Attorney */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-100 rounded-lg p-3">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Client</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#c9a84c]/20 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3.5 h-3.5 text-[#a88832]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-[#0c1e3c] truncate">
                            {caseDetail.client?.full_name || 'Unknown'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {caseDetail.client?.email || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-100 rounded-lg p-3">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Lead Advisor</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0c1e3c]/10 flex items-center justify-center shrink-0">
                          <Gavel className="w-3.5 h-3.5 text-[#0c1e3c]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-[#0c1e3c] truncate">
                            {caseDetail.lead_attorney?.full_name || caseDetail.attorney?.full_name || 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {caseDetail.lead_attorney?.email || caseDetail.attorney?.email || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {caseDetail.description && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
                      <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {caseDetail.description}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {caseDetail.notes && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Internal Notes</h3>
                      <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed bg-amber-50/50 border-l-2 border-[#c9a84c] p-3 rounded-r-md">
                        {caseDetail.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* ===== DOCUMENTS ===== */}
                <TabsContent value="documents" className="p-5 m-0">
                  {(!caseDetail.documents || caseDetail.documents.length === 0) ? (
                    <EmptyState
                      icon={FileText}
                      title="No documents"
                      hint="Upload case documents from the Documents view."
                    />
                  ) : (
                    <ul className="space-y-2">
                      {caseDetail.documents.map((d) => (
                        <li key={d.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition">
                          <div className="w-8 h-8 rounded-md bg-[#0c1e3c]/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#0c1e3c]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-[#0c1e3c] truncate">{d.file_name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-500">
                              <span>{humanize(d.document_type)}</span>
                              <span>•</span>
                              <span>v{d.version}</span>
                              <span>•</span>
                              <span>{formatDate(d.created_at)}</span>
                            </div>
                          </div>
                          <Badge className={`text-[9px] border shrink-0 ${STATUS_COLORS[d.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {humanize(d.status)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                {/* ===== TASKS ===== */}
                <TabsContent value="tasks" className="p-5 m-0">
                  {(!caseDetail.tasks || caseDetail.tasks.length === 0) ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No tasks"
                      hint="Create tasks for this case from the Tasks view."
                    />
                  ) : (
                    <ul className="space-y-2">
                      {caseDetail.tasks.map((t) => (
                        <li key={t.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition">
                          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-[#0c1e3c] truncate">{t.title}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-500">
                              <span>Priority: {humanize(t.priority)}</span>
                              <span>•</span>
                              <span>Due: {formatDate(t.due_date)}</span>
                            </div>
                          </div>
                          <Badge className={`text-[9px] border shrink-0 ${STATUS_COLORS[t.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {humanize(t.status)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                {/* ===== TIMELINE ===== */}
                <TabsContent value="timeline" className="p-5 m-0">
                  {(!caseDetail.timeline || caseDetail.timeline.length === 0) ? (
                    <EmptyState
                      icon={History}
                      title="No timeline events"
                      hint="Activity will be recorded here as the case progresses."
                    />
                  ) : (
                    <ol className="relative border-l border-slate-200 ml-2 space-y-3">
                      {caseDetail.timeline.map((ev) => (
                        <li key={ev.id} className="pl-4">
                          <span className="absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full bg-[#c9a84c] border border-white" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600">
                              {humanize(ev.event_type)}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{formatDateTime(ev.created_at)}</span>
                          </div>
                          {ev.event_description && (
                            <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">
                              {ev.event_description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---- Sub-components -----------------------------------------------------
function InfoCell({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-[12px] text-[#0c1e3c] font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon, title, hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-[13px] font-medium text-[#0c1e3c]">{title}</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-xs">{hint}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-9 w-full bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 bg-slate-100" />
        <Skeleton className="h-16 bg-slate-100" />
      </div>
      <Skeleton className="h-24 bg-slate-100" />
      <Skeleton className="h-16 bg-slate-100" />
    </div>
  );
}
