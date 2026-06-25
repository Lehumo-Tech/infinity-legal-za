'use client';

import {
  BookOpen, FileUp, FolderKanban, CheckCircle2, Users, TrendingUp,
  Crown, Activity, UserPlus, DollarSign, Clock, AlertTriangle, FileText,
  ChevronRight, Video, PhoneCall, MapPin, AlertCircle, ArrowUpRight,
  Sparkles, BarChart3,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { View, User, Stats, Consultation, TaskItem } from '@/components/types';
import { KPISkeleton, CardGridSkeleton } from '@/components/LoadingSkeleton';

export function WorkbenchView({ stats, user, cases, consultations, tasks, token, onViewChange, charts, firmHealth, loading }: {
  stats: Stats | null; user: User | null; cases: any[]; consultations: Consultation[];
  tasks: TaskItem[]; token: string | null; onViewChange: (v: View) => void;
  charts: any; firmHealth: Record<string, boolean>; loading?: boolean;
}) {
  const role = user?.role || 'client';
  const isManagement = ['managing_director', 'systems_admin'].includes(role);
  const isLegal = role === 'attorney';
  const isParalegal = role === 'paralegal';

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const todayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const quickActions = [
    ...(isLegal || isManagement ? [{ label: 'Log Consultation', icon: BookOpen, color: 'bg-[#0c1e3c] text-[#c9a84c]', view: 'consultations' as View }] : []),
    ...(isLegal || isParalegal || isManagement ? [{ label: 'Upload Document', icon: FileUp, color: 'bg-emerald-50 text-emerald-700', view: 'documents' as View }] : []),
    ...(isManagement || isLegal ? [{ label: 'New Case', icon: FolderKanban, color: 'bg-blue-50 text-blue-700', view: 'cases' as View }] : []),
    { label: 'My Tasks', icon: CheckCircle2, color: 'bg-amber-50 text-amber-700', view: 'tasks' as View },
    ...(isManagement || isLegal || isParalegal ? [{ label: 'View Staff', icon: Users, color: 'bg-purple-50 text-purple-700', view: 'staff' as View }] : []),
    ...(isManagement ? [{ label: 'Analytics', icon: TrendingUp, color: 'bg-teal-50 text-teal-700', view: 'analytics' as View }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* ===== WELCOME BANNER ===== */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0a1628]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0c1e3c] to-[#0c1e3c]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9a84c]/[0.04] rounded-full blur-[60px]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wb-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.5" fill="#c9a84c" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wb-dots)" />
          </svg>
        </div>
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}</h2>
            </div>
            <p className="text-[#5a7199] text-[13px]">{todayStr}</p>
            <Badge className="mt-2 bg-[#c9a84c]/15 text-[#c9a84c] text-[9px] border border-[#c9a84c]/20 hover:bg-[#c9a84c]/20">
              <Crown className="w-2.5 h-2.5 mr-1" />
              {role === 'attorney' ? 'Legal Advisor' : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          {stats && (
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/[0.06]">
                <div className="text-lg font-bold text-[#c9a84c]">{stats.activeCases}</div>
                <div className="text-[9px] text-[#5a7199] uppercase tracking-wider">Active</div>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/[0.06]">
                <div className="text-lg font-bold text-[#c9a84c]">{stats.pendingTasks}</div>
                <div className="text-[9px] text-[#5a7199] uppercase tracking-wider">Tasks</div>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/[0.06]">
                <div className="text-lg font-bold text-[#c9a84c]">{stats.totalRevenue > 1000000 ? `R${(stats.totalRevenue / 1000000).toFixed(1)}M` : `R${(stats.totalRevenue / 1000).toFixed(0)}K`}</div>
                <div className="text-[9px] text-[#5a7199] uppercase tracking-wider">Revenue</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-[#c9a84c]/30 hover:shadow-md transition-all text-center group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== KPI ROW — Varied card sizes ===== */}
      {loading && !stats ? (
        <KPISkeleton />
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Active Cases — Primary metric */}
          <Card className="border-l-[3px] border-l-[#0c1e3c] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Cases</span>
                <div className="w-7 h-7 rounded-lg bg-[#0c1e3c]/[0.06] flex items-center justify-center">
                  <FolderKanban className="w-3.5 h-3.5 text-[#0c1e3c]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0c1e3c]">{stats.activeCases}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalCases} total</p>
            </CardContent>
          </Card>

          {/* New Leads */}
          <Card className="border-l-[3px] border-l-[#c9a84c] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">New Leads</span>
                <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/[0.1] flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5 text-[#a88832]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0c1e3c]">{stats.newLeads}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalLeads} total</p>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="border-l-[3px] border-l-red-400 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Overdue</span>
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0c1e3c]">{stats.overdueTasks}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{stats.pendingTasks} pending</p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="border-l-[3px] border-l-emerald-400 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Revenue</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0c1e3c]">
                {stats.totalRevenue > 1000000 ? `R${(stats.totalRevenue / 1000000).toFixed(1)}M` : `R${(stats.totalRevenue / 1000).toFixed(0)}K`}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalClients} clients</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== MAIN CONTENT: Two columns ===== */}
      {loading && !stats ? (
        <CardGridSkeleton count={2} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Left column — 3/5 */}
        <div className="lg:col-span-3 space-y-5">
          {/* Upcoming Consultations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Upcoming Consultations</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#a88832] text-[11px] h-6 px-2" onClick={() => onViewChange('consultations')}>
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {consultations.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-[13px] text-slate-400">No consultations scheduled</p>
                  <Button variant="outline" size="sm" className="mt-2 text-[11px] h-7" onClick={() => onViewChange('consultations')}>Schedule One</Button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {consultations.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f7f8fa] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        c.meeting_type === 'video_call' ? 'bg-blue-50 text-blue-600' :
                        c.meeting_type === 'phone_call' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-[#c9a84c]/[0.08] text-[#a88832]'
                      }`}>
                        {c.meeting_type === 'video_call' ? <Video className="w-3.5 h-3.5" /> :
                         c.meeting_type === 'phone_call' ? <PhoneCall className="w-3.5 h-3.5" /> :
                         <MapPin className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#0c1e3c] truncate">{c.client?.full_name || 'Client'}</div>
                        <div className="text-[10px] text-slate-500">{c.scheduled_at ? (() => { const d = new Date(c.scheduled_at); return `${d.toLocaleDateString('en-ZA')} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`; })() : 'TBD'} &middot; {c.duration_minutes}min</div>
                      </div>
                      <Badge className={`text-[9px] h-5 ${
                        c.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        c.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        c.status === 'completed' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Case Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Case Distribution</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#a88832] text-[11px] h-6 px-2" onClick={() => onViewChange('analytics')}>
                  <BarChart3 className="w-3 h-3 mr-1" />Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {(() => {
                const caseTypeColorMap: Record<string, { label: string; color: string }> = {
                  family: { label: 'Family', color: 'bg-[#0c1e3c]' },
                  civil: { label: 'Civil', color: 'bg-[#c9a84c]' },
                  criminal: { label: 'Criminal', color: 'bg-red-500' },
                  corporate: { label: 'Corporate', color: 'bg-emerald-500' },
                  property: { label: 'Property', color: 'bg-purple-500' },
                  labour: { label: 'Labour', color: 'bg-teal-500' },
                  immigration: { label: 'Immigration', color: 'bg-cyan-500' },
                  intellectual_property: { label: 'IP', color: 'bg-orange-500' },
                  tax: { label: 'Tax', color: 'bg-pink-500' },
                  personal_injury: { label: 'Injury', color: 'bg-indigo-500' },
                  debt_recovery: { label: 'Debt Recovery', color: 'bg-amber-500' },
                  other: { label: 'Other', color: 'bg-slate-400' },
                };
                const data = charts?.casesByType || [];
                const total = data.reduce((s: number, d: any) => s + d.count, 0) || 1;
                if (data.length === 0) {
                  return <div className="text-center py-6 text-[13px] text-slate-400">No case data yet</div>;
                }
                return (
                  <div className="space-y-2.5">
                    {data.slice(0, 6).map((item: any) => {
                      const mapping = caseTypeColorMap[item.case_type] || { label: item.case_type?.replace(/_/g, ' '), color: 'bg-slate-400' };
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.case_type} className="flex items-center gap-3">
                          <span className="text-[12px] text-slate-600 w-24 truncate">{mapping.label}</span>
                          <div className="flex-1 bg-[#f0f1f3] rounded-full h-1.5">
                            <div className={`${mapping.color} rounded-full h-1.5 transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[12px] font-medium text-[#0c1e3c] w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 space-y-5">
          {/* My Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">My Tasks</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#a88832] text-[11px] h-6 px-2" onClick={() => onViewChange('tasks')}>
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-[13px] text-slate-400">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f7f8fa] transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        t.priority === 'urgent' ? 'bg-red-500' :
                        t.priority === 'high' ? 'bg-orange-500' :
                        t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-[#0c1e3c] truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {t.due_date && `Due: ${new Date(t.due_date).toLocaleDateString('en-ZA')}`}
                          {t.case && ` · ${t.case.title}`}
                        </div>
                      </div>
                      <Badge className={`text-[9px] h-5 ${
                        t.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        t.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>{t.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Firm Health */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Firm Health</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2.5">
                {[
                  { label: 'RBAC Authorization', ok: firmHealth.rbac !== undefined ? firmHealth.rbac : true },
                  { label: 'POPIA Consent', ok: firmHealth.popia !== undefined ? firmHealth.popia : true },
                  { label: 'Audit Logging', ok: firmHealth.auditLogging !== undefined ? firmHealth.auditLogging : true },
                  { label: 'Encryption (AES-256)', ok: firmHealth.encryption !== undefined ? firmHealth.encryption : true },
                  { label: 'Password Policy', ok: firmHealth.passwordPolicy !== undefined ? firmHealth.passwordPolicy : true },
                  { label: 'Backup Active', ok: firmHealth.backupActive || false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    {item.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-[12px] text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}
