'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Users, FolderKanban, Target, FileText, Shield, TrendingUp,
  Bell, Search, ChevronRight, Activity, Clock, AlertTriangle, CheckCircle2,
  LogOut, DollarSign, UserPlus, FileCheck,
  ArrowUpRight, Menu, X, Eye, Lock, RefreshCw, ChevronLeft,
  Mail, Phone, Building, Star, Zap,
  KeyRound, ShieldCheck, Upload, Plus,
  BookOpen, Briefcase, Crown, MessageSquare, LayoutDashboard,
  Gavel, Landmark, PhoneCall, Video, MapPin,
  Clock3, FileUp,
  Send, AlertCircle, TreePine,
  Home as HomeIcon, ArrowLeft, Scale, Heart, Handshake, Sparkles
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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { LandingPage } from '@/components/LandingPage';
import { LoginScreen } from '@/components/LoginScreen';

// ============================================
// TYPES
// ============================================
type View = 'workbench' | 'cases' | 'leads' | 'documents' | 'consultations' | 'tasks' | 'staff' | 'analytics' | 'pricing' | 'org-chart';
type UserRole = 'managing_director' | 'senior_partner' | 'associate' | 'paralegal' | 'legal_officer' | 'supervising_officer' | 'senior_consultant' | 'consultant' | 'candidate_attorney' | 'hr_manager' | 'finance_manager' | 'office_administrator' | 'systems_admin' | 'receptionist' | 'client' | 'guest';

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

interface Consultation {
  id: string;
  client_id: string;
  attorney_id: string;
  case_id?: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  notes?: string | null;
  meeting_type: string;
  client?: { full_name: string | null; email: string };
  attorney?: { full_name: string | null; email: string };
  case?: { title: string; matter_number: string } | null;
  created_at: string;
}

interface DocumentItem {
  id: string;
  title: string;
  case_id: string;
  document_type: string;
  workflow_status: string;
  version: number;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  prepared_by?: string | null;
  created_at: string;
  case?: { title: string; matter_number: string };
  prepared_by_user?: { full_name: string | null };
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  case_id?: string | null;
  assigned_to: string;
  created_by: string;
  priority: string;
  status: string;
  due_date?: string | null;
  completed_date?: string | null;
  assignee?: { full_name: string | null };
  creator?: { full_name: string | null };
  case?: { title: string } | null;
  created_at: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  is_active: boolean;
  supervisor?: { full_name: string | null; role: string } | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================
// MAIN APP COMPONENT (Client-side)
// ============================================
export default function HomePageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('workbench');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [firmHealth, setFirmHealth] = useState<Record<string, boolean>>({});
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [casesPage, setCasesPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(0);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

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
        setShowLogin(false);
        setShowLanding(false);
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

  const loadDashboard = async (authToken?: string) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setCharts(data.data.charts || null);
        setFirmHealth(data.data.health || {});
      }
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

