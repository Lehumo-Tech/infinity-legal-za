'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, CreditCard, TrendingUp, Activity, Shield, Settings,
  Search, RefreshCw, Download, BarChart3, PieChart, AlertTriangle,
  CheckCircle2, XCircle, Clock, DollarSign, Eye, Lock, Trash2, Edit,
  ChevronRight, Filter,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface AdminCRMProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    department?: string | null;
  } | null;
}

interface CRMMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  newLeads: number;
  userGrowth: { date: string; count: number }[];
  subscriptionBreakdown: { status: string; count: number }[];
  leadFunnel: { stage: string; count: number }[];
  caseStatusBreakdown: { status: string; count: number }[];
  recentActivity: ActivityEntry[];
}

interface CRMUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  created_at: string;
  is_active: boolean;
}

interface CRMSubscription {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  billing_cycle: string;
}

interface ActivityEntry {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string | null;
}

interface CRMSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number' | 'json';
  description: string | null;
  updated_at: string;
}

// ============================================
// HELPERS
// ============================================

function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSADate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatSADate(dateStr);
}

const ROLE_COLORS: Record<string, string> = {
  managing_director: 'bg-[#c9a84c]/15 text-[#a88832] border-[#c9a84c]/30',
  senior_partner: 'bg-purple-100 text-purple-700 border-purple-200',
  associate: 'bg-blue-100 text-blue-700 border-blue-200',
  paralegal: 'bg-teal-100 text-teal-700 border-teal-200',
  legal_officer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  supervising_officer: 'bg-orange-100 text-orange-700 border-orange-200',
  senior_consultant: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  consultant: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  candidate_attorney: 'bg-pink-100 text-pink-700 border-pink-200',
  hr_manager: 'bg-rose-100 text-rose-700 border-rose-200',
  finance_manager: 'bg-amber-100 text-amber-700 border-amber-200',
  office_administrator: 'bg-slate-100 text-slate-700 border-slate-200',
  systems_admin: 'bg-red-100 text-red-700 border-red-200',
  receptionist: 'bg-lime-100 text-lime-700 border-lime-200',
  client: 'bg-gray-100 text-gray-700 border-gray-200',
  guest: 'bg-gray-50 text-gray-500 border-gray-100',
};

