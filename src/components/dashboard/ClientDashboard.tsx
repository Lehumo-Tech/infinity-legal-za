'use client';

import React from 'react';
import {
  FolderKanban, BookOpen, FileText, CheckCircle2, Crown, Zap,
  Clock3, ChevronRight, ArrowRight, Video, PhoneCall, MapPin,
  MessageSquare, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MembershipCard } from './MembershipCard';
import type { View, Stats, Consultation, TaskItem } from '@/components/types';

interface ClientDashboardProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    phone?: string | null;
  } | null;
  stats: Stats | null;
  cases: any[];
  consultations: Consultation[];
  tasks: TaskItem[];
  subscription: any;
  onViewChange: (v: View) => void;
}

export function ClientDashboard({
  user,
  stats,
  cases,
  consultations,
  tasks,
  subscription,
  onViewChange,
}: ClientDashboardProps) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const quickActions = [
    { label: 'My Cases', icon: FolderKanban, color: 'bg-[#0c1e3c] text-[#c9a84c]', view: 'cases' as View },
    { label: 'Consultations', icon: BookOpen, color: 'bg-emerald-50 text-emerald-700', view: 'consultations' as View },
    { label: 'My Documents', icon: FileText, color: 'bg-blue-50 text-blue-700', view: 'documents' as View },
    { label: 'Messages', icon: MessageSquare, color: 'bg-purple-50 text-purple-700', view: 'messages' as View },
    ...(subscription
      ? [{ label: 'My Plan', icon: Crown, color: 'bg-[#c9a84c]/15 text-[#a88832]', view: 'subscription' as View }]
      : [{ label: 'Subscribe', icon: Zap, color: 'bg-[#c9a84c]/15 text-[#a88832]', view: 'subscription' as View }]
    ),
  ];

  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'review');
  const upcomingConsultations = consultations.filter(c => c.status === 'scheduled' || c.status === 'confirmed').slice(0, 3);
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5);

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
              <Clock3 className="w-3.5 h-3.5 text-[#8fa4c4]" />
              <p className="text-[#8fa4c4] text-sm">{todayStr}</p>
            </div>
            <Badge className="mt-3 bg-gradient-to-r from-[#c9a84c] via-[#dfc475] to-[#c9a84c] text-[#0c1e3c] text-[10px] font-semibold animate-shimmer bg-[length:200%_100%] shadow-sm">
              <Crown className="w-3 h-3 mr-1" />
              Client Portal
            </Badge>
          </div>
          <div className="hidden md:flex gap-3">
            {stats && (
              <>
                <MiniStat label="Active Cases" value={stats.activeCases} />
                <MiniStat label="Pending Tasks" value={stats.pendingTasks} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Membership Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Card */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">My Membership</h3>
          {subscription ? (
            <MembershipCard
              clientName={user?.full_name || 'Member'}
              contractNumber={subscription.membership_number || subscription.contract_number || `INF-${new Date().getFullYear()}-${(subscription.plan?.slug || '').includes('extensive') ? 'EXT' : (subscription.plan?.slug || '').includes('labour') ? 'LAB' : 'CIV'}01`}
              planName={subscription.plan?.name}
              planSlug={subscription.plan?.slug}
              status={subscription.status}
              membershipNumber={subscription.membership_number}
              validFrom={subscription.created_at}
              validTo={subscription.current_period_end}
            />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#c9a84c]/30 bg-gradient-to-r from-[#0c1e3c] via-[#132d52] to-[#0c1e3c] p-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#c9a84c]/[0.06] rounded-full blur-[40px]" />
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/15 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-[#c9a84c]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Get Legal Coverage from R99/month</h3>
                  <p className="text-[#8fa4c4] text-[13px] mt-1">Choose a plan that covers your legal needs</p>
                </div>
                <Button onClick={() => onViewChange('subscription')} className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg px-6 text-[13px] font-semibold shadow-lg shadow-[#c9a84c]/20 gap-2">
                  View Plans <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
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
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: FolderKanban, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-500' },
            { label: 'Active Cases', value: stats.activeCases, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Documents', value: stats.totalDocuments, icon: FileText, color: 'text-slate-600 bg-slate-100', border: 'border-l-slate-400' },
            { label: 'Pending Tasks', value: stats.pendingTasks, icon: Clock3, color: 'text-orange-600 bg-orange-50', border: 'border-l-orange-500' },
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
      )}

      {/* Cases & Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Cases */}
        <div className="card-premium">
          <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#0c1e3c]" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">My Cases</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('cases')}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {activeCases.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <FolderKanban className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No active cases</p>
                <p className="text-[11px] text-slate-300 mt-1">Your cases will appear here once created</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {activeCases.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors border-l-[3px] border-l-[#0c1e3c]">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500">{c.case_ref} · {c.case_type}</div>
                    </div>
                    <Badge className={`text-[10px] ${
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'review' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                <p className="text-[11px] text-slate-300 mt-1">Schedule your first consultation</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs border-[#c9a84c]/30 text-[#a88832] hover:bg-[#c9a84c]/5" onClick={() => onViewChange('consultations')}>Schedule One</Button>
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
                        <div className="text-sm font-medium text-slate-900 truncate">{c.attorney?.full_name || 'Legal Advisor'}</div>
                        <div className="text-[10px] text-slate-500">
                          {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-ZA') : 'TBD'} · {c.duration_minutes}min
                        </div>
                      </div>
                      <Badge className="text-[10px] bg-blue-100 text-blue-700">{c.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
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
              <p className="text-[11px] text-slate-300 mt-1">No pending tasks remaining</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {pendingTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    t.priority === 'urgent' ? 'border-red-400 bg-red-50' :
                    t.priority === 'high' ? 'border-orange-400 bg-orange-50' :
                    'border-amber-400 bg-amber-50'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      t.priority === 'urgent' ? 'bg-red-500' :
                      t.priority === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{t.title}</div>
                    <div className="text-[10px] text-slate-500">
                      {t.due_date && `Due: ${new Date(t.due_date).toLocaleDateString('en-ZA')}`}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${
                    t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{t.status.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
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
