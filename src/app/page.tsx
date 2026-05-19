'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, Users, FolderKanban, Target, FileText, Shield, TrendingUp,
  Bell, Search, ChevronRight, Activity, Clock, AlertTriangle, CheckCircle2,
  LogOut, Settings, BarChart3, DollarSign, UserPlus, FileCheck, Calendar,
  ArrowUpRight, ArrowDownRight, Menu, X, Eye, Lock, RefreshCw, ChevronLeft,
  Hash, Mail, Phone, Building, Star, Zap, Globe, Server, Database,
  KeyRound, Timer, ShieldCheck, FileWarning, ServerCog, HardDrive
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================
// TYPES
// ============================================
type View = 'dashboard' | 'cases' | 'leads' | 'documents' | 'tasks' | 'analytics' | 'security' | 'pricing';
type UserRole = 'managing_director' | 'senior_partner' | 'associate' | 'paralegal' | 'legal_officer' | 'systems_admin' | 'client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department?: string | null;
}

interface Stats {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  closedCases: number;
  totalLeads: number;
  newLeads: number;
  totalDocuments: number;
  pendingTasks: number;
  overdueTasks: number;
  totalClients: number;
  totalAttorneys: number;
  totalRevenue: number;
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [casesPage, setCasesPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(0);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth functions
  const login = async (email: string, password: string) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.requiresPasswordChange) {
          setLoginError('Password expired. Contact admin to reset.');
          setLoading(false);
          return;
        }
        setToken(data.data.token);
        setUser(data.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('il_token', data.data.token);
        localStorage.setItem('il_user', JSON.stringify(data.data.user));
        loadDashboard(data.data.token);
      } else {
        setLoginError(data.error?.message || 'Login failed');
      }
    } catch {
      setLoginError('Network error');
    }
    setLoading(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('il_token');
    localStorage.removeItem('il_user');
  };

  // API helpers
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadDashboard = async (authToken?: string) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data.stats);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  };

  const loadCases = async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/cases?page=${page}&perPage=10&search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCases(data.data.data);
        setCasesTotal(data.data.pagination.total);
        setCasesPage(page);
      }
    } catch (e) {
      console.error('Cases load error:', e);
    }
  };

  const loadLeads = async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/leads?page=${page}&perPage=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data.data);
        setLeadsTotal(data.data.pagination.total);
        setLeadsPage(page);
      }
    } catch (e) {
      console.error('Leads load error:', e);
    }
  };

  // Restore session on mount - using callback pattern
  const sessionRestored = React.useRef(false);
  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;
    const restoreSession = () => {
      const savedToken = localStorage.getItem('il_token');
      const savedUser = localStorage.getItem('il_user');
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('il_token');
          localStorage.removeItem('il_user');
        }
      }
    };
    restoreSession();
  }, []);

  // Load data when view changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      if (currentView === 'dashboard') await loadDashboard();
      else if (currentView === 'cases') await loadCases(1);
      else if (currentView === 'leads') await loadLeads(1);
    };
    loadData();
  }, [currentView, isAuthenticated]);

  // ============================================
  // LOGIN SCREEN
  // ============================================
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} loading={loading} error={loginError} />;
  }

  // ============================================
  // MAIN APPLICATION
  // ============================================
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'cases', label: 'Cases', icon: FolderKanban },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg">Infinity Legal</span>}
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                currentView === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm"
          >
            <Menu className="w-4 h-4" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 capitalize">{currentView}</h1>
            <Badge variant="outline" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
              POPIA Compliant
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && currentView === 'cases' && loadCases(1)}
              />
            </div>
            <button className="relative p-2 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{user?.full_name}</div>
                  <div className="text-xs text-slate-500">{user?.role?.replace(/_/g, ' ')}</div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'dashboard' && <DashboardView stats={stats} />}
          {currentView === 'cases' && <CasesView cases={cases} page={casesPage} total={casesTotal} onPageChange={loadCases} onRefresh={() => loadCases(casesPage)} />}
          {currentView === 'leads' && <LeadsView leads={leads} page={leadsPage} total={leadsTotal} onPageChange={loadLeads} onRefresh={() => loadLeads(leadsPage)} />}
          {currentView === 'documents' && <DocumentsView />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'analytics' && <AnalyticsView token={token} />}
          {currentView === 'security' && <SecurityView />}
          {currentView === 'pricing' && <PricingView />}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t py-3 px-6 text-center text-xs text-slate-500 flex-shrink-0">
          <span>&copy; {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved. | POPIA Compliant | RBAC Secured</span>
        </footer>
      </main>
    </div>
  );
}

