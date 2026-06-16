'use client';

import React, { useState } from 'react';
import { RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import type { User, TaskItem, StaffMember } from '@/components/types';
import { TableSkeleton } from '@/components/LoadingSkeleton';

export function TasksView({ token, tasks, onRefresh, user, staff, loading }: {
  token: string | null; tasks: TaskItem[]; onRefresh: () => void; user: User | null; staff: StaffMember[]; loading?: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', case_id: '' });

  const handleCreate = async () => {
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', case_id: '' });
        onRefresh();
      }
    } catch (e) {
      console.error('Create task error:', e);
    }
    setCreating(false);
  };

  const priorityColors: Record<string, string> = { low: 'text-slate-500', medium: 'text-amber-600', high: 'text-orange-600', urgent: 'text-red-600' };
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  const priorityDotColors: Record<string, string> = {
    urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-slate-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Tasks</h2>
          <p className="text-[13px] text-slate-500">{tasks.length} total tasks</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c]/20 text-[#0c1e3c] text-[12px] h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px] h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Create Task</DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500">Assign a new task to a team member</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-[12px]">Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="mt-1 text-[13px]" />
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." className="mt-1 text-[13px]" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Assign To</Label>
                    <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>
                        {staff.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.role.replace(/_/g, ' ')})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="mt-1 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[12px]">Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Case ID (Optional)</Label>
                    <Input value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} placeholder="Link to case" className="mt-1 text-[13px]" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="text-[12px]">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={creating || !form.title || !form.assigned_to}
                  className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] text-[13px]">
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-1">
        {loading && tasks.length === 0 ? (
          <Card className="shadow-sm"><CardContent className="p-0"><TableSkeleton rows={5} cols={4} /></CardContent></Card>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[13px] font-medium text-slate-500">No tasks found</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="hover:bg-[#f7f8fa] rounded-lg p-3 flex items-center gap-3 transition-colors">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDotColors[task.priority] || 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#0c1e3c]">{task.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {task.assignee?.full_name && `Assigned to ${task.assignee.full_name}`}
                  {task.case && ` · ${task.case.title}`}
                  {task.due_date && ` · Due: ${new Date(task.due_date).toLocaleDateString('en-ZA')}`}
                </div>
              </div>
              <Badge className={`text-[9px] border ${statusColors[task.status] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{task.status.replace(/_/g, ' ')}</Badge>
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
