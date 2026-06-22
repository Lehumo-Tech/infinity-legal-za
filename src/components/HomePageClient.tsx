'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Users, FolderKanban, Target, FileText, Shield, TrendingUp,
  Bell, Search, ChevronRight, Activity, Clock, AlertTriangle, CheckCircle2,
  LogOut, DollarSign, UserPlus, FileCheck,
  ArrowUpRight, Menu, X, Eye, Lock, RefreshCw, ChevronLeft,
  Mail, Phone, Building, Star, Zap, Globe,
  KeyRound, ShieldCheck, Upload, Plus,
  BookOpen, Briefcase, Crown, MessageSquare, LayoutDashboard,
  Gavel, Landmark, PhoneCall, Video, MapPin,
  Clock3, FileUp, Calendar, Download,
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
import { useAuth } from '@/hooks/useAuth';

// ============================================
// TYPES
// ============================================
type View = 'workbench' | 'cases' | 'leads' | 'documents' | 'consultations' | 'tasks' | 'staff' | 'analytics' | 'pricing' | 'org-chart';
type UserRole = 'managing_director' | 'admin' | 'attorney' | 'paralegal' | 'systems_admin' | 'client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
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
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes?: string | null;
  meeting_type: string;
  client?: { full_name: string | null; email: string };
  attorney?: { full_name: string | null; email: string };
  case?: { title: string; case_ref: string } | null;
  created_at: string;
}