const SUB_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  past_due: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  trialing: 'bg-blue-100 text-blue-700 border-blue-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <Lock className="w-3.5 h-3.5" />,
  create: <UserPlus className="w-3.5 h-3.5" />,
  update: <Edit className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  subscription_change: <CreditCard className="w-3.5 h-3.5" />,
  payment: <DollarSign className="w-3.5 h-3.5" />,
  case_update: <Activity className="w-3.5 h-3.5" />,
  document_upload: <CheckCircle2 className="w-3.5 h-3.5" />,
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminCRM({ user }: AdminCRMProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [crmUsers, setCrmUsers] = useState<CRMUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<CRMSubscription[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [settings, setSettings] = useState<CRMSetting[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    overview: false, users: false, subscriptions: false, activity: false, settings: false,
  });

  // Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Activity tab state
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  // Settings tab state
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Subscriptions tab state
  const [subSummary, setSubSummary] = useState({ activeCount: 0, monthlyRevenue: 0, churnRate: 0 });

  // Edit user role dialog
  const [editUser, setEditUser] = useState<CRMUser | null>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // ---- DATA FETCHING ----

  const fetchMetrics = useCallback(async () => {
    setLoading(prev => ({ ...prev, overview: true }));
    try {
      const res = await fetch('/api/crm');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('CRM metrics error:', err);
      toast.error('Failed to load CRM metrics');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      if (userRoleFilter !== 'all') params.set('role', userRoleFilter);
      const res = await fetch(`/api/crm/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCrmUsers(data.data || []);
      }
    } catch (err) {
      console.error('CRM users error:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [userSearch, userRoleFilter]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(prev => ({ ...prev, subscriptions: true }));
    try {
      const res = await fetch('/api/crm/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data.subscriptions || []);
        setSubSummary(data.data.summary || { activeCount: 0, monthlyRevenue: 0, churnRate: 0 });
      }
    } catch (err) {
      console.error('CRM subscriptions error:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(prev => ({ ...prev, subscriptions: false }));
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setLoading(prev => ({ ...prev, activity: true }));
    try {
      const params = new URLSearchParams({ page: String(activityPage), perPage: '20' });
      if (activityFilter !== 'all') params.set('action', activityFilter);
      const res = await fetch(`/api/crm/activity?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActivityLog(data.data || []);
        setActivityTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('CRM activity error:', err);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }, [activityFilter, activityPage]);

  const fetchSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      const res = await fetch('/api/crm/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data || []);
      }
    } catch (err) {
      console.error('CRM settings error:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'overview') fetchMetrics();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'subscriptions') fetchSubscriptions();
    else if (activeTab === 'activity') fetchActivity();
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchMetrics, fetchUsers, fetchSubscriptions, fetchActivity, fetchSettings]);

  // Refresh user list when search/filter changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userSearch, userRoleFilter]);

  // Refresh activity when filter changes
  useEffect(() => {
    if (activeTab === 'activity') {
      setActivityPage(1);
      fetchActivity();
    }
  }, [activityFilter]);

  // ---- ACTIONS ----

  const handleUpdateUserRole = async () => {
    if (!editUser || !editUserRole) return;
    setSavingRole(true);
    try {
      const res = await fetch(`/api/crm/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUser.id, role: editUserRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Role updated for ${editUser.full_name || editUser.email}`);
        setEditUser(null);
        fetchUsers();
      } else {
        toast.error(data.error?.message || 'Failed to update role');
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/crm/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Deactivated ${userName}`);
        fetchUsers();
      } else {
        toast.error(data.error?.message || 'Failed to deactivate user');
      }
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const handleSaveSetting = async (settingId: string, newValue: string) => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/crm/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: settingId, value: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Setting saved');
        setEditingSetting(null);
        fetchSettings();
      } else {
        toast.error(data.error?.message || 'Failed to save setting');
      }
    } catch {
      toast.error('Failed to save setting');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleExport = () => {
    toast.success('Export started — file will download shortly');
  };

  // ---- FILTERED DATA ----

  const filteredUsers = crmUsers.filter(u => {
    const matchesSearch = !userSearch ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c9a84c]" />
            Admin CRM Dashboard
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage users, subscriptions, activity, and system settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => {
              if (activeTab === 'overview') fetchMetrics();
              else if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'subscriptions') fetchSubscriptions();
              else if (activeTab === 'activity') fetchActivity();
              else if (activeTab === 'settings') fetchSettings();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm h-auto p-1">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-[#0c1e3c] data-[state=active]:text-white">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs data-[state=active]:bg-[#0c1e3c] data-[state=active]:text-white">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs data-[state=active]:bg-[#0c1e3c] data-[state=active]:text-white">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-[#0c1e3c] data-[state=active]:text-white">
            <Activity className="w-3.5 h-3.5 mr-1.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-[#0c1e3c] data-[state=active]:text-white">
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ====== OVERVIEW TAB ====== */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {loading.overview ? <OverviewSkeleton /> : metrics ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: metrics.totalUsers, icon: Users, iconBg: 'bg-[#0c1e3c]/10 text-[#0c1e3c]', borderAccent: 'border-l-[#0c1e3c]' },
                  { label: 'Active Subscriptions', value: metrics.activeSubscriptions, icon: CreditCard, iconBg: 'bg-emerald-50 text-emerald-600', borderAccent: 'border-l-emerald-500' },
                  { label: 'Monthly Revenue', value: formatZAR(metrics.monthlyRevenue), icon: DollarSign, iconBg: 'bg-[#c9a84c]/10 text-[#a88832]', borderAccent: 'border-l-[#c9a84c]' },
                  { label: 'New Leads', value: metrics.newLeads, icon: UserPlus, iconBg: 'bg-purple-50 text-purple-600', borderAccent: 'border-l-purple-500' },
                ].map(card => (
                  <Card key={card.label} className={`shadow-sm border-l-[3px] ${card.borderAccent} hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                          <card.icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-[#0c1e3c]">{card.value}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{card.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[13px] font-semibold text-[#0c1e3c] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#c9a84c]" /> User Growth (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.userGrowth.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No signup data available</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {metrics.userGrowth.map((entry, idx) => {
                          const maxCount = Math.max(...metrics.userGrowth.map(e => e.count), 1);
                          const pct = (entry.count / maxCount) * 100;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 w-16">{formatSADate(entry.date)}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3">
                                <div
                                  className="bg-[#0c1e3c] rounded-full h-3 transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 4)}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-medium text-[#0c1e3c] w-8 text-right">{entry.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription Breakdown */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[13px] font-semibold text-[#0c1e3c] flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#c9a84c]" /> Subscription Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.subscriptionBreakdown.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No subscription data</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metrics.subscriptionBreakdown.map(item => {
                          const total = metrics.subscriptionBreakdown.reduce((s, d) => s + d.count, 0) || 1;
                          const pct = Math.round((item.count / total) * 100);
                          const colorMap: Record<string, string> = {
                            active: 'bg-emerald-500',
                            past_due: 'bg-amber-500',
                            cancelled: 'bg-red-500',
                            trialing: 'bg-blue-500',
                            expired: 'bg-slate-400',
                          };
                          return (
                            <div key={item.status} className="flex items-center gap-3">
                              <span className="text-[12px] text-slate-600 w-24 capitalize">{item.status.replace(/_/g, ' ')}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div className={`${colorMap[item.status] || 'bg-slate-400'} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[12px] font-medium text-[#0c1e3c] w-16 text-right">{item.count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Funnel */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Lead Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.leadFunnel.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No lead data</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {metrics.leadFunnel.map((stage, idx) => {
                          const maxCount = Math.max(...metrics.leadFunnel.map(s => s.count), 1);
                          const widthPct = (stage.count / maxCount) * 100;
                          const funnelColors = ['bg-[#0c1e3c]', 'bg-[#1a3358]', 'bg-[#2d4a73]', 'bg-[#4a6b94]', 'bg-[#7a94b8]'];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 w-20 truncate capitalize">{stage.stage.replace(/_/g, ' ')}</span>
                              <div className="flex-1 flex justify-center">
                                <div
                                  className={`${funnelColors[idx % funnelColors.length]} rounded h-7 flex items-center justify-center text-white text-[11px] font-medium transition-all`}
                                  style={{ width: `${Math.max(widthPct, 20)}%` }}
                                >
                                  {stage.count}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Case Status */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Case Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.caseStatusBreakdown.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No case data</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {metrics.caseStatusBreakdown.map(item => {
                          const total = metrics.caseStatusBreakdown.reduce((s, d) => s + d.count, 0) || 1;
                          const pct = Math.round((item.count / total) * 100);
                          const colorMap: Record<string, string> = {
                            active: 'bg-emerald-500',
                            pending_review: 'bg-amber-500',
                            in_progress: 'bg-blue-500',
                            closed: 'bg-slate-400',
                            on_hold: 'bg-orange-500',
                            cancelled: 'bg-red-400',
                          };
                          return (
                            <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${colorMap[item.status] || 'bg-slate-400'}`} />
                                <span className="text-[12px] text-slate-700 capitalize">{item.status.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-[#0c1e3c]">{item.count}</span>
                                <span className="text-[10px] text-slate-400">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[13px] font-semibold text-[#0c1e3c]">Recent Activity</CardTitle>
                      <Button variant="ghost" size="sm" className="text-[#c9a84c] text-[11px] h-6" onClick={() => setActiveTab('activity')}>
                        View All <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {metrics.recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-72">
                        <div className="space-y-2">
                          {metrics.recentActivity.slice(0, 10).map(entry => (
                            <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                              <div className="w-7 h-7 rounded-full bg-[#0c1e3c]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {ACTION_ICONS[entry.action] || <Activity className="w-3.5 h-3.5 text-slate-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-medium">{entry.user_name || 'System'}</span>
                                  <span className="text-slate-400"> — </span>
                                  <span className="capitalize">{entry.action.replace(/_/g, ' ')}</span>
                                </div>
                                {entry.details && (
                                  <div className="text-[10px] text-slate-400 truncate">{entry.details}</div>
                                )}
                                <div className="text-[10px] text-slate-300 mt-0.5">{formatTimeAgo(entry.created_at)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Failed to load CRM data</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={fetchMetrics}>Retry</Button>
            </div>
          )}
        </TabsContent>

        {/* ====== USERS TAB ====== */}
        <TabsContent value="users" className="mt-6 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-9 h-9 text-sm"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="managing_director">Managing Director</SelectItem>
                <SelectItem value="senior_partner">Senior Partner</SelectItem>
                <SelectItem value="associate">Associate</SelectItem>
                <SelectItem value="paralegal">Paralegal</SelectItem>
                <SelectItem value="legal_officer">Legal Officer</SelectItem>
                <SelectItem value="candidate_attorney">Candidate Legal Advisor</SelectItem>
                <SelectItem value="systems_admin">Systems Admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loading.users ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No users found</p>
                  <p className="text-[11px] mt-1">Try adjusting your search or filter</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="text-[11px] font-semibold text-slate-500">Name</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Email</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Role</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Subscription</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Joined</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(u => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-[12px] font-medium text-[#0c1e3c]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0c1e3c]/5 flex items-center justify-center text-[10px] font-semibold text-[#0c1e3c]">
                                {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                              </div>
                              {u.full_name || 'Unnamed'}
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px] text-slate-500">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {u.role.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.subscription_plan ? (
                              <Badge className={`text-[10px] ${SUB_STATUS_COLORS[u.subscription_status || ''] || 'bg-slate-100 text-slate-600'}`}>
                                {u.subscription_plan}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-slate-400">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[12px] text-slate-500">{formatSADate(u.created_at)}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-[#0c1e3c]" title="View user">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-[#0c1e3c]">User Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[#0c1e3c] flex items-center justify-center text-white text-sm font-semibold">
                                        {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                                      </div>
                                      <div>
                                        <div className="font-medium text-[#0c1e3c]">{u.full_name || 'Unnamed'}</div>
                                        <div className="text-[12px] text-slate-500">{u.email}</div>
                                      </div>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                                      <div><span className="text-slate-400">Role:</span> <span className="font-medium text-[#0c1e3c] capitalize">{u.role.replace(/_/g, ' ')}</span></div>
                                      <div><span className="text-slate-400">Status:</span> <span className={`font-medium ${u.is_active ? 'text-emerald-600' : 'text-red-600'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></div>
                                      <div><span className="text-slate-400">Joined:</span> <span className="font-medium text-[#0c1e3c]">{formatSADate(u.created_at)}</span></div>
                                      <div><span className="text-slate-400">Plan:</span> <span className="font-medium text-[#0c1e3c]">{u.subscription_plan || 'None'}</span></div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-[#c9a84c]"
                                title="Edit role"
                                onClick={() => { setEditUser(u); setEditUserRole(u.role); }}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                                title="Deactivate"
                                onClick={() => handleDeactivateUser(u.id, u.full_name || u.email)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <div className="text-[11px] text-slate-400 text-right">
            Showing {filteredUsers.length} of {crmUsers.length} users
          </div>
        </TabsContent>

        {/* ====== SUBSCRIPTIONS TAB ====== */}
        <TabsContent value="subscriptions" className="mt-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active Subscriptions', value: subSummary.activeCount, icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600' },
              { label: 'Revenue This Month', value: formatZAR(subSummary.monthlyRevenue), icon: DollarSign, iconBg: 'bg-[#c9a84c]/10 text-[#a88832]' },
              { label: 'Churn Rate', value: `${subSummary.churnRate.toFixed(1)}%`, icon: AlertTriangle, iconBg: subSummary.churnRate > 5 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600' },
            ].map(card => (
              <Card key={card.label} className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0c1e3c]">{card.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{card.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscriptions Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loading.subscriptions ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No subscriptions found</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="text-[11px] font-semibold text-slate-500">User</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Plan</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Amount</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Period Start</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Period End</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Cycle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map(sub => (
                        <TableRow key={sub.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-[12px]">
                            <div className="font-medium text-[#0c1e3c]">{sub.user_name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400">{sub.user_email}</div>
                          </TableCell>
                          <TableCell className="text-[12px] font-medium text-[#0c1e3c]">{sub.plan_name}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${SUB_STATUS_COLORS[sub.status] || 'bg-slate-100 text-slate-600'}`}>
                              {sub.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[12px] font-medium text-[#0c1e3c]">{formatZAR(sub.amount)}</TableCell>
                          <TableCell className="text-[12px] text-slate-500">{formatSADate(sub.current_period_start)}</TableCell>
                          <TableCell className="text-[12px] text-slate-500">{formatSADate(sub.current_period_end)}</TableCell>
                          <TableCell className="text-[12px] text-slate-500 capitalize">{sub.billing_cycle}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== ACTIVITY TAB ====== */}
        <TabsContent value="activity" className="mt-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48 h-9 text-sm">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="subscription_change">Subscription Change</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="case_update">Case Update</SelectItem>
                  <SelectItem value="document_upload">Document Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-[11px] text-slate-400 ml-auto">
              {activityTotal} total entries · Page {activityPage}
            </div>
          </div>

          {/* Activity Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loading.activity ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              ) : activityLog.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No activity log entries</p>
                  <p className="text-[11px] mt-1">Activity will appear here as users interact with the system</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="text-[11px] font-semibold text-slate-500">Timestamp</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">User</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Action</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Resource</TableHead>
                        <TableHead className="text-[11px] font-semibold text-slate-500">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLog.map(entry => (
                        <TableRow key={entry.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-[11px] text-slate-500 whitespace-nowrap">
                            <Clock className="w-3 h-3 inline mr-1 text-slate-300" />
                            {formatSADate(entry.created_at)} {new Date(entry.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-[12px] font-medium text-[#0c1e3c]">
                            {entry.user_name || 'System'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {ACTION_ICONS[entry.action] || <Activity className="w-3.5 h-3.5 text-slate-400" />}
                              <span className="text-[11px] capitalize">{entry.action.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                              {entry.resource_type}
                              {entry.resource_id && <span className="text-slate-300 ml-1">#{entry.resource_id.slice(0, 6)}</span>}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-500 max-w-48 truncate">
                            {entry.details || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {activityTotal > 20 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={activityPage <= 1}
                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-[11px] text-slate-500">Page {activityPage} of {Math.ceil(activityTotal / 20)}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={activityPage >= Math.ceil(activityTotal / 20)}
                onClick={() => setActivityPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ====== SETTINGS TAB ====== */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          {loading.settings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-3 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No settings configured</p>
              <p className="text-[11px] mt-1">System settings will appear here when configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.map(setting => (
                <Card key={setting.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[12px] font-semibold text-[#0c1e3c]">{setting.key}</Label>
                      {setting.type === 'boolean' && (
                        <Switch
                          checked={setting.value === 'true'}
                          onCheckedChange={(checked) => handleSaveSetting(setting.id, String(checked))}
                          disabled={settingsSaving}
                        />
                      )}
                    </div>

                    {setting.description && (
                      <p className="text-[10px] text-slate-400 mb-3">{setting.description}</p>
                    )}

                    {setting.type === 'boolean' ? (
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${setting.value === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {setting.value === 'true' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {setting.value === 'true' ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ) : editingSetting === setting.id ? (
                      <div className="space-y-2">
                        {setting.type === 'json' ? (
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-[12px] min-h-[60px]"
                          />
                        ) : (
                          <Input
                            type={setting.type === 'number' ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-[12px] h-8"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-[#0c1e3c] hover:bg-[#0c1e3c]/90"
                            disabled={settingsSaving}
                            onClick={() => handleSaveSetting(setting.id, editValue)}
                          >
                            {settingsSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => setEditingSetting(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] bg-slate-50 px-2 py-1 rounded border text-slate-700 flex-1 truncate">
                          {setting.value}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-[#c9a84c]"
                          onClick={() => { setEditingSetting(setting.id); setEditValue(setting.value); }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    <div className="text-[9px] text-slate-300 mt-2">
                      Last updated: {formatSADate(setting.updated_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== EDIT ROLE DIALOG ====== */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#0c1e3c]">Edit Role — {editUser.full_name || editUser.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-[12px] text-slate-600 mb-1.5 block">Current Role</Label>
                <Badge variant="outline" className={`text-[11px] ${ROLE_COLORS[editUser.role] || ''}`}>
                  {editUser.role.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-[12px] text-slate-600 mb-1.5 block">New Role</Label>
                <Select value={editUserRole} onValueChange={setEditUserRole}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="managing_director">Managing Director</SelectItem>
                    <SelectItem value="senior_partner">Senior Partner</SelectItem>
                    <SelectItem value="associate">Associate</SelectItem>
                    <SelectItem value="paralegal">Paralegal</SelectItem>
                    <SelectItem value="legal_officer">Legal Officer</SelectItem>
                    <SelectItem value="supervising_officer">Supervising Officer</SelectItem>
                    <SelectItem value="senior_consultant">Senior Consultant</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="candidate_attorney">Candidate Legal Advisor</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="office_administrator">Office Administrator</SelectItem>
                    <SelectItem value="systems_admin">Systems Admin</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm" className="text-xs">Cancel</Button>
              </DialogClose>
              <Button
                size="sm"
                className="text-xs bg-[#0c1e3c] hover:bg-[#0c1e3c]/90"
                disabled={savingRole || editUserRole === editUser.role}
                onClick={handleUpdateUserRole}
              >
                {savingRole ? 'Saving...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-6 w-20 mt-3" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
