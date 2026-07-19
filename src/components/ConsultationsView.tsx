'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Plus, BookOpen, MapPin, Video, PhoneCall,
  Calendar, Clock, Link2, FileText, User as UserIcon, Mail, Phone as PhoneIcon,
  CheckCircle2, AlertCircle, ChevronRight, StickyNote, CalendarClock, Ban,
  ExternalLink, Briefcase, ChevronRight as Chevron,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { User, Consultation, StaffMember } from '@/components/types';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { clientTrack } from '@/lib/posthog-client';

// ============================================
// CONSTANTS
// ============================================
const STAFF_ROLES = ['managing_director', 'systems_admin', 'admin', 'attorney', 'paralegal'];

const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  in_progress: 'bg-purple-50 text-purple-700 border-purple-100',
  completed: 'bg-slate-50 text-slate-700 border-slate-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show: 'bg-orange-50 text-orange-700 border-orange-100',
};

const meetingIcons: Record<string, any> = {
  in_person: MapPin,
  video_call: Video,
  phone_call: PhoneCall,
};
const meetingIconBg: Record<string, string> = {
  in_person: 'bg-emerald-50 text-emerald-600',
  video_call: 'bg-blue-50 text-blue-600',
  phone_call: 'bg-purple-50 text-purple-600',
};
const MEETING_LABELS: Record<string, string> = {
  in_person: 'In Person',
  video_call: 'Video Call',
  phone_call: 'Phone Call',
};

// ============================================
// TYPES
// ============================================
interface ConsultationDetail {
  id: string;
  client_id: string;
  attorney_id: string;
  case_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_type: string | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  follow_up_required: boolean;
  fee: number | null;
  created_at: string;
  updated_at?: string;
  client: { id: string; full_name: string | null; email: string; phone?: string | null };
  attorney: { id: string; full_name: string | null; email: string; role?: string };
  case: { id: string; case_ref: string; title: string; status?: string } | null;
}

interface ClientOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface CaseOption {
  id: string;
  case_ref: string;
  title: string;
  client_name?: string | null;
}