interface DocumentItem {
  id: string;
  file_name: string;
  case_id: string;
  document_type: string;
  status: string;
  version: number;
  file_path: string;
  file_size?: number | null;
  uploaded_by?: string | null;
  created_at: string;
  case?: { title: string; case_ref: string };
  uploaded_by_user?: { full_name: string | null };
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
  completed_at?: string | null;
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
  phone?: string | null;
  avatar_url?: string | null;
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
  const { user: authUser, accessToken, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = !!authUser && !!accessToken;
  const user: User | null = authUser ? {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.full_name,
    role: (authUser.role || 'client') as UserRole,
    avatar_url: authUser.avatar_url || null,
    phone: authUser.phone || null,
  } : null;
  const token = accessToken;
  const [currentView, setCurrentView] = useState<View>('workbench');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [initialSignup, setInitialSignup] = useState(false);
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth is handled by useAuth() hook - signIn/signOut are in the LoginScreen and topbar
  // The auth state (isAuthenticated, user, token) is derived from the auth context
  // No more localStorage - sessions are managed via Supabase cookies

  // Loading timeout — prevent infinite loading spinner (15 second max)
  useEffect(() => {
    if (authLoading) {
      loadingTimerRef.current = setTimeout(() => setLoadingTimeout(true), 15000);
    }
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [authLoading]);

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

  // Session is now managed by Supabase cookies via the AuthProvider
  // No need for localStorage session restoration

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
    const isManagement = ['managing_director', 'admin', 'systems_admin'].includes(role);
    const isLegal = role === 'attorney';
    const isParalegal = role === 'paralegal';
    const isSales = role === 'admin';
    const isFinance = false; // no finance-specific roles in schema
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

  // Loading guard — show skeleton while auth is initializing
  // This prevents the flash of LandingPage for logged-in users
  // If loading takes more than 15 seconds, show the landing page instead
  if (authLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#c9a84c]/20 border-t-[#c9a84c] animate-spin" />
          </div>
          <div className="flex items-center gap-2">
            <Image src="/logo_legal.png" alt="Infinity Legal SA" width={80} height={45} className="object-contain opacity-60" />
          </div>
          <p className="text-slate-400 text-xs tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <LoginScreen
          onLogin={() => {}}
          loading={false}
          error={loginError}
          initialSignup={initialSignup}
          onBackToHome={() => { setShowLogin(false); setInitialSignup(false); }}
        />
      );
    }
    return (
      <LandingPage
        onLoginClick={() => { setShowLogin(true); setInitialSignup(false); }}
        onSignUp={(email?: string, name?: string) => {
          if (email) sessionStorage.setItem('il_intake_email', email);
          if (name) sessionStorage.setItem('il_intake_name', name);
          setShowLogin(true);
          setInitialSignup(true);
        }}
      />
    );
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
      <aside className={`${sidebarOpen ? 'w-[272px]' : 'w-[68px]'} bg-[#0c1e3c] text-white flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0`}>
        {/* Logo Area */}
        <div
          className="p-4 flex items-center gap-3 border-b border-[#c9a84c]/20 cursor-pointer hover:bg-[#132d52]/30 transition-all duration-200 group"
          onClick={() => setShowLanding(true)}
          title="Visit Homepage"
        >
          <div className="relative">
            <Image src="/logo_legal.png" alt="Infinity Legal SA" width={48} height={27} className="flex-shrink-0 object-contain" />
            <div className="absolute -inset-2 bg-[#c9a84c]/0 group-hover:bg-[#c9a84c]/5 rounded-lg transition-all duration-300" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-bold text-lg tracking-tight">Infinity Legal</span>
              <p className="text-[10px] text-[#7a8fb0] uppercase tracking-widest">Intranet Portal</p>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {/* Homepage Link — card-style */}
            <button
              onClick={() => setShowLanding(true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-[#c9a84c] hover:bg-[#c9a84c]/10 border border-[#c9a84c]/15 hover:border-[#c9a84c]/30 mb-2 ${sidebarOpen ? '' : 'justify-center'}`}
            >
              <HomeIcon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Visit Homepage</span>}
            </button>

            {navGroups.map((group, gi) => (
              <div key={group}>
                {sidebarOpen && gi > 0 && (
                  <>
                    <div className="divider-gold my-2 mx-3" />
                    <div className="px-3 pt-2 pb-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7a94b8]">
                        <span className="text-[#c9a84c]/60 mr-1.5">—</span>{group}
                      </span>
                    </div>
                  </>
                )}
                {sidebarOpen && gi === 0 && group !== 'Main' && (
                  <div className="px-3 pt-2 pb-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7a94b8]">
                      <span className="text-[#c9a84c]/60 mr-1.5">—</span>{group}
                    </span>
                  </div>
                )}
                {navItems.filter(i => i.group === group).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    aria-label={item.label}
                    className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''} relative ${!sidebarOpen ? 'justify-center !px-0' : ''}`}
                  >
                    {currentView === item.id && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#c9a84c] rounded-r-full" />
                    )}
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile Section */}
        <div className={`p-3 border-t border-[#1a3358] ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : ''} p-2 rounded-lg hover:bg-[#132d52]/50 transition-all duration-200 cursor-default`}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-[10px] font-bold">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{user?.full_name}</div>
                <div className="text-[10px] text-[#7a94b8] capitalize truncate">{user?.role?.replace(/_/g, ' ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <div className="p-3 border-t border-[#1a3358]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            className="sidebar-nav-item !py-2 group/collapse"
          >
            <ChevronLeft className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="glass-nav h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => setShowLanding(true)}
                className="text-[#7a94b8] hover:text-[#0c1e3c] transition-colors duration-200 flex items-center gap-1"
                title="Visit Homepage"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-semibold text-[#0c1e3c] capitalize">{currentView.replace('-', ' ')}</span>
            </nav>
            <Badge className="bg-[#c9a84c]/5 text-[#a88832] text-[9px] font-medium border-0 hover:bg-[#c9a84c]/10 transition-colors duration-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              POPIA
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search..."
                aria-label="Search cases and documents"
                className="pl-9 pr-16 w-64 h-8 text-sm input-premium focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && currentView === 'cases' && loadCases(1)}
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono pointer-events-none">⌘K</kbd>
            </div>
            {/* Notifications */}
            <div className="relative">
              <button
                className={`relative p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 ${notifications.filter(n => !n.is_read).length > 0 ? 'dot-notification' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4 text-slate-600" />
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
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-xs font-bold">
                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm hidden sm:block text-left">
                  <div className="font-medium text-[#0c1e3c] text-xs leading-tight">{user?.full_name}</div>
                  <div className="text-[10px] text-slate-500 capitalize leading-tight">{user?.role?.replace(/_/g, ' ')}</div>
                </div>
                <ChevronRight className={`w-3 h-3 text-slate-400 hidden sm:block transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border shadow-xl rounded-xl z-50 overflow-hidden animate-scale-in">
                  <div className="p-3 border-b bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-[#c9a84c] text-[#0c1e3c] text-xs font-bold">
                          {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0c1e3c] truncate">{user?.full_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'workbench' && <WorkbenchView stats={stats} user={user} cases={cases} consultations={consultations} tasks={tasks} token={token} onViewChange={setCurrentView} charts={charts} firmHealth={firmHealth} />}
          {currentView === 'cases' && <CasesView cases={cases} page={casesPage} total={casesTotal} onPageChange={loadCases} onRefresh={() => loadCases(casesPage)} token={token} user={user} staff={staff} />}
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
        <footer className="bg-[#0c1e3c] py-4 px-6 flex-shrink-0 border-t border-[#c9a84c]/15">
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
// WORKBENCH VIEW - Premium Legal Dashboard
// ============================================
function WorkbenchView({ stats, user, cases, consultations, tasks, token, onViewChange, charts, firmHealth }: {
  stats: Stats | null; user: User | null; cases: any[]; consultations: Consultation[];
  tasks: TaskItem[]; token: string | null; onViewChange: (v: View) => void;
  charts: any; firmHealth: Record<string, boolean>;
}) {
  const role = user?.role || 'client';
  const isClient = role === 'client';
  const isManagement = ['managing_director', 'admin', 'systems_admin'].includes(role);
  const isLegal = role === 'attorney';
  const isParalegal = role === 'paralegal';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const quickActions = [
    ...(isLegal || isManagement ? [{ label: 'Log Consultation', icon: BookOpen, color: 'bg-[#0c1e3c] text-[#c9a84c]', accent: 'group-hover:shadow-[0_0_12px_rgba(201,168,76,0.3)]', view: 'consultations' as View }] : []),
    ...(isLegal || isParalegal || isManagement ? [{ label: 'Upload Document', icon: FileUp, color: 'bg-emerald-50 text-emerald-700', accent: 'group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]', view: 'documents' as View }] : []),
    ...(isManagement || isLegal ? [{ label: 'New Case', icon: FolderKanban, color: 'bg-blue-50 text-blue-700', accent: 'group-hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]', view: 'cases' as View }] : []),
    { label: 'My Tasks', icon: CheckCircle2, color: 'bg-amber-50 text-amber-700', accent: 'group-hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]', view: 'tasks' as View },
    ...(!isClient ? [{ label: 'View Staff', icon: Users, color: 'bg-purple-50 text-purple-700', accent: 'group-hover:shadow-[0_0_12px_rgba(147,51,234,0.2)]', view: 'staff' as View }] : []),
    ...(isManagement ? [{ label: 'View Analytics', icon: TrendingUp, color: 'bg-teal-50 text-teal-700', accent: 'group-hover:shadow-[0_0_12px_rgba(20,184,166,0.2)]', view: 'analytics' as View }] : []),
  ];

  // Firm health items
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
      {/* ═══════════════════════════════════════════
          WELCOME BANNER — Premium Navy Card
          ═══════════════════════════════════════════ */}
      <div className="card-navy relative">
        {/* Diagonal gold accent stripe — top right */}
        <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 rotate-45 transform origin-center" />
          <div className="absolute top-2 right-2 w-16 h-[2px] bg-gradient-to-l from-[#c9a84c]/40 to-transparent" />
          <div className="absolute top-6 right-2 w-10 h-[1px] bg-gradient-to-l from-[#c9a84c]/25 to-transparent" />
        </div>

        <div className="relative p-6 flex items-center justify-between">
          <div>
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">{greeting}</p>
            <h2 className="text-2xl font-bold text-white">{user?.full_name?.split(' ')[0] || 'User'}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock3 className="w-3.5 h-3.5 text-[#8fa4c4]" />
              <p className="text-[#8fa4c4] text-sm">{todayStr}</p>
            </div>
            {/* Role badge with gold shimmer */}
            <Badge className="mt-3 bg-gradient-to-r from-[#c9a84c] via-[#dfc475] to-[#c9a84c] text-[#0c1e3c] text-[10px] font-semibold animate-shimmer bg-[length:200%_100%] shadow-sm">
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

      {/* ═══════════════════════════════════════════
          QUICK ACTIONS — Staggered Premium Cards
          ═══════════════════════════════════════════ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className="card-premium flex flex-col items-center gap-2.5 p-4 text-center group relative"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} transition-all duration-300 group-hover:scale-110 ${action.accent}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
              {/* Arrow indicator on hover */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ChevronRight className="w-3.5 h-3.5 text-[#c9a84c]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STATS GRID — Premium Stat Cards
          ═══════════════════════════════════════════ */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: FolderKanban, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-500' },
            { label: 'Active Cases', value: stats.activeCases, icon: Activity, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
            ...(!isClient ? [
              { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-500' },
              { label: 'Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-[#a88832] bg-[#c9a84c]/10', border: 'border-l-[#c9a84c]', trend: true },
            ] : []),
            { label: 'Pending Tasks', value: stats.pendingTasks, icon: Clock, color: 'text-orange-600 bg-orange-50', border: 'border-l-orange-500' },
            { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-l-red-500' },
            ...(!isClient ? [
              { label: 'Clients', value: stats.totalClients, icon: Users, color: 'text-teal-600 bg-teal-50', border: 'border-l-teal-500' },
            ] : []),
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
                    <span>12%</span>
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

      {/* ═══════════════════════════════════════════
          CONSULTATIONS & TASKS — Premium Cards
          ═══════════════════════════════════════════ */}
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
            {consultations.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No consultations scheduled</p>
                <p className="text-[11px] text-slate-300 mt-1">Schedule your first consultation to get started</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs border-[#c9a84c]/30 text-[#a88832] hover:bg-[#c9a84c]/5" onClick={() => onViewChange('consultations')}>Schedule One</Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {consultations.slice(0, 5).map(c => {
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
                        <div className="text-[10px] text-slate-500">{c.scheduled_at ? (() => { const d = new Date(c.scheduled_at); return `${d.toLocaleDateString('en-ZA')} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`; })() : 'TBD'} · {c.duration_minutes}min</div>
                      </div>
                      <Badge className={`text-[10px] ${
                        c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        c.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-700'
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
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 animate-float">
                  <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                </div>
                <p className="text-slate-500 font-medium">All caught up!</p>
                <p className="text-[11px] text-slate-300 mt-1">No pending tasks remaining</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors">
                    {/* Checkbox-like indicator */}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      t.priority === 'urgent' ? 'border-red-400 bg-red-50' :
                      t.priority === 'high' ? 'border-orange-400 bg-orange-50' :
                      t.priority === 'medium' ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'
                    }`}>
                      {t.priority === 'urgent' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      {t.priority === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      {t.priority === 'medium' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
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

      {/* ═══════════════════════════════════════════
          CASE DISTRIBUTION + FIRM HEALTH
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Distribution — Elegant gradient bars */}
        <div className="card-premium lg:col-span-2">
          <div className="p-4 pb-3 border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[#0c1e3c]" />
              <h3 className="text-sm font-semibold text-[#0c1e3c]">Case Distribution by Type</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {(() => {
                const caseTypeGradientMap: Record<string, { label: string; from: string; to: string }> = {
                  family: { label: 'Family', from: 'from-[#0c1e3c]', to: 'to-[#1a3358]' },
                  civil: { label: 'Civil', from: 'from-[#c9a84c]', to: 'to-[#dfc475]' },
                  criminal: { label: 'Criminal', from: 'from-red-500', to: 'to-red-400' },
                  corporate: { label: 'Corporate', from: 'from-emerald-600', to: 'to-emerald-400' },
                  property: { label: 'Property', from: 'from-purple-600', to: 'to-purple-400' },
                  labour: { label: 'Labour', from: 'from-teal-600', to: 'to-teal-400' },
                  immigration: { label: 'Immigration', from: 'from-cyan-600', to: 'to-cyan-400' },
                  intellectual_property: { label: 'IP', from: 'from-orange-600', to: 'to-orange-400' },
                  tax: { label: 'Tax', from: 'from-pink-600', to: 'to-pink-400' },
                  personal_injury: { label: 'Personal Injury', from: 'from-indigo-600', to: 'to-indigo-400' },
                  debt_recovery: { label: 'Debt Recovery', from: 'from-amber-600', to: 'to-amber-400' },
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
                return data.map((item: any) => {
                  const mapping = caseTypeGradientMap[item.case_type] || { label: item.case_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), from: 'from-slate-500', to: 'to-slate-400' };
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
                });
              })()}
            </div>
          </div>
        </div>

        {/* Firm Health — Status indicators */}
        {!isClient && (
          <div className="card-premium">
            <div className="p-4 pb-3 border-b border-slate-100/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-semibold text-[#0c1e3c]">Firm Health</h3>
                </div>
                <Badge className={`text-[10px] font-semibold ${healthyCount === healthItems.length ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {healthyCount}/{healthItems.length} Healthy
                </Badge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {healthItems.map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  {item.ok ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 animate-pulse-gold" style={{ animationDuration: '3s' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  )}
                  <span className={`text-sm ${item.ok ? 'text-slate-700' : 'text-red-700 font-medium'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MINI STAT COMPONENT — Premium Glass Card
// ============================================
function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-dark rounded-xl px-4 py-3 text-center min-w-[100px] border-b-2 border-[#c9a84c]/30">
      <div className="text-lg font-bold text-[#c9a84c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-[10px] text-[#8fa4c4] font-medium uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

// ============================================
// CASES VIEW
// ============================================
function CasesView({ cases, page, total, onPageChange, onRefresh, token, user, staff }: { cases: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void; token: string | null; user: User | null; staff: StaffMember[] }) {
  const totalPages = Math.ceil(total / 10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [caseSearch, setCaseSearch] = useState('');
  const [showNewCase, setShowNewCase] = useState(false);
  const [creating, setCreating] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '', case_type: 'civil', description: '', urgency: 'medium',
    opposing_party: '', court_name: '',
  });

  const CASE_TYPES = [
    { value: 'civil', label: 'Civil' },
    { value: 'criminal', label: 'Criminal' },
    { value: 'family', label: 'Family' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'property', label: 'Property' },
    { value: 'labour', label: 'Labour' },
    { value: 'immigration', label: 'Immigration' },
    { value: 'intellectual_property', label: 'Intellectual Property' },
    { value: 'tax', label: 'Tax' },
    { value: 'personal_injury', label: 'Personal Injury' },
    { value: 'debt_recovery', label: 'Debt Recovery' },
    { value: 'other', label: 'Other' },
  ];

  const handleCreateCase = async () => {
    if (!token || !user) return;
    if (!caseForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: caseForm.title,
          case_type: caseForm.case_type,
          description: caseForm.description || undefined,
          client_id: user.id,
          opposing_party: caseForm.opposing_party || undefined,
          court_name: caseForm.court_name || undefined,
          notes: caseForm.urgency !== 'medium' ? `Urgency: ${caseForm.urgency}` : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Case created successfully');
        setShowNewCase(false);
        setCaseForm({ title: '', case_type: 'civil', description: '', urgency: 'medium', opposing_party: '', court_name: '' });
        onRefresh();
      } else {
        toast.error(data.error?.message || 'Failed to create case');
      }
    } catch (e) {
      console.error('Create case error:', e);
      toast.error('Failed to create case');
    }
    setCreating(false);
  };

  const caseTypeColors: Record<string, string> = {
    civil: '#3b82f6', criminal: '#ef4444', family: '#8b5cf6',
    corporate: '#f59e0b', property: '#10b981', labour: '#6366f1',
    immigration: '#06b6d4', intellectual_property: '#ec4899',
    tax: '#14b8a6', personal_injury: '#f97316', debt_recovery: '#64748b', other: '#94a3b8',
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'badge-active';
      case 'intake': case 'review': case 'on_hold': return 'badge-pending';
      case 'closed': case 'archived': return 'badge-closed';
      default: return 'badge-pending';
    }
  };

  const filteredCases = cases.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (caseSearch && !c.title?.toLowerCase().includes(caseSearch.toLowerCase()) && !c.case_ref?.toLowerCase().includes(caseSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="card-premium p-6">
        {/* Header with gold accent */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="border-l-2 border-[#c9a84c] pl-4">
              <h2 className="text-xl font-bold text-[#0c1e3c]">Cases</h2>
              <p className="text-sm text-slate-500">{total} total cases</p>
            </div>
            <Badge className="bg-[#0c1e3c] text-white text-[10px] font-semibold ml-2 hover:bg-[#0c1e3c]">{total}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onRefresh} className="text-slate-500 hover:text-[#0c1e3c]">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" className="btn-gold px-4" onClick={() => setShowNewCase(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Case
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search cases..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)} className="pl-9 input-premium focus:ring-0" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 input-premium focus:ring-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="intake">Intake</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-6">
          <table className="w-full table-premium">
            <thead>
              <tr>
                <th className="text-left">Case Ref</th>
                <th className="text-left">Title</th>
                <th className="text-left">Type</th>
                <th className="text-left">Status</th>
                <th className="text-left">Client</th>
                <th className="text-left">Created</th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {filteredCases.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <FolderKanban className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">No cases found</p>
                  <p className="text-[11px] text-slate-300 mt-1">Create a new case or adjust your filters</p>
                </td></tr>
              ) : (
                filteredCases.map(c => (
                  <tr key={c.id} className="group" style={{ borderLeft: `3px solid ${caseTypeColors[c.case_type] || '#94a3b8'}` }}>
                    <td className="font-mono text-xs text-[#a88832]">{c.case_ref?.substring(0, 8) || '-'}</td>
                    <td className="font-medium text-[#0c1e3c] max-w-xs truncate">{c.title}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: caseTypeColors[c.case_type] || '#94a3b8' }} />
                        <span className="text-xs text-slate-600 capitalize">{(c.case_type || '').replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td><span className={`badge-status ${statusBadgeClass(c.status)}`}>{(c.status || '').replace(/_/g, ' ')}</span></td>
                    <td className="text-slate-600">{c.client?.full_name || '-'}</td>
                    <td className="text-slate-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} results</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="hover-lift">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => onPageChange(p)}
                  className={p === page ? 'btn-navy' : 'hover-lift'}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="hover-lift">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* New Case Dialog */}
      <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
        <DialogContent className="max-w-lg animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-[#0c1e3c] border-l-2 border-[#c9a84c] pl-3">New Case</DialogTitle>
            <DialogDescription>Create a new legal case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600">Title <span className="text-red-500">*</span></Label>
              <Input
                value={caseForm.title}
                onChange={e => setCaseForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Smith v. Johnson Property Dispute"
                className="mt-1 input-premium focus:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600">Case Type <span className="text-red-500">*</span></Label>
                <Select value={caseForm.case_type} onValueChange={v => setCaseForm(f => ({ ...f, case_type: v }))}>
                  <SelectTrigger className="mt-1 input-premium focus:ring-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Urgency</Label>
                <Select value={caseForm.urgency} onValueChange={v => setCaseForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger className="mt-1 input-premium focus:ring-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Description</Label>
              <Textarea
                value={caseForm.description}
                onChange={e => setCaseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the case..."
                className="mt-1 input-premium focus:ring-0"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600">Opposing Party</Label>
                <Input
                  value={caseForm.opposing_party}
                  onChange={e => setCaseForm(f => ({ ...f, opposing_party: e.target.value }))}
                  placeholder="e.g. Johnson & Associates"
                  className="mt-1 input-premium focus:ring-0"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Court Name</Label>
                <Input
                  value={caseForm.court_name}
                  onChange={e => setCaseForm(f => ({ ...f, court_name: e.target.value }))}
                  placeholder="e.g. High Court of SA"
                  className="mt-1 input-premium focus:ring-0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreateCase} disabled={creating || !caseForm.title.trim()} className="btn-gold">
              {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// LEADS VIEW
// ============================================
function LeadsView({ leads, page, total, onPageChange, onRefresh }: { leads: any[]; page: number; total: number; onPageChange: (p: number) => void; onRefresh: () => void }) {
  const totalPages = Math.ceil(total / 10);

  const sourceIcons: Record<string, any> = {
    website: Globe, referral: Users, social_media: MessageSquare,
    google_ads: Zap, walk_in: MapPin, phone: Phone, email: Mail,
    partner: Handshake, event: Star, other: AlertCircle,
  };

  const statusBorderColor: Record<string, string> = {
    new: '#3b82f6', contacted: '#f59e0b', qualified: '#10b981',
    consultation_scheduled: '#8b5cf6', retained: '#14b8a6', lost: '#ef4444',
    nurturing: '#94a3b8',
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'retained': case 'qualified': return 'badge-active';
      case 'new': case 'contacted': case 'consultation_scheduled': return 'badge-pending';
      case 'lost': return 'badge-closed';
      case 'nurturing': return 'badge-pending';
      default: return 'badge-pending';
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const pipelineTopColors: Record<string, string> = {
    new: 'border-t-blue-500', contacted: 'border-t-amber-500',
    qualified: 'border-t-emerald-500', consultation_scheduled: 'border-t-purple-500',
    retained: 'border-t-teal-500', lost: 'border-t-red-500', nurturing: 'border-t-slate-400',
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="card-premium p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="border-l-2 border-[#c9a84c] pl-4">
              <h2 className="text-xl font-bold text-[#0c1e3c]">Leads Pipeline</h2>
              <p className="text-sm text-slate-500">{total} total leads</p>
            </div>
            <Badge className="bg-[#0c1e3c] text-white text-[10px] font-semibold ml-2 hover:bg-[#0c1e3c]">{total}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onRefresh} className="text-slate-500 hover:text-[#0c1e3c]">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" className="btn-gold px-4">
              <Plus className="w-4 h-4 mr-1.5" /> New Lead
            </Button>
          </div>
        </div>

        {/* Pipeline Count Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          {['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'nurturing'].map(status => {
            const count = leads.filter(l => l.status === status).length;
            return (
              <div key={status} className={`text-center p-2.5 rounded-lg bg-white border border-slate-100 border-t-2 ${pipelineTopColors[status] || 'border-t-slate-300'}`}>
                <div className="text-lg font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{count}</div>
                <div className="text-[10px] text-slate-500 capitalize">{status.replace(/_/g, ' ')}</div>
              </div>
            );
          })}
        </div>

        {/* Lead Cards */}
        <div className="space-y-3 stagger-children">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No leads found</p>
              <p className="text-[11px] text-slate-300 mt-1">Add a new lead to start tracking your pipeline</p>
            </div>
          ) : (
            leads.map(l => {
              const SourceIcon = sourceIcons[l.source] || AlertCircle;
              const leadName = [l.first_name, l.last_name].filter(Boolean).join(' ') || l.name || '-';
              return (
                <div key={l.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200" style={{ borderLeft: `3px solid ${statusBorderColor[l.status] || '#94a3b8'}` }}>
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-[#0c1e3c]/5 text-[#0c1e3c] text-xs font-bold">
                      {leadName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0c1e3c] text-sm">{leadName}</span>
                      <span className={`badge-status ${statusBadgeClass(l.status)}`}>{(l.status || '').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.email && <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{l.email}
                      </span>}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <SourceIcon className="w-3 h-3" />{(l.source || '').replace(/_/g, ' ')}
                      </span>
                      {l.case_type && <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />{l.case_type.replace(/_/g, ' ')}
                      </span>}
                    </div>
                  </div>
                  {/* Score */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${scoreColor(l.lead_score || 0)}`}>
                    <span className="text-sm font-bold">{l.lead_score || 0}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="hover-lift">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => onPageChange(p)}
                  className={p === page ? 'btn-navy' : 'hover-lift'}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="hover-lift">
              <ChevronRight className="w-4 h-4" />
            </Button>
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
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [dragActive, setDragActive] = useState(false);
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

  // Document type visual config: icon + colors
  const docTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    contract: { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    court_filing: { icon: Gavel, color: 'text-red-600', bg: 'bg-red-50' },
    affidavit: { icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50' },
    correspondence: { icon: Mail, color: 'text-teal-600', bg: 'bg-teal-50' },
    evidence: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    financial: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    medical: { icon: ShieldCheck, color: 'text-[#a88832]', bg: 'bg-[#c9a84c]/10' },
    police_report: { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50' },
    id_document: { icon: KeyRound, color: 'text-orange-600', bg: 'bg-orange-50' },
    other: { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
  };

  const statusBadge: Record<string, string> = {
    uploading: 'bg-amber-50 text-amber-700 before:bg-amber-500',
    uploaded: 'bg-blue-50 text-blue-700 before:bg-blue-500',
    reviewing: 'bg-purple-50 text-purple-700 before:bg-purple-500',
    approved: 'bg-emerald-50 text-emerald-700 before:bg-emerald-500',
    rejected: 'bg-red-50 text-red-700 before:bg-red-500',
    archived: 'bg-slate-100 text-slate-500 before:bg-slate-400',
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    if (docTypeFilter !== 'all' && doc.document_type !== docTypeFilter) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (searchFilter && !doc.file_name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ═══════════════════════════════════════════
          HEADER — Gold Left-Border Accent
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="border-l-2 border-[#c9a84c] pl-4">
          <h2 className="text-xl font-bold text-[#0c1e3c]">Documents</h2>
          <p className="text-sm text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-slate-200 text-slate-600 hover:border-[#0c1e3c] hover:text-[#0c1e3c] transition-all duration-200">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-gold">
                <Upload className="w-4 h-4 mr-1" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg animate-scale-in">
              <div className="card-premium">
                <DialogHeader>
                  <DialogTitle className="text-[#0c1e3c] text-lg font-semibold">Upload Document</DialogTitle>
                  <DialogDescription className="text-slate-500">Upload a document to the case management system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Drag-drop area */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${dragActive ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-slate-200 hover:border-[#c9a84c]/40 hover:bg-slate-50/50'}`}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => { e.preventDefault(); setDragActive(false); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Drag & drop files here</p>
                    <p className="text-[11px] text-slate-400 mt-1">or click to browse</p>
                    <p className="text-[10px] text-slate-400 mt-2">Max 10MB · PDF, DOC, DOCX, TXT, JPG, PNG</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Title</Label>
                    <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Document title" className="mt-1 input-premium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Document Type</Label>
                      <Select value={uploadType} onValueChange={setUploadType}>
                        <SelectTrigger className="mt-1 input-premium"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id_document">ID Document</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="court_filing">Court Filing</SelectItem>
                          <SelectItem value="correspondence">Correspondence</SelectItem>
                          <SelectItem value="evidence">Evidence</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="medical">Medical Record</SelectItem>
                          <SelectItem value="police_report">Police Report</SelectItem>
                          <SelectItem value="affidavit">Affidavit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Case ID</Label>
                      <Input value={uploadCaseId} onChange={e => setUploadCaseId(e.target.value)} placeholder="Enter case ID" className="mt-1 input-premium" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Description (Optional)</Label>
                    <Textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description..." className="mt-1 input-premium" rows={2} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleUpload} disabled={uploading || !uploadTitle || !uploadCaseId} className="btn-gold">
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FILTER BAR — Premium Inputs
          ═══════════════════════════════════════════ */}
      <div className="card-premium p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="pl-9 h-8 text-sm input-premium"
            />
          </div>
          <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-sm input-premium">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="id_document">ID Document</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="court_filing">Court Filing</SelectItem>
              <SelectItem value="correspondence">Correspondence</SelectItem>
              <SelectItem value="evidence">Evidence</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="medical">Medical Record</SelectItem>
              <SelectItem value="police_report">Police Report</SelectItem>
              <SelectItem value="affidavit">Affidavit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm input-premium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="uploading">Uploading</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {(docTypeFilter !== 'all' || statusFilter !== 'all' || searchFilter) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-[#0c1e3c]" onClick={() => { setDocTypeFilter('all'); setStatusFilter('all'); setSearchFilter(''); }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DOCUMENT LIST — Refined List Format
          ═══════════════════════════════════════════ */}
      {filteredDocs.length === 0 ? (
        <div className="card-premium p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No documents yet</p>
          <p className="text-sm text-slate-400 mt-1">{documents.length === 0 ? 'Upload your first document to get started' : 'No documents match your filters'}</p>
          {documents.length === 0 && (
            <Button className="btn-gold mt-4" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          )}
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="divide-y divide-slate-100/80 stagger-children">
            {filteredDocs.map(doc => {
              const typeConfig = docTypeConfig[doc.document_type] || docTypeConfig.other;
              const TypeIcon = typeConfig.icon;
              return (
                <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-all duration-200 group">
                  {/* File type icon — colored by document type */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                    <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                  </div>
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0c1e3c] truncate">{doc.file_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 capitalize">{doc.document_type?.replace(/_/g, ' ')}</span>
                      {doc.case && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 truncate">{doc.case.title}</span>
                        </>
                      )}
                      {doc.uploaded_by_user && (
                        <>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-[7px] bg-[#0c1e3c] text-white">
                                {doc.uploaded_by_user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-slate-500">{doc.uploaded_by_user.full_name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* File size */}
                  {doc.file_size && (
                    <span className="text-[11px] text-slate-400 hidden sm:block">{formatFileSize(doc.file_size)}</span>
                  )}
                  {/* Version */}
                  <span className="text-[11px] text-slate-400 hidden md:block">v{doc.version}</span>
                  {/* Date */}
                  <span className="text-[11px] text-slate-400 hidden lg:block">{new Date(doc.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {/* Status badge */}
                  <span className={`badge-status text-[10px] ${statusBadge[doc.status] || 'bg-slate-100 text-slate-500 before:bg-slate-400'}`}>
                    {doc.status}
                  </span>
                  {/* Hover actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {doc.file_name && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-[#0c1e3c]">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-[#0c1e3c]">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CONSULTATIONS VIEW — Premium Detail View
// ============================================
function ConsultationsView({ token, consultations, onRefresh, user, staff }: {
  token: string | null; consultations: Consultation[]; onRefresh: () => void; user: User | null; staff: StaffMember[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_name: '', client_email: '', attorney_id: '', case_id: '',
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
        setForm({ client_name: '', client_email: '', attorney_id: '', case_id: '', scheduled_at: '', duration_minutes: 60, meeting_type: 'in_person', notes: '' });
        onRefresh();
      }
    } catch (e) {
      console.error('Create consultation error:', e);
    }
    setCreating(false);
  };

  // Status badge colors with dot indicator
  const statusBadge: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 before:bg-blue-500',
    confirmed: 'bg-emerald-50 text-emerald-700 before:bg-emerald-500',
    in_progress: 'bg-purple-50 text-purple-700 before:bg-purple-500',
    completed: 'bg-slate-100 text-slate-600 before:bg-slate-400',
    cancelled: 'bg-red-50 text-red-700 before:bg-red-500',
    no_show: 'bg-orange-50 text-orange-700 before:bg-orange-500',
  };

  // Meeting type visual config
  const meetingConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    in_person: { icon: MapPin, color: 'text-[#a88832]', bg: 'bg-[#c9a84c]/10', label: 'In Person' },
    video_call: { icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Video Call' },
    phone_call: { icon: PhoneCall, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Phone Call' },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ═══════════════════════════════════════════
          HEADER — Gold Left-Border Accent
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="border-l-2 border-[#c9a84c] pl-4">
          <h2 className="text-xl font-bold text-[#0c1e3c]">Consultations</h2>
          <p className="text-sm text-slate-500">{consultations.length} consultation{consultations.length !== 1 ? 's' : ''} logged</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} className="border-slate-200 text-slate-600 hover:border-[#0c1e3c] hover:text-[#0c1e3c] transition-all duration-200">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-gold">
                <Plus className="w-4 h-4 mr-1" /> Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg animate-scale-in">
              <div className="card-premium">
                <DialogHeader>
                  <DialogTitle className="text-[#0c1e3c] text-lg font-semibold">Schedule Consultation</DialogTitle>
                  <DialogDescription className="text-slate-500">Schedule or log a client consultation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Client Name</Label>
                      <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" className="mt-1 input-premium" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Client Email</Label>
                      <Input value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="email@infinitylegal.org" className="mt-1 input-premium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Attorney</Label>
                      <Select value={form.attorney_id} onValueChange={v => setForm(f => ({ ...f, attorney_id: v }))}>
                        <SelectTrigger className="mt-1 input-premium"><SelectValue placeholder="Select attorney" /></SelectTrigger>
                        <SelectContent>
                          {attorneys.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Meeting Type</Label>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(meetingConfig).map(([key, cfg]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, meeting_type: key }))}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border-2 transition-all duration-200 text-xs font-medium ${form.meeting_type === key ? `${cfg.bg} ${cfg.color} border-current` : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                          >
                            <cfg.icon className="w-4 h-4" />
                            <span className="text-[10px]">{cfg.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Date & Time</Label>
                      <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1 input-premium" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Duration</Label>
                      <Select value={String(form.duration_minutes)} onValueChange={v => setForm(f => ({ ...f, duration_minutes: parseInt(v) }))}>
                        <SelectTrigger className="mt-1 input-premium"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Consultation notes..." className="mt-1 input-premium" rows={3} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleCreate} disabled={creating || !form.attorney_id || !form.scheduled_at} className="btn-gold">
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
                    Schedule
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CONSULTATION CARDS — 2-Column Premium Grid
          ═══════════════════════════════════════════ */}
      {consultations.length === 0 ? (
        <div className="card-premium p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No consultations yet</p>
          <p className="text-sm text-slate-400 mt-1">Schedule your first consultation to get started</p>
          <Button className="btn-gold mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Schedule Consultation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {consultations.map(c => {
            const mConfig = meetingConfig[c.meeting_type] || meetingConfig.in_person;
            const MIcon = mConfig.icon;
            return (
              <div key={c.id} className="card-premium p-5 hover-lift">
                <div className="flex items-start gap-3">
                  {/* Meeting type icon with colored background */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${mConfig.bg}`}>
                    <MIcon className={`w-5 h-5 ${mConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Client name + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-[#0c1e3c] truncate">{c.client?.full_name || 'Client'}</div>
                      <span className={`badge-status text-[10px] flex-shrink-0 ${statusBadge[c.status] || 'bg-slate-100 text-slate-500 before:bg-slate-400'}`}>
                        {c.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {/* Attorney with avatar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[8px] bg-[#0c1e3c] text-white">
                          {c.attorney?.profile?.full_name?.split(' ').map(n => n[0]).join('') || c.attorney?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-slate-500">{c.attorney?.profile?.full_name || c.attorney?.full_name || 'Attorney'}</span>
                    </div>
                    {/* Date & Time elegantly formatted */}
                    {c.scheduled_at && (
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(c.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTime(c.scheduled_at)}</span>
                        </div>
                      </div>
                    )}
                    {/* Duration badge + case reference */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        <Clock className="w-3 h-3" />
                        {c.duration_minutes} min
                      </span>
                      {c.case && (
                        <span className="text-[10px] text-slate-400 truncate">{c.case.title}</span>
                      )}
                    </div>
                    {/* Notes preview */}
                    {c.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{c.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  const priorityDotClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 animate-pulse';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-slate-300';
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-active';
      case 'in_progress': return 'badge-pending';
      case 'pending': return 'badge-pending';
      case 'cancelled': return 'badge-closed';
      default: return 'badge-pending';
    }
  };

  const getRelativeDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`, color: 'text-red-600 bg-red-50' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600 bg-orange-50' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-amber-600 bg-amber-50' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-slate-600 bg-slate-50' };
    return { text: due.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), color: 'text-slate-500 bg-slate-50' };
  };

  // Sort tasks by priority
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="card-premium p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="border-l-2 border-[#c9a84c] pl-4">
              <h2 className="text-xl font-bold text-[#0c1e3c]">Tasks</h2>
              <p className="text-sm text-slate-500">{tasks.length} total tasks</p>
            </div>
            <Badge className="bg-[#0c1e3c] text-white text-[10px] font-semibold ml-2 hover:bg-[#0c1e3c]">{tasks.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onRefresh} className="text-slate-500 hover:text-[#0c1e3c]">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" className="btn-gold px-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2 stagger-children">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 animate-float">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No tasks found</p>
              <p className="text-[11px] text-slate-300 mt-1">Create a new task to get started</p>
            </div>
          ) : (
            sortedTasks.map(task => {
              const dueInfo = getRelativeDueDate(task.due_date);
              return (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                  {/* Priority indicator — checkbox-style */}
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${priorityDotClass(task.priority)}`} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-[#0c1e3c]'}`}>
                        {task.title}
                      </span>
                      <span className={`badge-status ${statusBadgeClass(task.status)}`}>{task.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.assignee?.full_name && (
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Avatar className="w-4 h-4"><AvatarFallback className="text-[6px] bg-[#0c1e3c]/5 text-[#0c1e3c]">{task.assignee.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback></Avatar>
                          {task.assignee.full_name}
                        </span>
                      )}
                      {task.case && <span className="text-xs text-slate-500 flex items-center gap-1"><Briefcase className="w-3 h-3" />{task.case.title}</span>}
                    </div>
                  </div>
                  {/* Due date — relative */}
                  {dueInfo && (
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md flex-shrink-0 ${dueInfo.color}`}>{dueInfo.text}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0c1e3c] border-l-2 border-[#c9a84c] pl-3">Create Task</DialogTitle>
            <DialogDescription>Assign a new task to a team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="mt-1 input-premium focus:ring-0" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." className="mt-1 input-premium focus:ring-0" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assign To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                  <SelectTrigger className="mt-1 input-premium focus:ring-0"><SelectValue placeholder="Select staff" /></SelectTrigger>
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
                  <SelectTrigger className="mt-1 input-premium focus:ring-0"><SelectValue /></SelectTrigger>
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
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1 input-premium focus:ring-0" />
              </div>
              <div>
                <Label>Case ID (Optional)</Label>
                <Input value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} placeholder="Link to case" className="mt-1 input-premium focus:ring-0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={creating || !form.title || !form.assigned_to} className="btn-gold">
              {creating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// STAFF PORTAL VIEW
// ============================================
function StaffPortal({ staff, user }: { staff: StaffMember[]; user: User | null }) {
  const [filterRole, setFilterRole] = useState('all');

  const roles = [...new Set(staff.map(s => s.role))];

  const filtered = staff.filter(s => {
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    return true;
  });

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', admin: 'Admin',
    attorney: 'Attorney', paralegal: 'Paralegal',
    systems_admin: 'Systems Admin', client: 'Client',
  };

  const roleBadgeVariant: Record<string, string> = {
    managing_director: 'badge-status badge-active',
    admin: 'badge-status badge-active',
    attorney: 'badge-status badge-pending',
    paralegal: 'badge-status badge-closed',
    systems_admin: 'badge-status badge-urgent',
    client: 'badge-status badge-closed',
  };

  const hasGoldRing = (role: string) => ['managing_director', 'admin', 'attorney'].includes(role);

  // Group by role
  const grouped = filtered.reduce((acc, s) => {
    const group = s.role || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with gold left-border accent */}
      <div className="flex items-center justify-between">
        <div className="border-l-2 border-[#c9a84c] pl-4">
          <h2 className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Staff Portal</h2>
          <p className="text-sm text-slate-500 mt-0.5">{staff.length} team members</p>
        </div>
        <Badge className="bg-[#c9a84c]/10 text-[#a88832] text-[10px] font-semibold border-0">
          <Users className="w-3 h-3 mr-1" />
          {roles.length} Roles
        </Badge>
      </div>

      {/* Horizontal pill-style role filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            filterRole === 'all' ? 'btn-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Roles
        </button>
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 capitalize ${
              filterRole === r ? 'btn-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {roleLabels[r] || r.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Staff grid by role group */}
      {Object.entries(grouped).map(([group, members]) => (
        <div key={group}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 rounded-full bg-[#c9a84c]" />
            <h3 className="text-sm font-semibold text-[#0c1e3c] uppercase tracking-wider capitalize">
              {roleLabels[group] || group.replace(/_/g, ' ')}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">({members.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {members.map(m => (
              <div key={m.id} className="card-premium p-4 group relative">
                <div className="flex items-start gap-3">
                  {/* Avatar with gold ring for attorneys/admins */}
                  <div className={`relative flex-shrink-0 ${hasGoldRing(m.role) ? 'ring-2 ring-[#c9a84c]/40 ring-offset-2 ring-offset-white rounded-full' : ''}`}>
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className={`text-xs font-bold ${
                        m.role === 'managing_director' ? 'bg-[#c9a84c] text-[#0c1e3c]' :
                        m.role === 'attorney' ? 'bg-[#0c1e3c] text-[#c9a84c]' :
                        m.role === 'admin' ? 'bg-blue-600 text-white' :
                        m.role === 'paralegal' ? 'bg-purple-600 text-white' :
                        m.role === 'systems_admin' ? 'bg-red-600 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {m.role === 'managing_director' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#c9a84c] rounded-full flex items-center justify-center">
                        <Crown className="w-2.5 h-2.5 text-[#0c1e3c]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0c1e3c] text-sm truncate">{m.full_name}</div>
                    <div className={`mt-1 ${roleBadgeVariant[m.role] || 'badge-status badge-closed'}`}>
                      {roleLabels[m.role] || m.role.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0 text-slate-400" />{m.email}
                    </div>
                    {m.phone && (
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />{m.phone}
                      </div>
                    )}
                  </div>
                </div>
                {/* Hover contact actions */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-3 px-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#0c1e3c]/5 hover:bg-[#0c1e3c]/10 text-[#0c1e3c] text-[10px] font-medium transition-colors duration-200"
                    onClick={() => window.open(`mailto:${m.email}`, '_blank')}
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  {m.phone && (
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 text-[#a88832] text-[10px] font-medium transition-colors duration-200"
                      onClick={() => window.open(`tel:${m.phone}`, '_blank')}
                    >
                      <Phone className="w-3 h-3" /> Call
                    </button>
                  )}
                </div>
              </div>
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
    'Executive Leadership': { tier: 1, label: 'Executive Leadership', roles: ['managing_director'] },
    'Management': { tier: 2, label: 'Management', roles: ['admin', 'systems_admin'] },
    'Legal Practice': { tier: 3, label: 'Legal Practice', roles: ['attorney'] },
    'Support Staff': { tier: 4, label: 'Support Staff', roles: ['paralegal'] },
  };

  const roleLabels: Record<string, string> = {
    managing_director: 'Managing Director', admin: 'Admin',
    attorney: 'Attorney', paralegal: 'Paralegal',
    systems_admin: 'Systems Admin', client: 'Client',
  };

  const tierIcons: Record<number, React.ReactNode> = {
    1: <Crown className="w-5 h-5" />,
    2: <Shield className="w-5 h-5" />,
    3: <Gavel className="w-5 h-5" />,
    4: <Briefcase className="w-5 h-5" />,
  };

  const tierColors: Record<number, string> = {
    1: 'bg-[#c9a84c] text-[#0c1e3c]',
    2: 'bg-[#0c1e3c] text-[#c9a84c]',
    3: 'bg-blue-600 text-white',
    4: 'bg-emerald-600 text-white',
  };

  const sortedHierarchy = Object.entries(hierarchy).sort((a, b) => a[1].tier - b[1].tier);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with gold left-border accent */}
      <div className="flex items-center justify-between">
        <div className="border-l-2 border-[#c9a84c] pl-4">
          <h2 className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Organizational Structure</h2>
          <p className="text-sm text-slate-500 mt-0.5">Infinity Legal (Pty) Ltd — Hierarchical Order</p>
        </div>
        <Badge className="bg-[#c9a84c]/10 text-[#a88832] text-[10px] font-semibold border-0">
          <Users className="w-3 h-3 mr-1" />
          {staff.length} Members
        </Badge>
      </div>

      {/* Hierarchy tree */}
      <div className="space-y-0 stagger-children">
        {sortedHierarchy.map(([key, group], idx) => {
          const members = staff.filter(s => group.roles.includes(s.role));
          return (
            <div key={key} className="relative">
              {/* Connecting line between tiers using divider-gold */}
              {idx > 0 && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex flex-col items-center">
                    <div className="w-[2px] h-4 bg-gradient-to-b from-[#c9a84c]/30 to-[#c9a84c]/15" />
                    <ChevronRight className="w-3 h-3 text-[#c9a84c]/40 rotate-90 -mt-1" />
                  </div>
                </div>
              )}

              {/* Role group container */}
              <div className="card-premium p-0 overflow-visible">
                {/* Tier header band */}
                <div className={`flex items-center gap-3 px-5 py-3 ${
                  group.tier === 1 ? 'gradient-gold-subtle' :
                  group.tier === 2 ? 'bg-[#0c1e3c]/5' :
                  group.tier === 3 ? 'bg-blue-50/50' :
                  'bg-emerald-50/50'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tierColors[group.tier] || 'bg-slate-100 text-slate-700'}`}>
                    {tierIcons[group.tier] || <Building className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0c1e3c] text-sm">{group.label}</h3>
                    <p className="text-[10px] text-slate-500">Tier {group.tier} · {members.length} {members.length === 1 ? 'member' : 'members'}</p>
                  </div>
                  {group.tier === 1 && (
                    <Badge className="bg-[#c9a84c]/15 text-[#a88832] text-[9px] font-semibold border-0">
                      <Star className="w-2.5 h-2.5 mr-0.5" /> Leadership
                    </Badge>
                  )}
                </div>

                {/* Members row — horizontal band */}
                <div className="px-5 py-3">
                  {members.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-[#c9a84c]/30 hover:shadow-sm transition-all duration-200 group/card">
                          <Avatar className={`w-7 h-7 ${group.tier === 1 ? 'ring-2 ring-[#c9a84c]/40 ring-offset-1 ring-offset-white' : ''}`}>
                            <AvatarFallback className={`text-[9px] font-bold ${
                              group.tier === 1 ? 'bg-[#c9a84c] text-[#0c1e3c]' :
                              group.tier === 2 ? 'bg-[#0c1e3c] text-[#c9a84c]' :
                              group.tier === 3 ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {m.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-medium text-[#0c1e3c] group-hover/card:text-[#a88832] transition-colors">{m.full_name}</div>
                            <div className="text-[9px] text-slate-400">{roleLabels[m.role] || m.role.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400 italic">No staff members in this tier</p>
                    </div>
                  )}
                </div>
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with gold left-border accent */}
      <div className="flex items-center justify-between">
        <div className="border-l-2 border-[#c9a84c] pl-4">
          <h2 className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Analytics Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Firm performance metrics and insights</p>
        </div>
        <button className="btn-gold px-4 py-2 text-xs flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>

      {stats && (
        <>
          {/* Stats overview grid — stat-card */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
            {[
              { label: 'Total Revenue', value: `R${(stats.totalRevenue / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'text-[#a88832] bg-[#c9a84c]/10', border: 'border-l-[#c9a84c]', trend: true },
              { label: 'Active Cases', value: stats.activeCases, icon: FolderKanban, color: 'text-emerald-700 bg-emerald-50', border: 'border-l-emerald-500' },
              { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-purple-700 bg-purple-50', border: 'border-l-purple-500' },
              { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'text-blue-700 bg-blue-50', border: 'border-l-blue-500' },
            ].map(card => (
              <div key={card.label} className={`stat-card border-l-4 ${card.border}`}>
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  {card.trend && (
                    <div className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>12%</span>
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

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Status Distribution — refined horizontal bars */}
            <div className="card-premium">
              <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#c9a84c]" />
                  <h3 className="text-sm font-semibold text-[#0c1e3c]">Case Status Distribution</h3>
                </div>
                <span className="text-[10px] text-slate-400">{stats.totalCases} total</span>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { status: 'Active', count: stats.activeCases, total: stats.totalCases || 1, from: 'from-emerald-500', to: 'to-emerald-400', dot: 'bg-emerald-500' },
                  { status: 'Pending Review', count: stats.pendingCases, total: stats.totalCases || 1, from: 'from-amber-500', to: 'to-amber-400', dot: 'bg-amber-500' },
                  { status: 'Closed', count: stats.closedCases, total: stats.totalCases || 1, from: 'from-slate-400', to: 'to-slate-300', dot: 'bg-slate-400' },
                ].map(item => {
                  const pct = Math.round((item.count / item.total) * 100);
                  return (
                    <div key={item.status} className="group hover:bg-slate-50/50 rounded-lg -mx-1 px-1 py-1 transition-colors duration-150">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                          <span className="text-xs font-medium text-slate-700">{item.status}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#0c1e3c]">{pct}% <span className="text-slate-400 font-normal">({item.count})</span></span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-[6px] overflow-hidden">
                        <div className={`bg-gradient-to-r ${item.from} ${item.to} rounded-full h-[6px] transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Overview */}
            <div className="card-premium">
              <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#c9a84c]" />
                  <h3 className="text-sm font-semibold text-[#0c1e3c]">Task Overview</h3>
                </div>
                <span className="text-[10px] text-slate-400">{stats.pendingTasks + stats.overdueTasks} open</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { status: 'Pending Tasks', count: stats.pendingTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-400' },
                  { status: 'Overdue Tasks', count: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-l-red-400' },
                  { status: 'Total Documents', count: stats.totalDocuments, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-400' },
                  { status: 'Attorneys', count: stats.totalAttorneys, icon: Users, color: 'text-[#a88832]', bg: 'bg-[#c9a84c]/10', border: 'border-l-[#c9a84c]' },
                ].map(item => (
                  <div key={item.status} className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${item.border} ${item.bg} hover:shadow-sm transition-all duration-200`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{item.status}</span>
                    </div>
                    <span className="text-lg font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue card — bottom row */}
          <div className="card-navy p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#c9a84c]" />
              </div>
              <div>
                <p className="text-[#8fa4c4] text-xs uppercase tracking-wider font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-0.5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>R{(stats.totalRevenue / 1000000).toFixed(2)}M</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +12.3%
                </div>
                <p className="text-[9px] text-[#7a94b8] mt-0.5">vs last quarter</p>
              </div>
              <button className="btn-gold px-3.5 py-2 text-xs flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>
        </>
      )}

      {!stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center space-y-2">
                <Skeleton className="w-8 h-8 rounded-lg mx-auto" />
                <Skeleton className="h-5 w-16 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRICING VIEW
// ============================================
function PricingView({ plans }: { plans: any[] }) {
  const { accessToken } = useAuth();
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const planStyleMap: Record<string, { isPopular: boolean; badge: string | null }> = {
    civil_legal_plan: { isPopular: false, badge: null },
    labour_legal_plan: { isPopular: true, badge: 'Most Popular' },
    extensive_plan: { isPopular: false, badge: 'Best Value' },
  };

  const defaultPlanStyle = { isPopular: false, badge: null };

  const handleSubscribe = async (planId: string) => {
    if (!accessToken) {
      toast.error('Please sign in to subscribe');
      return;
    }
    setSubscribingPlanId(planId);
    try {
      const res = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ planId, billingCycle: 'monthly' }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Create and submit hidden form to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.data.payfastUrl;
        Object.entries(data.data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        const errorMsg = data.error?.message || data.error || 'Failed to initiate payment';
        if (res.status === 409) {
          toast.error('Active subscription found', { description: 'You already have an active subscription.' });
        } else {
          toast.error('Payment failed', { description: errorMsg });
        }
      }
    } catch {
      toast.error('Network error', { description: 'Could not connect to the payment service.' });
    } finally {
      setSubscribingPlanId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with gold left-border accent */}
      <div className="text-center">
        <div className="inline-block border-l-2 border-[#c9a84c] pl-4 text-left">
          <h2 className="text-xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Pricing Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">All prices in South African Rand (ZAR). POPIA compliant by default.</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No pricing plans available</p>
          <p className="text-[11px] text-slate-300 mt-1">Plans will appear here when configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {plans.map(plan => {
            const style = planStyleMap[plan.slug] || defaultPlanStyle;
            const features = Array.isArray(plan.features) ? plan.features : [];
            const isPopular = style.isPopular;
            const isSubscribing = subscribingPlanId === plan.id;

            return (
              <div key={plan.id} className={`relative ${isPopular ? 'card-navy p-0' : 'card-premium p-0'} ${isPopular ? 'ring-2 ring-[#c9a84c]/40' : ''}`}>
                {/* Badge */}
                {style.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-semibold ${
                      isPopular ? 'bg-[#c9a84c] text-[#0c1e3c]' : 'bg-emerald-600 text-white'
                    }`}>
                      {style.badge}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan name */}
                  <h3 className={`font-semibold text-base ${isPopular ? 'text-white' : 'text-[#0c1e3c]'}`}>{plan.name}</h3>
                  {plan.description && (
                    <p className={`text-[11px] mt-0.5 ${isPopular ? 'text-[#8fa4c4]' : 'text-slate-400'}`}>{plan.description}</p>
                  )}

                  {/* Price display — large serif font */}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${isPopular ? 'text-[#c9a84c]' : 'text-[#0c1e3c]'}`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      R{Math.round(plan.price_monthly)}
                    </span>
                    <span className={`text-sm ${isPopular ? 'text-[#8fa4c4]' : 'text-slate-400'}`}>/month</span>
                  </div>

                  {/* Annual savings */}
                  {plan.price_annual && (
                    <p className={`text-xs mt-1 ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      R{Math.round(plan.price_annual)}/year — save {Math.round((1 - plan.price_annual / (plan.price_monthly * 12)) * 100)}%
                    </p>
                  )}

                  {/* Divider */}
                  <div className={`my-4 ${isPopular ? 'divider-gold' : 'h-px bg-slate-100'}`} />

                  {/* Features list — checkmark with gold accents */}
                  <ul className="space-y-2.5">
                    {features.map((f: string, i: number) => (
                      <li key={i} className={`flex items-start gap-2.5 text-xs ${isPopular ? 'text-[#c4d4e8]' : 'text-slate-600'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPopular ? 'bg-[#c9a84c]/20' : 'bg-[#c9a84c]/10'
                        }`}>
                          <CheckCircle2 className={`w-3 h-3 ${isPopular ? 'text-[#c9a84c]' : 'text-[#a88832]'}`} />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button — actual PayFast checkout */}
                  <button
                    className={`w-full mt-5 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isPopular ? 'btn-gold' : 'btn-navy'
                    } ${isSubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribingPlanId !== null}
                  >
                    {isSubscribing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Subscribe — R{Math.round(plan.price_monthly)}/mo</>
                    )}
                  </button>
                </div>
              </div>
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
  const { accessToken } = useAuth();
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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
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
      {/* Floating bubble — gold gradient with pulse */}
      <div className="fixed bottom-6 right-6 z-50 group/bubble">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a84c] via-[#d4b85c] to-[#a88832] text-[#0c1e3c] shadow-lg hover:shadow-xl hover:shadow-[#c9a84c]/20 transition-all duration-300 flex items-center justify-center animate-pulse-gold"
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
        {/* Tooltip on hover */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-[#0c1e3c] text-white text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
              Ask Infinity
              <div className="absolute -bottom-1 right-5 w-2 h-2 bg-[#0c1e3c] rotate-45" />
            </div>
          </div>
        )}
      </div>

      {/* Chat popup — premium dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] card-premium flex flex-col overflow-hidden animate-scale-in" style={{ height: '520px' }}>
          {/* Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#0c1e3c] to-[#132d52] rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              {/* AI avatar — navy circle with gold sparkle */}
              <div className="w-9 h-9 rounded-full bg-[#0c1e3c] border-2 border-[#c9a84c]/40 flex items-center justify-center shadow-inner">
                <Sparkles className="w-4 h-4 text-[#c9a84c]" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Ask Infinity</span>
                <div className="flex items-center gap-1.5">
                  <p className="text-[9px] text-[#8fa4c4]">AI Legal Assistant · SA Law</p>
                  {lastProvider && providerLabel[lastProvider] && (
                    <span className="text-[7px] bg-[#c9a84c]/20 text-[#c9a84c] px-1.5 py-0.5 rounded-full font-medium">
                      {providerLabel[lastProvider]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-[#7a94b8] hover:text-[#c9a84c] p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                title="Clear chat"
                aria-label="Clear chat history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#7a94b8] hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gradient-to-b from-slate-50 to-white custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#0c1e3c] to-[#132d52] text-white shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-700 shadow-sm'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#0c1e3c] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-2 h-2 text-[#c9a84c]" />
                      </div>
                      <span className="text-[9px] font-semibold text-[#0c1e3c]">Ask Infinity</span>
                      {msg.provider && providerLabel[msg.provider] && msg.provider !== 'system' && (
                        <span className="text-[7px] bg-[#c9a84c]/10 text-[#a88832] px-1 py-0.5 rounded font-medium ml-0.5">
                          {providerLabel[msg.provider]}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#0c1e3c] flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-[#c9a84c] animate-pulse" />
                    </div>
                    <span className="text-xs text-slate-500">Thinking...</span>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* POPIA + Free AI badges */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[7px] bg-[#0c1e3c]/5 text-slate-500 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                <Shield className="w-2 h-2" />
                POPIA
              </span>
              <span className="text-[7px] bg-[#c9a84c]/10 text-[#a88832] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                <Zap className="w-2 h-2" />
                Free AI
              </span>
            </div>
            <span className="text-[7px] text-slate-400">Not legal advice</span>
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-slate-100 bg-white flex-shrink-0 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about SA law..."
                aria-label="Type your legal question for Ask Infinity"
                className="flex-1 input-premium px-3 py-2 text-xs rounded-lg"
                disabled={isLoading}
                maxLength={2000}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="btn-gold h-8 w-8 p-0 flex items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
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

