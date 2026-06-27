'use client';

import React from 'react';
import {
  FolderKanban, BookOpen, CheckCircle2, Users, TrendingUp,
  Crown, Activity, UserPlus, DollarSign, Clock, AlertTriangle, FileText,
  ChevronRight, Video, PhoneCall, MapPin, Calendar,
  FileUp, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { View, Stats, Consultation, TaskItem } from '@/components/types';

interface AttorneyDashboardProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  stats: Stats | null;
  cases: any[];
  consultations: Consultation[];
  tasks: TaskItem[];
  token: string | null;
  onViewChange: (v: View) => void;
  charts: any;
  firmHealth: Record<string, boolean>;
}

export function LegalAdvisorDashboard({
  user,
  stats,
  cases,
  consultations,
  tasks,
  onViewChange,
  charts,
  firmHealth,
}: AttorneyDashboardProps) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const assignedCases = cases.filter(c => c.status === 'active' || c.status === 'review');
  const newIntakes = cases.filter(c => c.status === 'intake');
  const upcomingConsultations = consultations.filter(c => c.status === 'scheduled' || c.status === 'confirmed').slice(0, 5);
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5);
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

  const quickActions = [
    { label: 'My Cases', icon: FolderKanban, color: 'bg-[#0c1e3c] text-[#c9a84c]', view: 'cases' as View },
    { label: 'New Intakes', icon: Sparkles, color: 'bg-purple-50 text-purple-700', view: 'cases' as View },
    { label: 'Tasks', icon: CheckCircle2, color: 'bg-amber-50 text-amber-700', view: 'tasks' as View },
    { label: 'Calendar', icon: Calendar, color: 'bg-blue-50 text-blue-700', view: 'consultations' as View },
    { label: 'Consultations', icon: BookOpen, color: 'bg-emerald-50 text-emerald-700', view: 'consultations' as View },
    { label: 'Documents', icon: FileUp, color: 'bg-teal-50 text-teal-700', view: 'documents' as View },
  ];

  const healthItems = [
    { label: 'RBAC Authorization', ok: firmHealth.rbac !== undefined ? firmHealth.rbac : true },
    { label: 'POPIA Consent', ok: firmHealth.popia !== undefined ? firmHealth.popia : true },
    { label: 'Audit Logging', ok: firmHealth.auditLogging !== undefined ? firmHealth.auditLogging : true },
    { label: 'Encryption (AES-256)', ok: firmHealth.encryption !== undefined ? firmHealth.encryption : true },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="card-navy relative">
        <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 rotate-45 transform origin-center" />
        </div>
        <div className="relative p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">{greeting}</p>
            <h2 className="text-2xl font-bold text-white">{firstName}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8fa4c4]" />
              <p className="text-[#8fa4c4] text-sm">{todayStr}</p>
            </div>
            <Badge className="mt-3 bg-gradient-to-r from-[#c9a84c] via-[#dfc475] to-[#c9a84c] text-[#0c1e3c] text-[10px] font-semibold animate-shimmer bg-[length:200%_100%] shadow-sm">
              <Crown className="w-3 h-3 mr-1" />
              Legal Advisor Portal
            </Badge>
          </div>
          <div className="hidden md:flex gap-3">
            {stats && (
              <>
                <MiniStat label="Active Cases" value={stats.activeCases} />
                <MiniStat label="Urgent Tasks" value={urgentTasks.length} />
                <MiniStat label="New Intakes" value={newIntakes.length} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className="card-premium flex flex-col items-center gap-2.5 p-4 text-center group relative"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} transition-all duration-300 group-hover:scale-110`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ChevronRight className="w-3.5 h-3.5 text-[#c9a84c]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: FolderKanban, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-500' },
            { label: 'Active Cases', value: stats.activeCases, icon: Activity, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-500' },
            { label: 'Pending Tasks', value: stats.pendingTasks, icon: Clock, color: 'text-orange-600 bg-orange-50', border: 'border-l-orange-500' },
          ].map(card => (
            <div key={card.label} className={`stat-card border-l-4 ${card.border}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{card.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3 space-y-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="h-5 w-12" /><Skeleton className="h-3 w-16" /></CardContent></Card>
          ))}
        </div>
      )}

      {/* New Intakes Alert */}
      {newIntakes.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-purple-50/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-[#0c1e3c] font-semibold text-sm">{newIntakes.length} New Intake{newIntakes.length !== 1 ? 's' : ''} Pending</h3>
                <p className="text-slate-500 text-[12px] mt-0.5">Review and assign these cases to get started</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onViewChange('cases')} className="text-purple-600 border-purple-200 hover:bg-purple-50 text-[12px]">
              Review <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Consultations & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Consultations */}
        <div className="card-premium">
          <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#c9a84c]" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">Upcoming Consultations</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('consultations')}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {upcomingConsultations.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No consultations scheduled</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {upcomingConsultations.map(c => {
                  const meetingColor = c.meeting_type === 'video_call' ? 'border-l-blue-400' : c.meeting_type === 'phone_call' ? 'border-l-emerald-400' : 'border-l-[#c9a84c]';
                  return (
                    <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors border-l-[3px] ${meetingColor}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        c.meeting_type === 'video_call' ? 'bg-blue-50 text-blue-600' :
                        c.meeting_type === 'phone_call' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-[#c9a84c]/10 text-[#a88832]'
                      }`}>
                        {c.meeting_type === 'video_call' ? <Video className="w-4 h-4" /> :
                         c.meeting_type === 'phone_call' ? <PhoneCall className="w-4 h-4" /> :
                         <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{c.client?.full_name || 'Client'}</div>
                        <div className="text-[10px] text-slate-500">
                          {c.scheduled_at ? (() => { const d = new Date(c.scheduled_at); return `${d.toLocaleDateString('en-ZA')} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`; })() : 'TBD'} · {c.duration_minutes}min
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${
                        c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        c.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{c.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card-premium">
          <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">My Tasks</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('tasks')}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 animate-float">
                  <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                </div>
                <p className="text-slate-500 font-medium">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {pendingTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      t.priority === 'urgent' ? 'border-red-400 bg-red-50' :
                      t.priority === 'high' ? 'border-orange-400 bg-orange-50' :
                      t.priority === 'medium' ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'
                    }`}>
                      {t.priority === 'urgent' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      {t.priority === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {t.due_date && `Due: ${new Date(t.due_date).toLocaleDateString('en-ZA')}`}
                        {t.case && ` · ${t.case.title}`}
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${
                      t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{t.status.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Case Distribution + Firm Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium lg:col-span-2">
          <div className="p-4 pb-3 border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#0c1e3c]" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">Case Distribution by Type</h3>
            </div>
          </div>
          <div className="p-4">
            <CaseDistribution charts={charts} />
          </div>
        </div>

        <div className="card-premium">
          <div className="p-4 pb-3 border-b border-slate-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-[#0c1e3c]">Firm Health</h3>
              </div>
              <Badge className={`text-[10px] font-semibold ${healthItems.every(h => h.ok) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {healthItems.filter(h => h.ok).length}/{healthItems.length}
              </Badge>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {healthItems.map(item => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <span className={`text-sm ${item.ok ? 'text-slate-700' : 'text-red-700 font-medium'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-dark rounded-xl px-4 py-3 text-center min-w-[100px] border-b-2 border-[#c9a84c]/30">
      <div className="text-lg font-bold text-[#c9a84c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-[10px] text-[#8fa4c4] font-medium uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function CaseDistribution({ charts }: { charts: any }) {
  const caseTypeGradientMap: Record<string, { label: string; from: string; to: string }> = {
    family: { label: 'Family', from: 'from-[#0c1e3c]', to: 'to-[#1a3358]' },
    civil: { label: 'Civil', from: 'from-[#c9a84c]', to: 'to-[#dfc475]' },
    criminal: { label: 'Criminal', from: 'from-red-500', to: 'to-red-400' },
    corporate: { label: 'Corporate', from: 'from-emerald-600', to: 'to-emerald-400' },
    property: { label: 'Property', from: 'from-purple-600', to: 'to-purple-400' },
    labour: { label: 'Labour', from: 'from-teal-600', to: 'to-teal-400' },
    immigration: { label: 'Immigration', from: 'from-cyan-600', to: 'to-cyan-400' },
    other: { label: 'Other', from: 'from-slate-500', to: 'to-slate-400' },
  };

  const data = charts?.casesByType || [];
  const total = data.reduce((s: number, d: any) => s + d.count, 0) || 1;

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
          <FolderKanban className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-400">No case data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item: any) => {
        const mapping = caseTypeGradientMap[item.case_type] || { label: item.case_type?.replace(/_/g, ' '), from: 'from-slate-500', to: 'to-slate-400' };
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.case_type} className="flex items-center gap-3 group hover:bg-slate-50/50 rounded-lg px-1 py-1 -mx-1 transition-colors">
            <span className="text-[13px] text-slate-600 w-28 flex-shrink-0">{mapping.label}</span>
            <div className="flex-1 bg-slate-100/80 rounded-full h-[6px]">
              <div className={`bg-gradient-to-r ${mapping.from} ${mapping.to} rounded-full h-[6px] transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <div className="w-20 text-right flex-shrink-0">
              <span className="text-[11px] font-medium text-[#0c1e3c]">{pct}%</span>
              <span className="text-[10px] text-slate-400 ml-1">({item.count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