// ============================================
// HELPERS
// ============================================
function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-ZA')} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDateTimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return '—';
  return `R ${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayName(name: string | null | undefined, fallback = 'Unnamed'): string {
  if (!name || !name.trim()) return fallback;
  return name;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ConsultationsView({ token, consultations, onRefresh, user, staff, loading }: {
  token: string | null; consultations: Consultation[]; onRefresh: () => void; user: User | null; staff: StaffMember[]; loading?: boolean;
}) {
  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_id: '', attorney_id: '', case_id: '',
    scheduled_at: '', duration_minutes: 60,
    meeting_type: 'in_person', notes: '',
  });

  // Create dialog: client/case selectors
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectorsLoading, setSelectorsLoading] = useState(false);

  // Detail drawer state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // actionLoading: null | 'status' | 'reschedule' | 'cancel' | 'notes'
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Inline editing state within drawer
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const attorneys = staff.filter(s => s.role === 'attorney');
  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  // ---------------------------------------------------------
  // Load clients + cases when the create dialog opens
  // ---------------------------------------------------------
  useEffect(() => {
    if (!showCreate || !token) return;
    let cancelled = false;

    (async () => {
      setSelectorsLoading(true);
      try {
        let clientList: ClientOption[] = [];

        // 1) Try /api/crm/users?role=client (admin / managing_director / systems_admin only)
        try {
          const crmRes = await fetch('/api/crm/users?role=client', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (crmRes.ok) {
            const crmJson = await crmRes.json();
            const arr = (crmJson.data || []) as any[];
            clientList = arr.map((u) => ({
              id: u.id,
              full_name: u.full_name,
              email: u.email,
            }));
          }
        } catch {
          /* ignore — will fall back to /api/cases */
        }

        // 2) Fetch cases — used for the optional case selector AND as a client fallback
        let caseList: CaseOption[] = [];
        try {
          const casesRes = await fetch('/api/cases?perPage=100', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (casesRes.ok) {
            const casesJson = await casesRes.json();
            // /api/cases wraps as { success, data: { data: [...], pagination } }
            const arr = (casesJson.data?.data || casesJson.data || []) as any[];
            caseList = arr.map((c) => ({
              id: c.id,
              case_ref: c.case_ref,
              title: c.title,
              client_name: c.client?.full_name || null,
            }));

            // Fallback: extract unique clients from cases when /api/crm/users was forbidden
            if (clientList.length === 0) {
              const map = new Map<string, ClientOption>();
              for (const c of arr) {
                if (c.client && c.client.id && !map.has(c.client.id)) {
                  map.set(c.client.id, {
                    id: c.client.id,
                    full_name: c.client.full_name,
                    email: c.client.email,
                  });
                }
              }
              clientList = Array.from(map.values());
            }
          }
        } catch {
          /* ignore */
        }

        if (!cancelled) {
          setClients(clientList);
          setCases(caseList);
        }
      } finally {
        if (!cancelled) setSelectorsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [showCreate, token]);

  // ---------------------------------------------------------
  // Fetch full detail when a row is opened
  // ---------------------------------------------------------
  useEffect(() => {
    if (!selectedId || !token) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);

    (async () => {
      try {
        const res = await fetch(`/api/consultations/${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setDetail(json.data as ConsultationDetail);
        } else {
          toast.error(json.error?.message || 'Failed to load consultation');
          setSelectedId(null);
        }
      } catch (e) {
        console.error('Load consultation detail error:', e);
        if (!cancelled) {
          toast.error('Failed to load consultation');
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedId, token]);

  // Reset inline editors whenever the drawer closes
  useEffect(() => {
    if (!selectedId) {
      setShowReschedule(false);
      setShowNotesEditor(false);
      setRescheduleValue('');
      setNotesDraft('');
      setShowCancelConfirm(false);
    }
  }, [selectedId]);

  // ---------------------------------------------------------
  // Actions
  // ---------------------------------------------------------
  const handleCreate = async () => {
    if (!token) return;
    if (isStaff && !form.client_id) {
      toast.error('Please select a client');
      return;
    }
    if (!form.scheduled_at) {
      toast.error('Please pick a date and time');
      return;
    }
    if (isStaff && !form.attorney_id) {
      toast.error('Please select a legal advisor');
      return;
    }

    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        scheduled_at: form.scheduled_at,
        duration_minutes: form.duration_minutes,
        meeting_type: form.meeting_type,
      };
      if (form.notes) payload.notes = form.notes;
      if (form.case_id) payload.case_id = form.case_id;

      if (isStaff) {
        payload.client_id = form.client_id;
        payload.attorney_id = form.attorney_id;
      } else {
        // Client booking for themselves — API auto-resolves the client_id
        if (form.attorney_id) payload.attorney_id = form.attorney_id;
      }

      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Consultation scheduled');
        clientTrack('consultation_scheduled', {
          consultationId: data.data?.id,
          clientId: isStaff ? form.client_id : (user?.id || null),
        });
        setShowCreate(false);
        setForm({
          client_id: '', attorney_id: '', case_id: '',
          scheduled_at: '', duration_minutes: 60,
          meeting_type: 'in_person', notes: '',
        });
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to schedule consultation');
      }
    } catch (e) {
      console.error('Create consultation error:', e);
      toast.error('Failed to schedule consultation');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId || !token || !detail) return;
    if (!VALID_STATUSES.includes(newStatus)) return;
    if (newStatus === detail.status) return;
    setActionLoading('status');
    try {
      const res = await fetch(`/api/consultations/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Status updated');
        clientTrack('consultation_status_changed', { consultationId: selectedId, newStatus });
        setDetail(json.data as ConsultationDetail);
        onRefresh();
      } else {
        toast.error(json.error?.message || 'Failed to update status');
      }
    } catch (e) {
      console.error('Status change error:', e);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!selectedId || !token) return;
    if (!rescheduleValue) {
      toast.error('Pick a new date and time');
      return;
    }
    setActionLoading('reschedule');
    try {
      const res = await fetch(`/api/consultations/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduled_at: rescheduleValue }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Rescheduled');
        clientTrack('consultation_rescheduled', { consultationId: selectedId });
        setDetail(json.data as ConsultationDetail);
        setShowReschedule(false);
        setRescheduleValue('');
        onRefresh();
      } else {
        toast.error(json.error?.message || 'Failed to reschedule');
      }
    } catch (e) {
      console.error('Reschedule error:', e);
      toast.error('Failed to reschedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedId || !token) return;
    setActionLoading('notes');
    try {
      const res = await fetch(`/api/consultations/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notesDraft }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Notes saved');
        clientTrack('consultation_notes_saved', { consultationId: selectedId });
        setDetail(json.data as ConsultationDetail);
        setShowNotesEditor(false);
        onRefresh();
      } else {
        toast.error(json.error?.message || 'Failed to save notes');
      }
    } catch (e) {
      console.error('Save notes error:', e);
      toast.error('Failed to save notes');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedId || !token) return;
    setActionLoading('cancel');
    try {
      const res = await fetch(`/api/consultations/${selectedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Consultation cancelled');
        clientTrack('consultation_cancelled', { consultationId: selectedId });
        setShowCancelConfirm(false);
        setSelectedId(null);
        onRefresh();
      } else {
        toast.error(json.error?.message || 'Failed to cancel');
      }
    } catch (e) {
      console.error('Cancel consultation error:', e);
      toast.error('Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  const openConsultation = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleRowKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openConsultation(id);
    }
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Consultations</h2>
          <p className="text-[13px] text-slate-500">{consultations.length} consultations logged</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px] h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Log Consultation</DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500">
                  Schedule or log a client consultation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client selector (staff only) — replaces raw UUID input */}
                {isStaff ? (
                  <div>
                    <Label className="text-[12px]">Client</Label>
                    <Select
                      value={form.client_id}
                      onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
                    >
                      <SelectTrigger className="mt-1 text-[12px]">
                        <SelectValue
                          placeholder={selectorsLoading ? 'Loading clients…' : 'Select a client'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 && !selectorsLoading ? (
                          <div className="px-2 py-3 text-[11px] text-slate-500">
                            No clients found. You may need a client record first.
                          </div>
                        ) : (
                          clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {displayName(c.full_name, c.email)} ({c.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-md p-2.5">
                    Booking this consultation for yourself
                    {user?.full_name ? ` — ${user.full_name}` : ''}.
                  </div>
                )}

                {/* Optional case selector */}
                <div>
                  <Label className="text-[12px]">Linked Case (optional)</Label>
                  <Select
                    value={form.case_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, case_id: v }))}
                  >
                    <SelectTrigger className="mt-1 text-[12px]">
                      <SelectValue
                        placeholder={selectorsLoading ? 'Loading cases…' : 'No linked case'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.length === 0 && !selectorsLoading ? (
                        <div className="px-2 py-3 text-[11px] text-slate-500">
                          No cases available.
                        </div>
                      ) : (
                        cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.case_ref} — {c.title}
                            {c.client_name ? ` (${c.client_name})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Legal Advisor</Label>
                    <Select
                      value={form.attorney_id}
                      onValueChange={(v) => setForm((f) => ({ ...f, attorney_id: v }))}
                    >
                      <SelectTrigger className="mt-1 text-[12px]">
                        <SelectValue placeholder="Select legal advisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {attorneys.length === 0 ? (
                          <div className="px-2 py-3 text-[11px] text-slate-500">
                            No attorneys available.
                          </div>
                        ) : (
                          attorneys.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {displayName(a.full_name, a.email)} ({a.role.replace(/_/g, ' ')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Meeting Type</Label>
                    <Select
                      value={form.meeting_type}
                      onValueChange={(v) => setForm((f) => ({ ...f, meeting_type: v }))}
                    >
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="phone_call">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                      className="mt-1 text-[12px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[12px]">Duration (min)</Label>
                    <Select
                      value={String(form.duration_minutes)}
                      onValueChange={(v) => setForm((f) => ({ ...f, duration_minutes: parseInt(v) }))}
                    >
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-[12px]">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Consultation notes…"
                    className="mt-1 text-[13px]"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="text-[12px]">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={creating || (isStaff && !form.client_id) || !form.scheduled_at || (isStaff && !form.attorney_id)}
                  className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px]"
                >
                  {creating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 mr-2" />
                  )}
                  Log Consultation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading && consultations.length === 0 ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3 p-3">
                {consultations.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No consultations logged yet</div>
                ) : (
                  consultations.map((c) => {
                    const IconComp = meetingIcons[c.meeting_type] || MapPin;
                    const iconStyle = meetingIconBg[c.meeting_type] || 'bg-slate-50 text-slate-600';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openConsultation(c.id)}
                        className="w-full text-left bg-white border rounded-lg p-3 space-y-2 hover:border-[#c9a84c] hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconStyle}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-[#0c1e3c] text-sm">
                              {displayName(c.client?.full_name, 'Client')}
                            </span>
                          </div>
                          <Badge className={`text-[9px] border ${statusColors[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.attorney?.profile?.full_name || c.attorney?.full_name || 'Legal Advisor'}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{formatDateTime(c.scheduled_at)}</span>
                          <span>{c.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center justify-end text-[10px] text-[#a88832]">
                          View details <ChevronRight className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b bg-[#0c1e3c]/[0.03]">
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Type</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Client</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Legal Advisor</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Date & Time</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Duration</th>
                      <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Status</th>
                      <th className="w-8 p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-slate-500">No consultations logged yet</td></tr>
                    ) : (
                      consultations.map((c) => {
                        const IconComp = meetingIcons[c.meeting_type] || MapPin;
                        const iconStyle = meetingIconBg[c.meeting_type] || 'bg-slate-50 text-slate-600';
                        return (
                          <tr
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openConsultation(c.id)}
                            onKeyDown={(e) => handleRowKey(e, c.id)}
                            className="border-b hover:bg-[#f7f8fa] transition-colors cursor-pointer focus:outline-none focus:bg-[#f7f8fa]"
                          >
                            <td className="p-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconStyle}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                            </td>
                            <td className="p-2.5 font-medium text-[#0c1e3c]">
                              {displayName(c.client?.full_name, 'Client')}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {c.attorney?.profile?.full_name || c.attorney?.full_name || '—'}
                            </td>
                            <td className="p-2.5 text-slate-600">{formatDateTime(c.scheduled_at)}</td>
                            <td className="p-2.5 text-slate-600">{c.duration_minutes} min</td>
                            <td className="p-2.5">
                              <Badge className={`text-[9px] border ${statusColors[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                {STATUS_LABELS[c.status] || c.status}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-slate-400">
                              <Chevron className="w-3.5 h-3.5" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================
          DETAIL DRAWER
          ============================================ */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <SheetDescription className="sr-only">Consultation details and actions</SheetDescription>
            {detailLoading || !detail ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-slate-100" />
                <Skeleton className="h-4 w-28 bg-slate-100" />
              </div>
            ) : (
              <div className="space-y-2">
                <SheetTitle className="text-[#0c1e3c] text-lg flex items-center gap-2">
                  {(() => {
                    const IconComp = meetingIcons[detail.meeting_type || ''] || MapPin;
                    const iconStyle = meetingIconBg[detail.meeting_type || ''] || 'bg-slate-50 text-slate-600';
                    return (
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconStyle}`}>
                        <IconComp className="w-4 h-4" />
                      </span>
                    );
                  })()}
                  {displayName(detail.client?.full_name, 'Client')}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] border ${statusColors[detail.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                    {STATUS_LABELS[detail.status] || detail.status}
                  </Badge>
                  {detail.meeting_type && (
                    <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                      {MEETING_LABELS[detail.meeting_type] || detail.meeting_type}
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(detail.scheduled_at)}
                  </span>
                </div>
              </div>
            )}
          </SheetHeader>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {detailLoading || !detail ? (
              <DetailSkeleton />
            ) : (
              <>
                {/* Info grid */}
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCell icon={Calendar} label="Scheduled" value={formatDateTime(detail.scheduled_at)} />
                    <InfoCell icon={Clock} label="Duration" value={`${detail.duration_minutes} min`} />
                    <InfoCell
                      icon={MapPin}
                      label="Meeting Type"
                      value={detail.meeting_type ? MEETING_LABELS[detail.meeting_type] || detail.meeting_type : '—'}
                    />
                    <InfoCell
                      icon={MapPin}
                      label="Location"
                      value={detail.location || '—'}
                    />
                    <InfoCell
                      icon={Link2}
                      label="Meeting Link"
                      value={
                        detail.meeting_link ? (
                          <a
                            href={detail.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0c1e3c] underline inline-flex items-center gap-1 hover:text-[#a88832]"
                          >
                            Join <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'
                      }
                    />
                    <InfoCell icon={FileText} label="Fee" value={formatCurrency(detail.fee)} />
                    <InfoCell
                      icon={CheckCircle2}
                      label="Follow-up"
                      value={detail.follow_up_required ? 'Required' : 'Not required'}
                      valueClass={detail.follow_up_required ? 'text-amber-700' : ''}
                    />
                    <InfoCell icon={Clock} label="Logged" value={formatDateTime(detail.created_at)} />
                  </div>
                </section>

                {/* Client */}
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Client
                  </h3>
                  <div className="rounded-lg border border-slate-100 p-3 space-y-1.5 bg-slate-50/40">
                    <DetailRow icon={UserIcon} label="Name" value={displayName(detail.client?.full_name, '—')} />
                    <DetailRow icon={Mail} label="Email" value={detail.client?.email || '—'} />
                    <DetailRow icon={PhoneIcon} label="Phone" value={detail.client?.phone || '—'} />
                  </div>
                </section>

                {/* Legal advisor */}
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Legal Advisor
                  </h3>
                  <div className="rounded-lg border border-slate-100 p-3 space-y-1.5 bg-slate-50/40">
                    <DetailRow
                      icon={UserIcon}
                      label="Name"
                      value={displayName(detail.attorney?.full_name, '—')}
                    />
                    <DetailRow icon={Mail} label="Email" value={detail.attorney?.email || '—'} />
                    <DetailRow
                      icon={Briefcase}
                      label="Role"
                      value={detail.attorney?.role ? detail.attorney.role.replace(/_/g, ' ') : '—'}
                    />
                  </div>
                </section>

                {/* Case (if linked) */}
                {detail.case && (
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Linked Case
                    </h3>
                    <div className="rounded-lg border border-slate-100 p-3 space-y-1.5 bg-slate-50/40">
                      <DetailRow icon={FileText} label="Case Ref" value={detail.case.case_ref} />
                      <DetailRow icon={Briefcase} label="Title" value={detail.case.title} />
                      {detail.case.status && (
                        <DetailRow
                          icon={CheckCircle2}
                          label="Status"
                          value={(detail.case.status || '').replace(/_/g, ' ')}
                        />
                      )}
                    </div>
                  </section>
                )}

                {/* Notes */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Notes
                    </h3>
                    {isStaff && !showNotesEditor && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] text-[#0c1e3c] hover:bg-[#0c1e3c]/5 px-2"
                        onClick={() => {
                          setNotesDraft(detail.notes || '');
                          setShowNotesEditor(true);
                        }}
                      >
                        <StickyNote className="w-3 h-3 mr-1" />
                        {detail.notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    )}
                  </div>

                  {showNotesEditor ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={4}
                        placeholder="Type consultation notes…"
                        className="text-[13px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={actionLoading === 'notes'}
                          className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[12px] h-8"
                        >
                          {actionLoading === 'notes' ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          Save Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setShowNotesEditor(false); setNotesDraft(''); }}
                          className="text-[12px] h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/40">
                      {detail.notes && detail.notes.trim() ? (
                        <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {detail.notes}
                        </p>
                      ) : (
                        <p className="text-[12px] text-slate-400 italic">No notes recorded.</p>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Sticky action footer (staff only) */}
          {isStaff && !detailLoading && detail && (
            <div className="border-t border-slate-100 bg-white px-5 py-3 space-y-3">
              {/* Status changer */}
              <div className="flex items-center gap-2">
                <Label htmlFor="status-change" className="text-[11px] text-slate-500 whitespace-nowrap">
                  Status
                </Label>
                <Select
                  value={detail.status}
                  onValueChange={(v) => handleStatusChange(v)}
                  disabled={actionLoading === 'status' || actionLoading === 'cancel'}
                >
                  <SelectTrigger id="status-change" className="h-8 text-[12px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {actionLoading === 'status' && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                )}
              </div>

              {/* Reschedule inline editor */}
              {showReschedule ? (
                <div className="space-y-2 rounded-lg border border-slate-200 p-2.5 bg-slate-50/40">
                  <Label className="text-[11px] text-slate-500">New date & time</Label>
                  <Input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(e) => setRescheduleValue(e.target.value)}
                    className="text-[12px] h-8"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleReschedule}
                      disabled={actionLoading === 'reschedule' || !rescheduleValue}
                      className="bg-[#0c1e3c] hover:bg-[#0c1e3c]/90 text-white text-[12px] h-8"
                    >
                      {actionLoading === 'reschedule' ? (
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <CalendarClock className="w-3 h-3 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowReschedule(false); setRescheduleValue(''); }}
                      className="text-[12px] h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRescheduleValue(formatDateTimeLocal(detail.scheduled_at));
                      setShowReschedule(true);
                    }}
                    disabled={!!actionLoading}
                    className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8"
                  >
                    <CalendarClock className="w-3.5 h-3.5 mr-1" />
                    Reschedule
                  </Button>

                  <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={!!actionLoading || detail.status === 'cancelled'}
                      className="text-[12px] h-8"
                    >
                      {actionLoading === 'cancel' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 mr-1" />
                      )}
                      Cancel Consultation
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#0c1e3c]">Cancel this consultation?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px]">
                          This will mark the consultation as <strong>cancelled</strong>. The record is
                          preserved for audit purposes, but the client and advisor will be notified.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-[12px]">Keep it</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={actionLoading === 'cancel'}
                          className="bg-red-600 hover:bg-red-700 text-white text-[12px]"
                        >
                          {actionLoading === 'cancel' ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Ban className="w-3 h-3 mr-1" />
                          )}
                          Yes, cancel it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {detail.status === 'cancelled' && (
                <div className="flex items-start gap-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-md p-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>This consultation has been cancelled and is no longer actionable.</span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================
function InfoCell({
  icon: Icon,
  label,
  value,
  valueClass = '',
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`text-[13px] font-medium text-[#0c1e3c] break-words ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-400 w-20 flex-shrink-0">{label}:</span>
      <span className="text-slate-700 font-medium break-words flex-1">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 bg-slate-100" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 bg-slate-100" />
        <Skeleton className="h-20 bg-slate-100" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 bg-slate-100" />
        <Skeleton className="h-20 bg-slate-100" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 bg-slate-100" />
        <Skeleton className="h-24 bg-slate-100" />
      </div>
    </div>
  );
}