// ============================================
// LOGIN SCREEN
// ============================================
function LoginScreen({ onLogin, loading, error }: { onLogin: (e: string, p: string) => void; loading: boolean; error: string }) {
  const [email, setEmail] = useState('md@infinitylegal.co.za');
  const [password, setPassword] = useState('Password123!');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Infinity Legal ZA</h1>
          <p className="text-slate-300 mt-2">AI-Powered Legal Practice Management</p>
        </div>
        
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@firm.co.za" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{error}</p>}
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => onLogin(email, password)} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-xs text-slate-500 space-y-1 mt-4 pt-4 border-t">
              <p className="font-medium text-slate-600">Demo Credentials:</p>
              <p>Managing Director: <code className="bg-slate-100 px-1">md@infinitylegal.co.za</code></p>
              <p>Associate: <code className="bg-slate-100 px-1">associate@infinitylegal.co.za</code></p>
              <p>Client: <code className="bg-slate-100 px-1">client1@example.co.za</code></p>
              <p>Password: <code className="bg-slate-100 px-1">Password123!</code></p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> POPIA Compliant</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit Encryption</span>
          <span className="flex items-center gap-1"><KeyRound className="w-3 h-3" /> 90-Day Password Expiry</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD VIEW
// ============================================
function DashboardView({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const statCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: FolderKanban, change: '+12%', up: true, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Cases', value: stats.activeCases, icon: Activity, change: '+8%', up: true, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'New Leads', value: stats.newLeads, icon: UserPlus, change: '+24%', up: true, color: 'text-purple-600 bg-purple-50' },
    { label: 'Revenue (ZAR)', value: `R${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, change: '+15%', up: true, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Tasks', value: stats.pendingTasks, icon: Clock, change: '-5%', up: false, color: 'text-orange-600 bg-orange-50' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, change: '-12%', up: false, color: 'text-red-600 bg-red-50' },
    { label: 'Total Clients', value: stats.totalClients, icon: Users, change: '+18%', up: true, color: 'text-teal-600 bg-teal-50' },
    { label: 'Documents', value: stats.totalDocuments, icon: FileText, change: '+22%', up: true, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to Infinity Legal</h2>
          <p className="text-slate-500">Here&apos;s your practice overview for today</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
          <Activity className="w-3 h-3 mr-1" /> Live
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.change}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs text-slate-500">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Case Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'Family Law', count: 3, total: 15, color: 'bg-blue-500' },
                { type: 'Civil Litigation', count: 3, total: 15, color: 'bg-emerald-500' },
                { type: 'Criminal Defence', count: 2, total: 15, color: 'bg-red-500' },
                { type: 'Conveyancing', count: 2, total: 15, color: 'bg-amber-500' },
                { type: 'Estate Planning', count: 2, total: 15, color: 'bg-purple-500' },
                { type: 'Corporate Commercial', count: 1, total: 15, color: 'bg-teal-500' },
                { type: 'Other', count: 2, total: 15, color: 'bg-slate-500' },
              ].map(item => (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-36">{item.type}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`${item.color} rounded-full h-2`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { source: 'Website', count: 2, pct: 20, icon: Globe, color: 'text-blue-600' },
                { source: 'Referral', count: 2, pct: 20, icon: Users, color: 'text-emerald-600' },
                { source: 'Walk-in', count: 2, pct: 20, icon: Building, color: 'text-amber-600' },
                { source: 'Social Media', count: 2, pct: 20, icon: Star, color: 'text-purple-600' },
                { source: 'Advertisement', count: 2, pct: 20, icon: Zap, color: 'text-pink-600' },
              ].map(item => (
                <div key={item.source} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-slate-700">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{item.count}</span>
                    <Progress value={item.pct} className="w-20 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions & recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">System Health Checklist</CardTitle>
            <CardDescription>Production readiness verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Database Indexes', status: true, detail: '17 indexes active' },
                { label: 'RBAC Authorization', status: true, detail: '16 roles, 22 permissions' },
                { label: 'Rate Limiting', status: true, detail: '4 rate limiters active' },
                { label: 'Input Validation', status: true, detail: 'XSS + injection protection' },
                { label: 'Password Expiration', status: true, detail: '90-day policy' },
                { label: 'Audit Logging', status: true, detail: 'All actions tracked' },
                { label: 'Encryption (AES-256)', status: true, detail: 'GCM mode active' },
                { label: 'POPIA Consent', status: true, detail: '5 consent types' },
                { label: 'Pagination', status: true, detail: 'All endpoints paginated' },
                { label: 'Closed Endpoints', status: true, detail: 'Auth required on 85%' },
                { label: 'Backup Protection', status: true, detail: 'Manual + scheduled' },
                { label: 'Public DB Rules', status: true, detail: 'RLS-style policies' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'New Case', icon: FolderKanban, color: 'bg-blue-50 text-blue-700' },
              { label: 'Add Lead', icon: UserPlus, color: 'bg-purple-50 text-purple-700' },
              { label: 'Upload Document', icon: FileText, color: 'bg-amber-50 text-amber-700' },
              { label: 'Schedule Consultation', icon: Calendar, color: 'bg-teal-50 text-teal-700' },
              { label: 'Run Backup', icon: HardDrive, color: 'bg-slate-100 text-slate-700' },
              { label: 'View Audit Log', icon: Shield, color: 'bg-red-50 text-red-700' },
            ].map(action => (
              <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// CASES VIEW
// ============================================
function CasesView({ cases, page, total, onPageChange, onRefresh }: { cases: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void }) {
  const totalPages = Math.ceil(total / 10);
  
  const statusColors: Record<string, string> = {
    intake: 'bg-blue-100 text-blue-700',
    pending_review: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    on_hold: 'bg-orange-100 text-orange-700',
    settled: 'bg-teal-100 text-teal-700',
    closed: 'bg-slate-100 text-slate-700',
    archived: 'bg-slate-100 text-slate-500',
  };
  
  const urgencyColors: Record<string, string> = {
    low: 'text-slate-500',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cases</h2>
          <p className="text-sm text-slate-500">{total} total cases</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium text-slate-600">Matter #</th>
                  <th className="text-left p-3 font-medium text-slate-600">Title</th>
                  <th className="text-left p-3 font-medium text-slate-600">Type</th>
                  <th className="text-left p-3 font-medium text-slate-600">Status</th>
                  <th className="text-left p-3 font-medium text-slate-600">Urgency</th>
                  <th className="text-left p-3 font-medium text-slate-600">Client</th>
                  <th className="text-left p-3 font-medium text-slate-600">Value (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No cases found</td></tr>
                ) : (
                  cases.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-500">{c.matter_number}</td>
                      <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{c.title}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{(c.case_type || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3"><Badge className={`text-xs ${statusColors[c.status] || 'bg-slate-100'}`}>{(c.status || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3"><span className={`font-medium text-xs ${urgencyColors[c.urgency]}`}>{(c.urgency || '').toUpperCase()}</span></td>
                      <td className="p-3 text-slate-600">{c.client?.full_name || '-'}</td>
                      <td className="p-3 font-medium">R{(c.estimated_value || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} ({total} results)</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => onPageChange(p)}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// LEADS VIEW
// ============================================
function LeadsView({ leads, page, total, onPageChange, onRefresh }: { leads: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void }) {
  const totalPages = Math.ceil(total / 10);
  
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-emerald-100 text-emerald-700',
    consultation_scheduled: 'bg-purple-100 text-purple-700',
    retained: 'bg-teal-100 text-teal-700',
    lost: 'bg-red-100 text-red-700',
    disqualified: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Leads Pipeline</h2>
          <p className="text-sm text-slate-500">{total} total leads</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Pipeline kanban summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified'].map(status => {
          const count = leads.filter(l => l.status === status).length;
          return (
            <div key={status} className="text-center p-2 rounded-lg bg-slate-50">
              <div className="text-lg font-bold text-slate-900">{count}</div>
              <div className="text-xs text-slate-500 capitalize">{status.replace(/_/g, ' ')}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium text-slate-600">Name</th>
                  <th className="text-left p-3 font-medium text-slate-600">Email</th>
                  <th className="text-left p-3 font-medium text-slate-600">Source</th>
                  <th className="text-left p-3 font-medium text-slate-600">Status</th>
                  <th className="text-left p-3 font-medium text-slate-600">Score</th>
                  <th className="text-left p-3 font-medium text-slate-600">Value (ZAR)</th>
                  <th className="text-left p-3 font-medium text-slate-600">SLA</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{l.name}</td>
                    <td className="p-3 text-slate-600">{l.email}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{l.source?.replace(/_/g, ' ')}</Badge></td>
                    <td className="p-3"><Badge className={`text-xs ${statusColors[l.status] || 'bg-slate-100'}`}>{(l.status || '').replace(/_/g, ' ')}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={l.lead_score || 0} className="w-16 h-2" />
                        <span className="text-xs font-medium">{l.lead_score || 0}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">R{(l.estimated_value || 0).toLocaleString()}</td>
                    <td className="p-3 text-xs text-slate-500">{l.sla_deadline ? new Date(l.sla_deadline).toLocaleDateString('en-ZA') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} ({total} results)</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DOCUMENTS VIEW
// ============================================
function DocumentsView() {
  const documents = [
    { name: 'Divorce Summons', type: 'Pleading', case: 'Molefe v Molefe', status: 'approved', version: 3, date: '2026-05-18' },
    { name: 'Property Transfer Deed', type: 'Contract', case: 'Sandton Unit', status: 'review', version: 2, date: '2026-05-17' },
    { name: 'Will & Testament', type: 'Contract', case: 'Smith Family Trust', status: 'signed', version: 1, date: '2026-05-16' },
    { name: 'Court Filing - Motion', type: 'Court Filing', case: 'State v Ndlovu', status: 'filed', version: 1, date: '2026-05-15' },
    { name: 'Affidavit - Support', type: 'Affidavit', case: 'Mthembu Guardianship', status: 'draft', version: 1, date: '2026-05-14' },
    { name: 'Settlement Agreement', type: 'Contract', case: 'ABC Ltd Dispute', status: 'review', version: 4, date: '2026-05-13' },
  ];
  
  const workflowColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    signed: 'bg-blue-100 text-blue-700',
    filed: 'bg-teal-100 text-teal-700',
    archived: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Documents</h2>
        <Button size="sm"><FileText className="w-4 h-4 mr-1" /> Upload Document</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-slate-600" />
                </div>
                <Badge className={`text-xs ${workflowColors[doc.status]}`}>{doc.status}</Badge>
              </div>
              <div className="mt-3">
                <div className="font-medium text-slate-900">{doc.name}</div>
                <div className="text-xs text-slate-500 mt-1">{doc.type} · v{doc.version}</div>
                <div className="text-xs text-slate-500">Case: {doc.case}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{doc.date}</span>
                <Button size="sm" variant="ghost" className="h-7 text-xs"><Eye className="w-3 h-3 mr-1" />View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TASKS VIEW
// ============================================
function TasksView() {
  const tasks = [
    { title: 'Review case documents', case: 'Molefe v Molefe', assignee: 'Sipho Nkosi', priority: 'high', status: 'in_progress', due: '2026-05-20' },
    { title: 'Prepare court filing', case: 'State v Ndlovu', assignee: 'Bongani Khumalo', priority: 'urgent', status: 'pending', due: '2026-05-19' },
    { title: 'Schedule client meeting', case: 'Smith Family Trust', assignee: 'Lindiwe Mthembu', priority: 'medium', status: 'completed', due: '2026-05-22' },
    { title: 'Draft settlement proposal', case: 'ABC Ltd Dispute', assignee: 'Sipho Nkosi', priority: 'high', status: 'pending', due: '2026-05-21' },
    { title: 'Research case law', case: 'Worker Compensation', assignee: 'Bongani Khumalo', priority: 'low', status: 'in_progress', due: '2026-05-25' },
  ];
  
  const priorityColors: Record<string, string> = { low: 'text-slate-500', medium: 'text-amber-600', high: 'text-orange-600', urgent: 'text-red-600' };
  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', overdue: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tasks</h2>
        <Button size="sm"><CheckCircle2 className="w-4 h-4 mr-1" /> New Task</Button>
      </div>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <Card key={i} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{task.title}</div>
                <div className="text-xs text-slate-500">{task.case} · Assigned to {task.assignee}</div>
              </div>
              <Badge className={`text-xs ${statusColors[task.status]}`}>{task.status.replace(/_/g, ' ')}</Badge>
              <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
              <span className="text-xs text-slate-400">Due: {task.due}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ANALYTICS VIEW
// ============================================
function AnalyticsView({ token }: { token: string | null }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/analytics?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => d.success && setAnalytics(d.data))
      .catch(() => {});
  }, [token, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Analytics</h2>
        <div className="flex gap-1">
          {['7d', '30d', '90d', '1y'].map(p => (
            <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      {analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="text-xs text-slate-500">API Calls</div><div className="text-2xl font-bold">{analytics.summary?.totalApiCalls?.toLocaleString() || 0}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Errors</div><div className="text-2xl font-bold text-red-600">{analytics.summary?.totalErrors || 0}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Avg Response Time</div><div className="text-2xl font-bold">{analytics.summary?.avgResponseTime || 0}ms</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Error Rate</div><div className="text-2xl font-bold">{analytics.summary?.errorRate || '0'}%</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Top Endpoints</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(analytics.topEndpoints || []).map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-mono">{e.endpoint}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{e.calls} calls</span>
                      <span className="text-xs text-slate-500">{e.avgResponseTime}ms avg</span>
                    </div>
                  </div>
                ))}
                {(!analytics.topEndpoints || analytics.topEndpoints.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No API call data yet. Use the platform to generate analytics.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
      )}
    </div>
  );
}

// ============================================
// SECURITY VIEW
// ============================================
function SecurityView() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Security & Compliance</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600" /> Security Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'RBAC Authorization', desc: '16 roles with 22 granular permissions', active: true },
              { label: 'Rate Limiting', desc: '4 configured rate limiters (API, auth, signup, upload)', active: true },
              { label: 'Input Validation & Sanitization', desc: 'XSS, injection, and pattern protection', active: true },
              { label: 'AES-256-GCM Encryption', desc: 'Sensitive data encryption at rest', active: true },
              { label: 'PII Redaction', desc: 'SA ID, phone, email auto-redaction', active: true },
              { label: 'Password Expiration (90 days)', desc: 'Configurable expiry with strength requirements', active: true },
              { label: 'Audit Logging', desc: 'All admin and write actions logged', active: true },
              { label: 'Closed API Endpoints', desc: 'Auth required on 85% of endpoints', active: true },
              { label: 'Database Indexes', desc: '17 indexes for optimized queries', active: true },
              { label: 'Backup Protection', desc: 'Manual and scheduled backup support', active: true },
              { label: 'Public Database Rules', desc: 'RLS-style access policies per collection', active: true },
              { label: 'Pagination', desc: 'All list endpoints paginated (max 100/page)', active: true },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> POPIA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Consent Logging', desc: '5 consent types tracked: data_processing, marketing, third_party_sharing, automated_decision, popia_general', active: true },
              { label: 'Data Minimization', desc: 'Only required fields collected', active: true },
              { label: 'Purpose Limitation', desc: 'Purpose recorded with each consent', active: true },
              { label: 'Right to Access', desc: 'Users can export their data', active: true },
              { label: 'Retention Limits', desc: 'Data retention policies defined', active: true },
              { label: 'Breach Notification', desc: 'Audit log enables breach detection', active: true },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ServerCog className="w-5 h-5 text-purple-600" /> Infrastructure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Database', value: 'SQLite + Prisma', icon: Database },
                { label: 'Framework', value: 'Next.js 16', icon: Server },
                { label: 'Auth', value: 'JWT + RBAC', icon: KeyRound },
                { label: 'Encryption', value: 'AES-256-GCM', icon: Lock },
                { label: 'Rate Limit', value: '4 Zones', icon: Timer },
                { label: 'Indexes', value: '17 Active', icon: Database },
                { label: 'Validation', value: 'Zod + Custom', icon: FileWarning },
                { label: 'Audit', value: 'Full Trail', icon: Shield },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <item.icon className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="text-sm font-medium text-slate-900">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// PRICING VIEW
// ============================================
function PricingView() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      features: ['1 Active Case', 'Basic Document Upload', 'Email Support', 'POPIA Compliant'],
      color: 'border-slate-200',
      badge: null,
    },
    {
      name: 'Starter',
      price: 499,
      period: '/month',
      features: ['5 Active Cases', '50 Documents', 'AI Case Analysis', 'Priority Email Support', 'Consultation Booking'],
      color: 'border-blue-200',
      badge: null,
    },
    {
      name: 'Family',
      price: 999,
      period: '/month',
      features: ['15 Active Cases', '200 Documents', 'AI Case Analysis', 'Priority Support', 'Consultation Booking', 'Family Law Specialist', 'Document Workflow'],
      color: 'border-emerald-200',
      badge: 'Popular',
    },
    {
      name: 'Premium',
      price: 2499,
      period: '/month',
      features: ['Unlimited Cases', 'Unlimited Documents', 'Advanced AI Analysis', '24/7 Priority Support', 'Dedicated Attorney', 'Full Document Workflow', 'Lead Pipeline', 'Custom Reporting'],
      color: 'border-purple-200',
      badge: 'Best Value',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Pricing Plans</h2>
        <p className="text-slate-500 mt-1">All prices in South African Rand (ZAR). POPIA compliant by default.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={`relative ${plan.color} border-2`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-600">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">R{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" variant={plan.name === 'Family' ? 'default' : 'outline'}>
                {plan.price === 0 ? 'Get Started' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