  const loadConsultations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/consultations?perPage=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConsultations(data.data.data || []);
    } catch (e) {
      console.error('Consultations load error:', e);
    }
  };

  const loadDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/documents?perPage=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDocuments(data.data.data || []);
    } catch (e) {
      console.error('Documents load error:', e);
    }
  };

  const loadTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tasks?perPage=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTasks(data.data.data || []);
    } catch (e) {
      console.error('Tasks load error:', e);
    }
  };

  const loadStaff = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff?perPage=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStaff(data.data.data || []);
    } catch (e) {
      console.error('Staff load error:', e);
    }
  };

  const loadPricingPlans = async () => {
    try {
      const res = await fetch('/api/pricing');
      const data = await res.json();
      if (data.success) setPricingPlans(data.data || []);
    } catch (e) {
      console.error('Pricing load error:', e);
    }
  };

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications?perPage=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data.data || []);
    } catch (e) {
      console.error('Notifications load error:', e);
    }
  };

  // Restore session on mount
  const sessionRestored = useRef(false);
  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;
    const savedToken = localStorage.getItem('il_token');
    const savedUser = localStorage.getItem('il_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Use startTransition to avoid cascading renders
        React.startTransition(() => {
          setToken(savedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setShowLanding(false);
        });
      } catch {
        localStorage.removeItem('il_token');
        localStorage.removeItem('il_user');
      }
    }
  }, []);

  // Load data when view changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      if (currentView === 'workbench' || currentView === 'analytics') await loadDashboard();
      else if (currentView === 'cases') await loadCases(1);
      else if (currentView === 'leads') await loadLeads(1);
      else if (currentView === 'consultations') await loadConsultations();
      else if (currentView === 'documents') await loadDocuments();
      else if (currentView === 'tasks') await loadTasks();
      else if (currentView === 'staff' || currentView === 'org-chart') await loadStaff();
      else if (currentView === 'pricing') await loadPricingPlans();
    };
    loadData();
  }, [currentView, isAuthenticated]);

  // Load notifications on auth (wrapped in async IIFE to avoid setState-in-effect lint)
  useEffect(() => {
    if (isAuthenticated && token) {
      void (async () => {
        try {
          await loadNotifications();
        } catch { /* ignore */ }
      })();
    }
  }, [isAuthenticated, token]);

  // Role-based navigation
  const getNavItems = () => {
    const role = user?.role || 'client';
    const isManagement = ['managing_director', 'senior_partner', 'supervising_officer', 'systems_admin'].includes(role);
    const isLegal = ['associate', 'legal_officer', 'candidate_attorney', 'senior_consultant', 'consultant'].includes(role);
    const isParalegal = role === 'paralegal';
    const isSales = ['receptionist', 'office_administrator'].includes(role);
    const isFinance = ['finance_manager', 'hr_manager'].includes(role);
    const isClient = role === 'client';

    const items: { id: View; label: string; icon: any; group: string }[] = [
      { id: 'workbench', label: 'Workbench', icon: LayoutDashboard, group: 'Main' },
    ];

    // Cases — all roles can see (clients see their own cases, staff see all/assigned)
    items.push({ id: 'cases', label: 'Cases', icon: FolderKanban, group: 'Practice' });
    items.push({ id: 'consultations', label: 'Consultations', icon: BookOpen, group: 'Practice' });

    // Leads — only staff who manage leads
    if (isManagement || isSales || isLegal) {
      items.push({ id: 'leads', label: 'Leads', icon: Target, group: 'Practice' });
    }

    // Documents & Tasks — all roles (clients see own, staff see all/assigned)
    items.push({ id: 'documents', label: 'Documents', icon: FileText, group: 'Practice' });
    items.push({ id: 'tasks', label: 'Tasks', icon: CheckCircle2, group: 'Practice' });

    // Staff & Org — internal only, not for clients
    if (isManagement || isLegal || isParalegal || isFinance) {
      items.push({ id: 'staff', label: 'Staff Portal', icon: Users, group: 'Firm' });
      items.push({ id: 'org-chart', label: 'Org Structure', icon: TreePine, group: 'Firm' });
    }

    // Analytics — management only
    if (isManagement) {
      items.push({ id: 'analytics', label: 'Analytics', icon: TrendingUp, group: 'Firm' });
    }

    items.push({ id: 'pricing', label: 'Pricing', icon: DollarSign, group: 'More' });

    return items;
  };

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <LoginScreen
          onLogin={login}
          loading={loading}
          error={loginError}
          onBackToHome={() => setShowLogin(false)}
        />
      );
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  if (showLanding) {
    return (
      <LandingPage
        isAuthenticated={true}
        onBackToDashboard={() => setShowLanding(false)}
        userName={user?.full_name?.split(' ')[0]}
      />
    );
  }

  const navItems = getNavItems();
  const navGroups = [...new Set(navItems.map(i => i.group))];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#0c1e3c] text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-[#1a3358] cursor-pointer hover:bg-[#132d52]/50 transition-colors rounded-t-lg" onClick={() => setShowLanding(true)} title="Visit Homepage">
          <Image src="/infinity_logo.png" alt="Infinity Legal SA" width={36} height={20} className="flex-shrink-0 object-contain" />
          {sidebarOpen && (
            <div>
              <span className="font-bold text-lg tracking-tight">Infinity Legal</span>
              <p className="text-[10px] text-[#7a8fb0] uppercase tracking-widest">Intranet Portal</p>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {/* Homepage Link */}
            <button
              onClick={() => setShowLanding(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-[#c9a84c] hover:bg-[#132d52] hover:text-[#c9a84c] border border-[#c9a84c]/20 mb-2"
            >
              <HomeIcon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Visit Homepage</span>}
            </button>
            {navGroups.map(group => (
              <div key={group}>
                {sidebarOpen && group !== navGroups[0] && (
                  <div className="px-3 pt-4 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7a94b8]">{group}</span>
                  </div>
                )}
                {navItems.filter(i => i.group === group).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    aria-label={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentView === item.id
                        ? 'bg-[#c9a84c] text-[#0c1e3c] font-semibold'
                        : 'text-[#8fa4c4] hover:bg-[#132d52] hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-[#1a3358]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#7a94b8] hover:bg-[#132d52] hover:text-white text-sm"
          >
            <Menu className="w-4 h-4" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowLanding(true)} className="text-[#0c1e3c] hover:bg-[#0c1e3c]/5 gap-1.5 h-8" title="Visit Homepage">
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Homepage</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-base font-semibold text-[#0c1e3c] capitalize">{currentView.replace('-', ' ')}</h1>
            <Badge variant="outline" className="text-[10px] border-[#c9a84c] text-[#a88832]">
              <ShieldCheck className="w-3 h-3 mr-1" />
              POPIA Compliant
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search..."
                aria-label="Search cases and documents"
                className="pl-9 w-56 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && currentView === 'cases' && loadCases(1)}
              />
            </div>
            <div className="relative">
              <button
                className="relative p-2 hover:bg-slate-100 rounded-lg"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#c9a84c] rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white border shadow-xl rounded-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#0c1e3c]">Notifications</span>
                    <div className="flex items-center gap-1">
                      {notifications.some(n => !n.is_read) && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-[#a88832]" onClick={async () => {
                          try {
                            await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                          } catch { /* ignore */ }
                        }}>
                          Mark all read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNotifications(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`p-3 border-b hover:bg-slate-50 cursor-pointer ${!n.is_read ? 'bg-[#c9a84c]/5' : ''}`} onClick={async () => {
                        if (!n.is_read) {
                          try {
                            await fetch('/api/notifications', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ notification_id: n.id }) });
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                          } catch { /* ignore */ }
                        }
                      }}>
                        <div className="flex items-start gap-2">
                          {!n.is_read && <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full mt-1.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-xs font-semibold">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm hidden sm:block">
                <div className="font-medium text-[#0c1e3c] text-xs">{user?.full_name}</div>
                <div className="text-[10px] text-slate-500">{user?.role?.replace(/_/g, ' ')}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'workbench' && <WorkbenchView stats={stats} user={user} cases={cases} consultations={consultations} tasks={tasks} token={token} onViewChange={setCurrentView} charts={charts} firmHealth={firmHealth} />}
          {currentView === 'cases' && <CasesView cases={cases} page={casesPage} total={casesTotal} onPageChange={loadCases} onRefresh={() => loadCases(casesPage)} />}
          {currentView === 'leads' && <LeadsView leads={leads} page={leadsPage} total={leadsTotal} onPageChange={loadLeads} onRefresh={() => loadLeads(leadsPage)} />}
          {currentView === 'documents' && <DocumentsView token={token} documents={documents} onRefresh={loadDocuments} user={user} />}
          {currentView === 'consultations' && <ConsultationsView token={token} consultations={consultations} onRefresh={loadConsultations} user={user} staff={staff} />}
          {currentView === 'tasks' && <TasksView token={token} tasks={tasks} onRefresh={loadTasks} user={user} staff={staff} />}
          {currentView === 'staff' && <StaffPortal staff={staff} user={user} />}
          {currentView === 'org-chart' && <OrgChartView staff={staff} />}
          {currentView === 'analytics' && <AnalyticsView token={token} stats={stats} />}
          {currentView === 'pricing' && <PricingView plans={pricingPlans} />}
        </div>

        {/* Footer */}
        <footer className="bg-[#0c1e3c] py-3 px-6 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] text-[#7a94b8]">
            <span>&copy; {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> POPIA Compliant</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit Encryption</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating Ask Infinity */}
      <AskInfinityBubble />
    </div>
  );
}

// ============================================
// WORKBENCH VIEW - Central Hub
// ============================================
function WorkbenchView({ stats, user, cases, consultations, tasks, token, onViewChange, charts, firmHealth }: {
  stats: Stats | null; user: User | null; cases: any[]; consultations: Consultation[];
  tasks: TaskItem[]; token: string | null; onViewChange: (v: View) => void;
  charts: any; firmHealth: Record<string, boolean>;
}) {
  const role = user?.role || 'client';
  const isClient = role === 'client';
  const isManagement = ['managing_director', 'senior_partner', 'supervising_officer', 'systems_admin'].includes(role);
  const isLegal = ['associate', 'legal_officer', 'candidate_attorney', 'senior_consultant', 'consultant'].includes(role);
  const isParalegal = role === 'paralegal';

  const todayStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const quickActions = [
    ...(isLegal || isManagement ? [{ label: 'Log Consultation', icon: BookOpen, color: 'bg-[#0c1e3c] text-[#c9a84c]', view: 'consultations' as View }] : []),
    ...(isLegal || isParalegal || isManagement ? [{ label: 'Upload Document', icon: FileUp, color: 'bg-emerald-50 text-emerald-700', view: 'documents' as View }] : []),
    ...(isManagement || isLegal ? [{ label: 'New Case', icon: FolderKanban, color: 'bg-blue-50 text-blue-700', view: 'cases' as View }] : []),
    { label: 'My Tasks', icon: CheckCircle2, color: 'bg-amber-50 text-amber-700', view: 'tasks' as View },
    ...(!isClient ? [{ label: 'View Staff', icon: Users, color: 'bg-purple-50 text-purple-700', view: 'staff' as View }] : []),
    ...(isManagement ? [{ label: 'View Analytics', icon: TrendingUp, color: 'bg-teal-50 text-teal-700', view: 'analytics' as View }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative rounded-xl overflow-hidden bg-[#0c1e3c]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/images/hero-legal.png')] bg-cover bg-center" />
        </div>
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h2>
            <p className="text-[#8fa4c4] text-sm mt-1">{todayStr}</p>
            <Badge className="mt-2 bg-[#c9a84c] text-[#0c1e3c] text-[10px]">
              <Crown className="w-3 h-3 mr-1" />
              {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <div className="hidden md:flex gap-3">
            {stats && (
              <>
                <MiniStat label="Active Cases" value={stats.activeCases} />
                <MiniStat label="Pending Tasks" value={stats.pendingTasks} />
                {!isClient && <MiniStat label="Revenue" value={`R${(stats.totalRevenue / 1000000).toFixed(1)}M`} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border hover:shadow-md transition-all text-center group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cases', value: stats.totalCases, icon: FolderKanban, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active', value: stats.activeCases, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
            ...(!isClient ? [
              { label: 'Leads', value: stats.newLeads, icon: UserPlus, color: 'text-purple-600 bg-purple-50' },
              { label: 'Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-[#a88832] bg-[#c9a84c]/10' },
            ] : []),
            { label: 'Tasks', value: stats.pendingTasks, icon: Clock, color: 'text-orange-600 bg-orange-50' },
            { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
            ...(!isClient ? [
              { label: 'Clients', value: stats.totalClients, icon: Users, color: 'text-teal-600 bg-teal-50' },
            ] : []),
            { label: 'Docs', value: stats.totalDocuments, icon: FileText, color: 'text-slate-600 bg-slate-100' },
          ].map(card => (
            <Card key={card.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color} mx-auto`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-[#0c1e3c] mt-2">{card.value}</div>
                <div className="text-[10px] text-slate-500">{card.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 text-center space-y-2">
                <Skeleton className="w-8 h-8 rounded-lg mx-auto" />
                <Skeleton className="h-5 w-12 mx-auto" />
                <Skeleton className="h-3 w-10 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Consultations */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#0c1e3c]">Upcoming Consultations</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('consultations')}>
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No consultations scheduled</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => onViewChange('consultations')}>Schedule One</Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {consultations.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      c.meeting_type === 'video_call' ? 'bg-blue-50 text-blue-600' :
                      c.meeting_type === 'phone_call' ? 'bg-green-50 text-green-600' :
                      'bg-[#c9a84c]/10 text-[#a88832]'
                    }`}>
                      {c.meeting_type === 'video_call' ? <Video className="w-4 h-4" /> :
                       c.meeting_type === 'phone_call' ? <PhoneCall className="w-4 h-4" /> :
                       <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{c.client?.full_name || 'Client'}</div>
                      <div className="text-[10px] text-slate-500">{c.scheduled_date} at {c.scheduled_time} · {c.duration_minutes}min</div>
                    </div>
                    <Badge className={`text-[10px] ${
                      c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-100 text-red-700'
                    }`}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#0c1e3c]">My Tasks</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#c9a84c] text-xs h-7" onClick={() => onViewChange('tasks')}>
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.priority === 'urgent' ? 'bg-red-500' :
                      t.priority === 'high' ? 'bg-orange-500' :
                      t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                    }`} />
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
          </CardContent>
        </Card>
      </div>

      {/* Case distribution + Firm health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#0c1e3c]">Case Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const caseTypeColorMap: Record<string, { label: string; color: string }> = {
                  family_law: { label: 'Family Law', color: 'bg-[#0c1e3c]' },
                  civil_litigation: { label: 'Civil Litigation', color: 'bg-[#c9a84c]' },
                  criminal_defence: { label: 'Criminal Defence', color: 'bg-red-500' },
                  conveyancing: { label: 'Conveyancing', color: 'bg-emerald-500' },
                  estate_planning: { label: 'Estate Planning', color: 'bg-purple-500' },
                  corporate_commercial: { label: 'Corporate', color: 'bg-teal-500' },
                  debt_collection: { label: 'Debt Collection', color: 'bg-orange-500' },
                  immigration: { label: 'Immigration', color: 'bg-cyan-500' },
                  labour_law: { label: 'Labour Law', color: 'bg-pink-500' },
                  personal_injury: { label: 'Personal Injury', color: 'bg-indigo-500' },
                  other: { label: 'Other', color: 'bg-slate-400' },
                };
                const data = charts?.casesByType || [];
                const total = data.reduce((s: number, d: any) => s + d.count, 0) || 1;
                if (data.length === 0) {
                  return <div className="text-center py-8 text-sm text-slate-400">No case data available</div>;
                }
                return data.map((item: any) => {
                  const mapping = caseTypeColorMap[item.case_type] || { label: item.case_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), color: 'bg-slate-400' };
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.case_type} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32">{mapping.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className={`${mapping.color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-[#0c1e3c] w-10 text-right">{pct}%</span>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>

        {!isClient && <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#0c1e3c]">Firm Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'RBAC Authorization', ok: firmHealth.rbac !== undefined ? firmHealth.rbac : true },
              { label: 'POPIA Consent', ok: firmHealth.popia !== undefined ? firmHealth.popia : true },
              { label: 'Audit Logging', ok: firmHealth.auditLogging !== undefined ? firmHealth.auditLogging : true },
              { label: 'Encryption (AES-256)', ok: firmHealth.encryption !== undefined ? firmHealth.encryption : true },
              { label: 'Password Policy', ok: firmHealth.passwordPolicy !== undefined ? firmHealth.passwordPolicy : true },
              { label: 'Backup Active', ok: firmHealth.backupActive || false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>}
      </div>
    </div>
  );
}

// ============================================
// MINI STAT COMPONENT
// ============================================
function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 rounded-lg px-4 py-2 text-center backdrop-blur-sm">
      <div className="text-lg font-bold text-[#c9a84c]">{value}</div>
      <div className="text-[10px] text-[#8fa4c4]">{label}</div>
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
  const urgencyColors: Record<string, string> = { low: 'text-slate-500', medium: 'text-amber-600', high: 'text-orange-600', critical: 'text-red-600' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Cases</h2>
          <p className="text-sm text-slate-500">{total} total cases</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c] text-[#0c1e3c]">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/5">
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Matter #</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Title</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Type</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Status</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Urgency</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Client</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Value (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No cases found</td></tr>
                ) : (
                  cases.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-xs text-[#a88832]">{c.matter_number}</td>
                      <td className="p-3 font-medium text-[#0c1e3c] max-w-xs truncate">{c.title}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{(c.case_type || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3"><Badge className={`text-xs ${statusColors[c.status] || 'bg-slate-100'}`}>{(c.status || '').replace(/_/g, ' ')}</Badge></td>
                      <td className="p-3"><span className={`font-medium text-xs ${urgencyColors[c.urgency]}`}>{(c.urgency || '').toUpperCase()}</span></td>
                      <td className="p-3 text-slate-600">{c.client?.full_name || '-'}</td>
                      <td className="p-3 font-medium text-[#0c1e3c]">R{(c.estimated_value || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => onPageChange(p)}
                  className={p === page ? 'bg-[#0c1e3c]' : ''}>
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
    new: 'bg-blue-100 text-blue-700', contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-emerald-100 text-emerald-700', consultation_scheduled: 'bg-purple-100 text-purple-700',
    retained: 'bg-teal-100 text-teal-700', lost: 'bg-red-100 text-red-700',
    disqualified: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Leads Pipeline</h2>
          <p className="text-sm text-slate-500">{total} total leads</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c] text-[#0c1e3c]">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified'].map(status => {
          const count = leads.filter(l => l.status === status).length;
          return (
            <div key={status} className="text-center p-2 rounded-lg bg-white border">
              <div className="text-lg font-bold text-[#0c1e3c]">{count}</div>
              <div className="text-[10px] text-slate-500 capitalize">{status.replace(/_/g, ' ')}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/5">
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Name</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Email</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Source</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Status</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Score</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Value (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-[#0c1e3c]">{l.name}</td>
                    <td className="p-3 text-slate-600">{l.email}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{l.source?.replace(/_/g, ' ')}</Badge></td>
                    <td className="p-3"><Badge className={`text-xs ${statusColors[l.status] || 'bg-slate-100'}`}>{(l.status || '').replace(/_/g, ' ')}</Badge></td>
                    <td className="p-3"><div className="flex items-center gap-2"><Progress value={l.lead_score || 0} className="w-16 h-2" /><span className="text-xs font-medium">{l.lead_score || 0}</span></div></td>
                    <td className="p-3 font-medium text-[#0c1e3c]">R{(l.estimated_value || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DOCUMENTS VIEW - with upload
// ============================================
function DocumentsView({ token, documents, onRefresh, user }: {
  token: string | null; documents: DocumentItem[]; onRefresh: () => void; user: User | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('contract');
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!token || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('title', uploadTitle);
      formData.append('document_type', uploadType);
      formData.append('case_id', uploadCaseId);
      if (uploadDesc) formData.append('description', uploadDesc);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowUpload(false);
        setUploadTitle('');
        setUploadType('contract');
        setUploadCaseId('');
        setUploadDesc('');
        onRefresh();
      }
    } catch (e) {
      console.error('Upload error:', e);
    }
    setUploading(false);
  };

  const workflowColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700', review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700', signed: 'bg-blue-100 text-blue-700',
    filed: 'bg-teal-100 text-teal-700', archived: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Documents</h2>
          <p className="text-sm text-slate-500">{documents.length} documents</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c] text-[#0c1e3c]">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                <Upload className="w-4 h-4 mr-1" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Upload Document</DialogTitle>
                <DialogDescription>Upload a document to the case management system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Document title" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Document Type</Label>
                    <Select value={uploadType} onValueChange={setUploadType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="pleading">Pleading</SelectItem>
                        <SelectItem value="correspondence">Correspondence</SelectItem>
                        <SelectItem value="court_filing">Court Filing</SelectItem>
                        <SelectItem value="affidavit">Affidavit</SelectItem>
                        <SelectItem value="opinion">Opinion</SelectItem>
                        <SelectItem value="memo">Memo</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="consent_form">Consent Form</SelectItem>
                        <SelectItem value="id_document">ID Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Case ID</Label>
                    <Input value={uploadCaseId} onChange={e => setUploadCaseId(e.target.value)} placeholder="Enter case ID" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>File</Label>
                  <Input type="file" ref={fileInputRef} className="mt-1" accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
                  <p className="text-[10px] text-slate-400 mt-1">Max 10MB · PDF, DOC, DOCX, TXT, JPG, PNG</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleUpload} disabled={uploading || !uploadTitle || !uploadCaseId} className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No documents yet</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#0c1e3c] flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <Badge className={`text-[10px] ${workflowColors[doc.workflow_status] || 'bg-slate-100'}`}>{doc.workflow_status}</Badge>
                </div>
                <div className="mt-3">
                  <div className="font-medium text-[#0c1e3c]">{doc.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{doc.document_type?.replace(/_/g, ' ')} · v{doc.version}</div>
                  {doc.case && <div className="text-[10px] text-slate-500">Case: {doc.case.title}</div>}
                  {doc.prepared_by_user && <div className="text-[10px] text-slate-500">By: {doc.prepared_by_user.full_name}</div>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('en-ZA')}</span>
                  {doc.file_name && <Button size="sm" variant="ghost" className="h-6 text-[10px]"><Eye className="w-3 h-3 mr-1" />View</Button>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// CONSULTATIONS VIEW - with create dialog
// ============================================
function ConsultationsView({ token, consultations, onRefresh, user, staff }: {
  token: string | null; consultations: Consultation[]; onRefresh: () => void; user: User | null; staff: StaffMember[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_name: '', client_email: '', attorney_id: '', case_id: '',
    scheduled_date: '', scheduled_time: '09:00', duration_minutes: 60,
    meeting_type: 'in_person', notes: '',
  });

  const attorneys = staff.filter(s => ['associate', 'legal_officer', 'senior_partner', 'supervising_officer', 'senior_consultant', 'candidate_attorney'].includes(s.role));

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
        setForm({ client_name: '', client_email: '', attorney_id: '', case_id: '', scheduled_date: '', scheduled_time: '09:00', duration_minutes: 60, meeting_type: 'in_person', notes: '' });
        onRefresh();
      }
    } catch (e) {
      console.error('Create consultation error:', e);
    }
    setCreating(false);
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-700', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-orange-100 text-orange-700',
  };

  const meetingIcons: Record<string, any> = { in_person: MapPin, video_call: Video, phone_call: PhoneCall };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Consultations</h2>
          <p className="text-sm text-slate-500">{consultations.length} consultations logged</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c] text-[#0c1e3c]">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                <Plus className="w-4 h-4 mr-1" /> Log Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Log Consultation</DialogTitle>
                <DialogDescription>Schedule or log a client consultation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Name</Label>
                    <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" className="mt-1" />
                  </div>
                  <div>
                    <Label>Client Email</Label>
                    <Input value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="email@infinitylegal.co.za" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Attorney</Label>
                    <Select value={form.attorney_id} onValueChange={v => setForm(f => ({ ...f, attorney_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select attorney" /></SelectTrigger>
                      <SelectContent>
                        {attorneys.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.role.replace(/_/g, ' ')})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Meeting Type</Label>
                    <Select value={form.meeting_type} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="phone_call">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Duration (min)</Label>
                    <Select value={String(form.duration_minutes)} onValueChange={v => setForm(f => ({ ...f, duration_minutes: parseInt(v) }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Consultation notes..." className="mt-1" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={creating || !form.attorney_id || !form.scheduled_date}
                  className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
                  Log Consultation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#0c1e3c]/5">
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Type</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Client</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Attorney</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Date & Time</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Duration</th>
                  <th className="text-left p-3 font-medium text-[#0c1e3c]">Status</th>
                </tr>
              </thead>
              <tbody>
                {consultations.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No consultations logged yet</td></tr>
                ) : (
                  consultations.map(c => {
                    const IconComp = meetingIcons[c.meeting_type] || MapPin;
                    return (
                      <tr key={c.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0c1e3c]/5 flex items-center justify-center">
                            <IconComp className="w-4 h-4 text-[#0c1e3c]" />
                          </div>
                        </td>
                        <td className="p-3 font-medium text-[#0c1e3c]">{c.client?.full_name || 'Client'}</td>
                        <td className="p-3 text-slate-600">{c.attorney?.full_name || '-'}</td>
                        <td className="p-3 text-slate-600">{c.scheduled_date} at {c.scheduled_time}</td>
                        <td className="p-3 text-slate-600">{c.duration_minutes} min</td>
                        <td className="p-3"><Badge className={`text-[10px] ${statusColors[c.status] || 'bg-slate-100'}`}>{c.status}</Badge></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// TASKS VIEW - with create dialog
// ============================================
function TasksView({ token, tasks, onRefresh, user, staff }: {
  token: string | null; tasks: TaskItem[]; onRefresh: () => void; user: User | null; staff: StaffMember[];
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
  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Tasks</h2>
          <p className="text-sm text-slate-500">{tasks.length} total tasks</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-[#0c1e3c] text-[#0c1e3c]">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                <Plus className="w-4 h-4 mr-1" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#0c1e3c]">Create Task</DialogTitle>
                <DialogDescription>Assign a new task to a team member</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." className="mt-1" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assign To</Label>
                    <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>
                        {staff.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.role.replace(/_/g, ' ')})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Case ID (Optional)</Label>
                    <Input value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} placeholder="Link to case" className="mt-1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={creating || !form.title || !form.assigned_to}
                  className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c]">
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No tasks found</p>
          </CardContent></Card>
        ) : (
          tasks.map(task => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0c1e3c]">{task.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {task.assignee?.full_name && `Assigned to ${task.assignee.full_name}`}
                    {task.case && ` · ${task.case.title}`}
                    {task.due_date && ` · Due: ${new Date(task.due_date).toLocaleDateString('en-ZA')}`}
                  </div>
                </div>
                <Badge className={`text-[10px] ${statusColors[task.status] || 'bg-slate-100'}`}>{task.status.replace(/_/g, ' ')}</Badge>
                <span className={`text-[10px] font-semibold ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// STAFF PORTAL VIEW
// ============================================
function StaffPortal({ staff, user }: { staff: StaffMember[]; user: User | null }) {
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))];
  const roles = [...new Set(staff.map(s => s.role))];

  const filtered = staff.filter(s => {
    if (filterDept !== 'all' && s.department !== filterDept) return false;
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    return true;
  });

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', senior_partner: 'Senior Partner',
    associate: 'Associate', paralegal: 'Paralegal', legal_officer: 'Legal Officer',
    supervising_officer: 'Supervising Officer', senior_consultant: 'Senior Consultant',
    consultant: 'Consultant', candidate_attorney: 'Candidate Attorney',
    hr_manager: 'HR Manager', finance_manager: 'Finance Manager',
    office_administrator: 'Office Admin', systems_admin: 'Systems Admin',
    receptionist: 'Receptionist',
  };

  const roleColors: Record<string, string> = {
    managing_director: 'bg-[#c9a84c] text-[#0c1e3c]', senior_partner: 'bg-[#c9a84c]/70 text-[#0c1e3c]',
    associate: 'bg-blue-100 text-blue-700', paralegal: 'bg-emerald-100 text-emerald-700',
    legal_officer: 'bg-purple-100 text-purple-700', supervising_officer: 'bg-amber-100 text-amber-700',
    senior_consultant: 'bg-teal-100 text-teal-700', consultant: 'bg-cyan-100 text-cyan-700',
    candidate_attorney: 'bg-pink-100 text-pink-700', hr_manager: 'bg-orange-100 text-orange-700',
    finance_manager: 'bg-green-100 text-green-700', office_administrator: 'bg-slate-100 text-slate-700',
    systems_admin: 'bg-red-100 text-red-700', receptionist: 'bg-yellow-100 text-yellow-700',
  };

  // Group by department
  const grouped = filtered.reduce((acc, s) => {
    const dept = s.department || 'unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0c1e3c]">Staff Portal</h2>
          <p className="text-sm text-slate-500">{staff.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d!}>{d?.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.entries(grouped).map(([dept, members]) => (
        <div key={dept}>
          <h3 className="text-sm font-semibold text-[#0c1e3c] uppercase tracking-wider mb-3 capitalize">{dept.replace(/_/g, ' ')} Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`text-xs font-semibold ${roleColors[m.role] || 'bg-slate-100 text-slate-700'}`}>
                        {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#0c1e3c] text-sm">{m.full_name}</div>
                      <Badge className={`text-[9px] ${roleColors[m.role] || 'bg-slate-100 text-slate-700'}`}>{roleLabels[m.role] || m.role.replace(/_/g, ' ')}</Badge>
                      <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</div>
                      {m.supervisor && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Reports to: {m.supervisor.full_name}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className="text-[10px] text-slate-500">{m.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ORG CHART VIEW
// ============================================
function OrgChartView({ staff }: { staff: StaffMember[] }) {
  const hierarchy: Record<string, { tier: number; label: string; roles: string[] }> = {
    'Executive Leadership': { tier: 1, label: 'Executive Leadership', roles: ['managing_director', 'senior_partner'] },
    'Management': { tier: 2, label: 'Management', roles: ['supervising_officer', 'systems_admin'] },
    'Legal Practice': { tier: 3, label: 'Legal Practice', roles: ['legal_officer', 'associate', 'candidate_attorney'] },
    'Consulting': { tier: 3, label: 'Consulting', roles: ['senior_consultant', 'consultant'] },
    'Support Staff': { tier: 4, label: 'Support Staff', roles: ['paralegal', 'hr_manager', 'finance_manager'] },
    'Administration': { tier: 5, label: 'Administration', roles: ['office_administrator', 'receptionist'] },
  };

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', senior_partner: 'Senior Partner',
    associate: 'Associate', paralegal: 'Paralegal', legal_officer: 'Legal Officer',
    supervising_officer: 'Supervising Officer', senior_consultant: 'Senior Consultant',
    consultant: 'Consultant', candidate_attorney: 'Candidate Attorney',
    hr_manager: 'HR Manager', finance_manager: 'Finance Manager',
    office_administrator: 'Office Admin', systems_admin: 'Systems Admin',
    receptionist: 'Receptionist',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0c1e3c]">Organizational Structure</h2>
        <p className="text-sm text-slate-500">Infinity Legal (Pty) Ltd - Hierarchical Order</p>
      </div>

      <div className="space-y-4">
        {Object.entries(hierarchy).sort((a, b) => a[1].tier - b[1].tier).map(([key, group]) => {
          const members = staff.filter(s => group.roles.includes(s.role));
          return (
            <div key={key} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  group.tier === 1 ? 'bg-[#c9a84c] text-[#0c1e3c]' :
                  group.tier === 2 ? 'bg-[#0c1e3c] text-[#c9a84c]' :
                  group.tier === 3 ? 'bg-blue-100 text-blue-700' :
                  group.tier === 4 ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {group.tier === 1 ? <Crown className="w-5 h-5" /> :
                   group.tier === 2 ? <Shield className="w-5 h-5" /> :
                   group.tier === 3 ? <Gavel className="w-5 h-5" /> :
                   group.tier === 4 ? <Briefcase className="w-5 h-5" /> :
                   <Building className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0c1e3c]">{group.label}</h3>
                  <p className="text-[10px] text-slate-500">Tier {group.tier} · {members.length} members</p>
                </div>
              </div>
              <div className="ml-5 pl-5 border-l-2 border-[#c9a84c]/30 space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-white border hover:shadow-sm">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#0c1e3c] text-[#c9a84c] text-[10px]">
                        {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#0c1e3c]">{m.full_name}</div>
                      <div className="text-[10px] text-slate-500">{roleLabels[m.role] || m.role.replace(/_/g, ' ')}</div>
                    </div>
                    {m.supervisor && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {m.supervisor.full_name}
                      </div>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-slate-400 italic p-2">No staff members in this tier</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ANALYTICS VIEW
// ============================================
function AnalyticsView({ token, stats }: { token: string | null; stats: Stats | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0c1e3c]">Analytics Dashboard</h2>
        <p className="text-sm text-slate-500">Firm performance metrics and insights</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'bg-[#c9a84c]/10 text-[#a88832]' },
              { label: 'Active Cases', value: stats.activeCases, icon: FolderKanban, color: 'bg-blue-50 text-blue-700' },
              { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'bg-purple-50 text-purple-700' },
            ].map(card => (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-[#0c1e3c]">{card.value}</div>
                    <div className="text-xs text-slate-500">{card.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[#0c1e3c]">Case Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { status: 'Active', count: stats.activeCases, total: stats.totalCases || 1, color: 'bg-emerald-500' },
                    { status: 'Pending Review', count: stats.pendingCases, total: stats.totalCases || 1, color: 'bg-amber-500' },
                    { status: 'Closed', count: stats.closedCases, total: stats.totalCases || 1, color: 'bg-slate-400' },
                  ].map(item => (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28">{item.status}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className={`${item.color} rounded-full h-2`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-[#0c1e3c] w-8 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[#0c1e3c]">Task Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { status: 'Pending', count: stats.pendingTasks, color: 'bg-amber-500' },
                    { status: 'Overdue', count: stats.overdueTasks, color: 'bg-red-500' },
                    { status: 'Documents', count: stats.totalDocuments, color: 'bg-blue-500' },
                  ].map(item => (
                    <div key={item.status} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm text-slate-700">{item.status}</span>
                      </div>
                      <span className="text-sm font-medium text-[#0c1e3c]">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// PRICING VIEW
// ============================================
function PricingView({ plans }: { plans: any[] }) {
  const planColorMap: Record<string, { color: string; buttonColor: string; badge: string | null; popular?: boolean }> = {
    civil_legal_plan: { color: 'border-slate-200', buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]', badge: null },
    labour_legal_plan: { color: 'border-[#c9a84c]', buttonColor: 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#a88832]', badge: 'Popular', popular: true },
    extensive_plan: { color: 'border-slate-200', buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]', badge: 'Best Value' },
  };

  const defaultPlanStyle = { color: 'border-slate-200', buttonColor: 'bg-[#0c1e3c] text-white hover:bg-[#132d52]', badge: null };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0c1e3c]">Pricing Plans</h2>
        <p className="text-slate-500 mt-1">All prices in South African Rand (ZAR). POPIA compliant by default.</p>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No pricing plans available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const style = planColorMap[plan.slug] || defaultPlanStyle;
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <Card key={plan.id} className={`relative ${style.color} ${style.popular ? 'ring-2 ring-[#c9a84c]' : ''} border-2`}>
                {style.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-[10px]">{style.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-[#0c1e3c]">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-[#0c1e3c]">R{Math.round(plan.price_monthly)}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  {plan.price_annual && (
                    <p className="text-xs text-emerald-600 mt-0.5">R{Math.round(plan.price_annual)}/year — save {Math.round((1 - plan.price_annual / (plan.price_monthly * 12)) * 100)}%</p>
                  )}
                  {plan.max_cases && (
                    <p className="text-xs text-slate-500 mt-1">Up to {plan.max_cases} cases · {plan.max_documents || '∞'} documents</p>
                  )}
                  <Separator className="my-4" />
                  <ul className="space-y-2">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full mt-4 ${style.buttonColor}`} size="sm" onClick={() => toast.success(`${plan.name} selected! Redirecting to signup...`)}>
                    Get Started — {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// ASK INFINITY - Floating Chat Bubble
// ============================================
function AskInfinityBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; provider?: string }[]>([
    { role: 'assistant', content: 'Sawubona! 👋 I\'m Ask Infinity — your AI legal assistant for South African law. How can I help you today?', provider: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('il_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        const provider = data.meta?.provider || 'unknown';
        setLastProvider(provider);
        setMessages(prev => [...prev, { role: 'assistant', content: data.data || data.response, provider }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I apologise, I encountered an error. Please try again.', provider: 'error' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m having trouble connecting. Please try again.', provider: 'error' }]);
    }
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = async () => {
    try {
      await fetch(`/api/ai/chat?sessionId=${sessionIdRef.current}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    sessionIdRef.current = Math.random().toString(36).substring(2, 15);
    setMessages([{ role: 'assistant', content: 'Chat cleared! How can I help you with your legal matter today?', provider: 'system' }]);
    setLastProvider('');
  };

  const providerLabel: Record<string, string> = {
    google: 'Gemini',
    groq: 'Groq',
    openrouter: 'OpenRouter',
    cohere: 'Cohere',
    cloudflare: 'Cloudflare',
    zai: 'Z-AI',
    system: '',
    error: '',
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Ask Infinity - AI Legal Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-[#0c1e3c] animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-[#132d52] rounded-2xl border border-[#1a3358] shadow-2xl flex flex-col overflow-hidden" style={{ height: '520px' }}>
          {/* Header */}
          <div className="p-3 border-b border-[#1a3358] flex items-center justify-between bg-[#0c1e3c] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0c1e3c]" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Ask Infinity</span>
                <div className="flex items-center gap-1.5">
                  <p className="text-[9px] text-[#8fa4c4]">AI Legal Assistant • SA Law</p>
                  {lastProvider && providerLabel[lastProvider] && (
                    <Badge className="text-[7px] bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 h-3.5 px-1 font-normal">
                      {providerLabel[lastProvider]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-[#7a94b8] hover:text-[#c9a84c] p-1 hover:bg-[#132d52] rounded-lg transition-colors"
                title="Clear chat"
                aria-label="Clear chat history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#7a94b8] hover:text-white p-1 hover:bg-[#132d52] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-[#c9a84c]/15 border border-[#c9a84c]/25 text-[#e0c97a]'
                    : 'bg-[#0c1e3c] border border-[#1a3358] text-[#8fa4c4]'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#c9a84c]" />
                      <span className="text-[9px] font-medium text-[#c9a84c]">Ask Infinity</span>
                      {msg.provider && providerLabel[msg.provider] && msg.provider !== 'system' && (
                        <Badge className="text-[7px] bg-[#1a3358] text-[#7a94b8] border-0 h-3 px-1 font-normal ml-1">
                          {providerLabel[msg.provider]}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#0c1e3c] border border-[#1a3358] rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-2.5 h-2.5 text-[#c9a84c] animate-pulse" />
                    <span className="text-xs text-[#7a94b8]">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* POPIA + Free AI badges */}
          <div className="px-3 py-1.5 bg-[#0a1628] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Badge className="text-[7px] bg-[#0c1e3c] text-[#7a94b8] border-[#1a3358] h-4 px-1.5">
                <Shield className="w-2 h-2 mr-0.5" />
                POPIA
              </Badge>
              <Badge className="text-[7px] bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20 h-4 px-1.5">
                <Zap className="w-2 h-2 mr-0.5" />
                Powered by Free AI
              </Badge>
            </div>
            <span className="text-[7px] text-[#5a7199]">Not legal advice</span>
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-[#1a3358] bg-[#0c1e3c] flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about SA law..."
                aria-label="Type your legal question for Ask Infinity"
                className="flex-1 bg-[#132d52] border border-[#1a3358] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5a7199] focus:outline-none focus:border-[#c9a84c] transition-colors"
                disabled={isLoading}
                maxLength={2000}
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] disabled:opacity-50 h-8 w-8 p-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// ASK INFINITY - AI Chat Widget
// ============================================
function AskInfinityChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Sawubona! 👋 I\'m Ask Infinity — your AI legal assistant for South African law. Tell me about your legal matter and I\'ll help you understand your rights and next steps. You can ask me about labour disputes, consumer rights, family law, criminal matters, and more.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user' as const, content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data || data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I apologise, I encountered an error. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m having trouble connecting. Please check your internet connection and try again.' }]);
    }
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = async () => {
    try {
      await fetch(`/api/ai/chat?sessionId=${sessionIdRef.current}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    sessionIdRef.current = Math.random().toString(36).substring(2, 15);
    setMessages([
      { role: 'assistant', content: 'Chat cleared! How can I help you with your legal matter today?' },
    ]);
  };

  const suggestedQuestions = [
    'I was fired without a hearing — what are my rights?',
    'How do I file for divorce in South Africa?',
    'My landlord won\'t fix the house — what can I do?',
    'What happens at a CCMA hearing?',
  ];

  return (
    <div className="bg-[#132d52] rounded-2xl border border-[#1a3358] overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
      {/* Chat Header */}
      <div className="p-4 border-b border-[#1a3358] flex items-center justify-between bg-[#0c1e3c]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#c9a84c] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#0c1e3c]" />
          </div>
          <div>
            <span className="text-white font-semibold text-sm">Ask Infinity</span>
            <p className="text-[10px] text-[#8fa4c4]">AI Legal Assistant • SA Law</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-[#7a94b8] hover:text-white p-1.5 hover:bg-[#132d52] rounded-lg transition-colors"
            title="Clear chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[340px] custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#c9a84c]/15 border border-[#c9a84c]/25 text-[#e0c97a]'
                : 'bg-[#0c1e3c] border border-[#1a3358] text-[#8fa4c4]'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#c9a84c]" />
                  <span className="text-[10px] font-medium text-[#c9a84c]">Ask Infinity</span>
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0c1e3c] border border-[#1a3358] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#c9a84c] animate-pulse" />
                <span className="text-sm text-[#7a94b8]">Thinking...</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-[#7a94b8] uppercase tracking-wider mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#1a3358] text-[#8fa4c4] hover:bg-[#0c1e3c] hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-[#1a3358] bg-[#0c1e3c]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your legal question..."
            aria-label="Type your legal question for Ask Infinity"
            className="flex-1 bg-[#132d52] border border-[#1a3358] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a7199] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 transition-colors"
            disabled={isLoading}
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-[#c9a84c] hover:bg-[#a88832] text-[#0c1e3c] disabled:opacity-50 h-10 w-10 p-0"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[9px] text-[#7a94b8] mt-1.5 text-center">
          General legal information only — not legal advice. <ShieldCheck className="w-2.5 h-2.5 inline" /> POPIA Compliant
        </p>
      </div>
    </div>
  );
}

