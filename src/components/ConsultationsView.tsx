'use client';

import React, { useState } from 'react';
import { RefreshCw, Plus, BookOpen, MapPin, Video, PhoneCall } from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User, Consultation, StaffMember } from '@/components/types';
import { TableSkeleton } from '@/components/LoadingSkeleton';

export function ConsultationsView({ token, consultations, onRefresh, user, staff, loading }: {
  token: string | null; consultations: Consultation[]; onRefresh: () => void; user: User | null; staff: StaffMember[]; loading?: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_id: '', attorney_id: '', case_id: '',
    scheduled_at: '', duration_minutes: 60,
    meeting_type: 'in_person', notes: '',
  });

  const attorneys = staff.filter(s => s.role === 'attorney');

  const handleCreate = async () => {
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ client_id: '', attorney_id: '', case_id: '', scheduled_at: '', duration_minutes: 60, meeting_type: 'in_person', notes: '' });
        onRefresh();
      }
    } catch (e) {
      console.error('Create consultation error:', e);
    }
    setCreating(false);
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-100', confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    in_progress: 'bg-purple-50 text-purple-700 border-purple-100',
    completed: 'bg-slate-50 text-slate-700 border-slate-100', cancelled: 'bg-red-50 text-red-700 border-red-100', no_show: 'bg-orange-50 text-orange-700 border-orange-100',
  };

  const meetingIcons: Record<string, any> = { in_person: MapPin, video_call: Video, phone_call: PhoneCall };
  const meetingIconBg: Record<string, string> = {
    in_person: 'bg-emerald-50 text-emerald-600',
    video_call: 'bg-blue-50 text-blue-600',
    phone_call: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
                <DialogDescription className="text-[12px] text-slate-500">Schedule or log a client consultation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Client ID (UUID)</Label>
                    <Input value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} placeholder="Client profile UUID" className="mt-1 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Case ID (optional)</Label>
                    <Input value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} placeholder="Case UUID" className="mt-1 text-[13px]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Attorney</Label>
                    <Select value={form.attorney_id} onValueChange={v => setForm(f => ({ ...f, attorney_id: v }))}>
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue placeholder="Select attorney" /></SelectTrigger>
                      <SelectContent>
                        {attorneys.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role.replace(/_/g, ' ')})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Meeting Type</Label>
                    <Select value={form.meeting_type} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="phone_call">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Date & Time</Label>
                    <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Duration (min)</Label>
                    <Select value={String(form.duration_minutes)} onValueChange={v => setForm(f => ({ ...f, duration_minutes: parseInt(v) }))}>
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
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Consultation notes..." className="mt-1 text-[13px]" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="text-[12px]">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={creating || !form.client_id || !form.scheduled_at}
                  className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px]">
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <BookOpen className="w-3.5 h-3.5 mr-2" />}
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
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/[0.03]">
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Type</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Client</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Attorney</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Date & Time</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Duration</th>
                  <th className="text-left p-2.5 font-semibold uppercase tracking-wider text-[10px] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {consultations.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No consultations logged yet</td></tr>
                ) : (
                  consultations.map(c => {
                    const IconComp = meetingIcons[c.meeting_type] || MapPin;
                    const iconStyle = meetingIconBg[c.meeting_type] || 'bg-slate-50 text-slate-600';
                    return (
                      <tr key={c.id} className="border-b hover:bg-[#f7f8fa] transition-colors">
                        <td className="p-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconStyle}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                        </td>
                        <td className="p-2.5 font-medium text-[#0c1e3c]">{c.client?.full_name || 'Client'}</td>
                        <td className="p-2.5 text-slate-600">{c.attorney?.profile?.full_name || c.attorney?.full_name || '-'}</td>
                        <td className="p-2.5 text-slate-600">{c.scheduled_at ? (() => { const d = new Date(c.scheduled_at); return `${d.toLocaleDateString('en-ZA')} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`; })() : '-'}</td>
                        <td className="p-2.5 text-slate-600">{c.duration_minutes} min</td>
                        <td className="p-2.5"><Badge className={`text-[9px] border ${statusColors[c.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{c.status}</Badge></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
