'use client';

import React from 'react';
import {
  FolderKanban, CheckCircle2, Users, TrendingUp,
  Crown, Activity, UserPlus, DollarSign, Clock, AlertTriangle, FileText,
  ChevronRight, Sparkles, ArrowUpRight, Target, BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { View, Stats } from '@/components/types';

interface AdminDashboardProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  stats: Stats | null;
  cases: any[];
  leads: any[];
  staff: any[];
  token: string | null;
  onViewChange: (v: View) => void;
  charts: any;
  firmHealth: Record<string, boolean>;
}

export function AdminDashboard({
  user,
  stats,
  cases,
  leads,
  staff,
  onViewChange,
  charts,
  firmHealth,
}: AdminDashboardProps) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const activeCases = cases.filter(c => c.status === 'active');
  const intakeCases = cases.filter(c => c.status === 'intake');
  const newLeads = leads.filter(l => l.status === 'new' || l.status === 'submitted');

  const quickActions = [
    { label: 'All Cases', icon: FolderKanban, color: 'bg-[#0c1e3c] text-[#c9a84c]', view: 'cases' as View },
    { label: 'Clients', icon: Users, color: 'bg-emerald-50 text-emerald-700', view: 'clients' as View },
    { label: 'Leads', icon: Target, color: 'bg-purple-50 text-purple-700', view: 'leads' as View },
    { label: 'Analytics', icon: TrendingUp, color: 'bg-teal-50 text-teal-700', view: 'analytics' as View },
    { label: 'Staff', icon: Users, color: 'bg-blue-50 text-blue-700', view: 'staff' as View },
    { label: 'Subscriptions', icon: Crown, color: 'bg-[#c9a84c]/15 text-[#a88832]', view: 'subscriptions' as View },
  ];

  const healthItems = [
    { label: 'RBAC Authorization', ok: firmHealth.rbac !== undefined ? firmHealth.rbac : true },
    { label: 'POPIA Consent', ok: firmHealth.popia !== undefined ? firmHealth.popia : true },
    { label: 'Audit Logging', ok: firmHealth.auditLogging !== undefined ? firmHealth.auditLogging : true },
    { label: 'Encryption (AES-256)', ok: firmHealth.encryption !== undefined ? firmHealth.encryption : true },
    { label: 'Password Policy', ok: firmHealth.passwordPolicy !== undefined ? firmHealth.passwordPolicy : true },
    { label: 'Backup Active', ok: firmHealth.backupActive || false },
  ];
  const healthyCount = healthItems.filter(h => h.ok).length;

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
              Managing Director
            </Badge>
          </div>
          <div className="hidden md:flex gap-3">
            {stats && (
              <>
                <MiniStat label="Total Cases" value={stats.totalCases} />
                <MiniStat label="Clients" value={stats.totalClients} />
                <MiniStat label="Revenue" value={`R${(stats.totalRevenue / 1000000).toFixed(1)}M`} />
                <MiniStat label="New Leads" value={stats.newLeads} />
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

      {/* KPI Stats */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 stagger-children">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: FolderKanban, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-500' },
            { label: 'Active Cases', value: stats.activeCases, icon: Activity, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-500' },
            { label: 'Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-[#a88832] bg-[#c9a84c]/10', border: 'border-l-[#c9a84c]', trend: stats.revenueTrend || 'N/A' },
            { label: 'Pending Tasks', value: stats.pendingTasks, icon: Clock, color: 'text-orange-600 bg-orange-50', border: 'border-l-orange-500' },
            { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-l-red-500' },
            { label: 'Clients', value: stats.totalClients, icon: Users, color: 'text-teal-600 bg-teal-50', border: 'border-l-teal-500' },
            { label: 'Documents', value: stats.totalDocuments, icon: FileText, color: 'text-slate-600 bg-slate-100', border: 'border-l-slate-400' },
          ].map(card => (
            <div key={card.label} className={`stat-card border-l-4 ${card.border}`}>
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                {card.trend && (
                  <div className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-semibold">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{card.trend}</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{card.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3 space-y-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="h-5 w-12" /><Skeleton className="h-3 w-16" /></CardContent></Card>
          ))}
        </div>
      )}

      {/* Intake Alert */}
      {intakeCases.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-[#c9a84c]/30 bg-gradient-to-r from-[#c9a84c]/5 via-white to-[#c9a84c]/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#a88832]" />
              </div>
              <div>
                <h3 className="text-[#0c1e3c] font-semibold text-sm">{intakeCases.length} Case{intakeCases.length !== 1 ? 's' : ''} Awaiting Assignment</h3>
                <p className="text-slate-500 text-[12px] mt-0.5">Review new intakes and assign to attorneys</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onViewChange('cases')} className="text-[#a88832] border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 text-[12px]">
              Review <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Case Distribution + Recent Activity + Firm Health */}
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
              <Badge className={`text-[10px] font-semibold ${healthyCount === healthItems.length ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {healthyCount}/{healthItems.length}
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

      {/* Recent Leads & Staff Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium">
          <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">Recent Leads</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('leads')}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {newLeads.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No recent leads</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {newLeads.slice(0, 5).map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors border-l-[3px] border-l-purple-400">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{l.case_description?.substring(0, 50) || 'Lead'}</div>
                      <div className="text-[10px] text-slate-500">{l.status} · {l.case_type || 'General'}</div>
                    </div>
                    <Badge className="text-[10px] bg-purple-100 text-purple-700">{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-premium">
          <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">Staff Directory</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('staff')}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {staff.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No staff members</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {staff.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#c9a84c] text-[#0c1e3c] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.full_name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{s.full_name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{s.role?.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
