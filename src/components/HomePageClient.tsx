'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FolderKanban, Target, FileText, Shield, TrendingUp,
  Bell, Search, ChevronRight, CheckCircle2,
  LogOut, DollarSign,
  Lock, RefreshCw, ChevronLeft, X,
  Zap, Crown, MessageSquare, LayoutDashboard,
  ShieldCheck, TreePine, BookOpen,
  Home as HomeIcon, CreditCard,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { LandingPage } from '@/components/LandingPage';
import { LoginScreen } from '@/components/LoginScreen';
import { useAuth } from '@/hooks/useAuth';
import type { View, UserRole, User, Stats, Consultation, DocumentItem, TaskItem, StaffMember, Notification } from '@/components/types';

// Dashboard view components
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { ClientMessagesView } from '@/components/dashboard/ClientMessagesView';
import { ClientSubscriptionView } from '@/components/dashboard/ClientSubscriptionView';
import { LegalAdvisorDashboard } from '@/components/dashboard/LegalAdvisorDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AdminClientsView } from '@/components/dashboard/AdminClientsView';
import { AdminSubscriptionsView } from '@/components/dashboard/AdminSubscriptionsView';
import { AskInfinityBubble } from '@/components/dashboard/AskInfinityBubble';

// Existing view components (reused)
import { CasesView } from '@/components/CasesView';
import { DocumentsView } from '@/components/DocumentsView';
import { LeadsView } from '@/components/LeadsView';
import { ConsultationsView } from '@/components/ConsultationsView';
import { TasksView } from '@/components/TasksView';
import { StaffPortal } from '@/components/StaffPortal';
import { OrgChartView } from '@/components/OrgChartView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { PricingView } from '@/components/PricingView';

// ============================================
// VIEW LABEL MAP
// ============================================
const viewLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  workbench: 'AI Workbench',
  cases: 'Cases',
  leads: 'Leads',
  documents: 'Documents',
  consultations: 'Consultations',
  tasks: 'Tasks',
  staff: 'Staff Portal',
  analytics: 'Analytics',
  pricing: 'Pricing',
  'org-chart': 'Organisation',
  subscription: 'Subscription',
  messages: 'Messages',
  clients: 'Clients',
  subscriptions: 'Subscriptions',
  home: 'Homepage',
  login: 'Sign In',
  signup: 'Sign Up',
};

const roleDisplayLabels: Record<string, string> = {
  managing_director: 'Managing Director',
  systems_admin: 'Systems Admin',
  attorney: 'Legal Advisor',
  candidate_attorney: 'Candidate Legal Advisor',
  paralegal: 'Paralegal',
  admin: 'Admin',
  client: 'Client',
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

const landingVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ============================================
// MAIN APP COMPONENT
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

  // URL-based routing
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get('v') as View | null;

  // Derive current view from URL
  const currentView: View = useMemo(() => {
    if (!viewParam) return 'dashboard';
    const validViews: View[] = ['dashboard', 'workbench', 'cases', 'leads', 'documents', 'consultations', 'tasks', 'staff', 'analytics', 'pricing', 'org-chart', 'subscription', 'messages', 'clients', 'subscriptions', 'home', 'login', 'signup'];
    return validViews.includes(viewParam) ? viewParam : 'dashboard';
  }, [viewParam]);

  // Navigation helper - uses URL routing
  const navigate = useCallback((view: View) => {
    if (view === 'dashboard') {
      router.push('/', { scroll: false });
    } else {
      router.push(`?v=${view}`, { scroll: false });
    }
  }, [router]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Data state
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
  const [subscription, setSubscription] = useState<any>(null);

  // UI state
  const [casesPage, setCasesPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(0);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevViewRef = useRef<View>(currentView);

  // Redirect from login/signup URL to dashboard after successful authentication
  useEffect(() => {
    if (isAuthenticated && (currentView === 'login' || currentView === 'signup')) {
      router.replace('/', { scroll: false });
    }
  }, [isAuthenticated, currentView, router]);

  // Scroll to top on view change
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      prevViewRef.current = currentView;
      // Scroll the content area to top
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentView]);

  // Loading timeout
  useEffect(() => {
    if (authLoading) {
      loadingTimerRef.current = setTimeout(() => setLoadingTimeout(true), 4000);
    }
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [authLoading]);

  // Data loading functions
  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setCharts(data.data.charts || null);
        setFirmHealth(data.data.health || {});
        if (data.data.cases && data.data.cases.length > 0 && cases.length === 0) {
          setCases(data.data.cases);
        }
        if (data.data.tasks && data.data.tasks.length > 0 && tasks.length === 0) {
          setTasks(data.data.tasks);
        }
        if (data.data.consultations && data.data.consultations.length > 0 && consultations.length === 0) {
          setConsultations(data.data.consultations);
        }
      }
    } catch (e) { console.error('Dashboard load error:', e); }
  }, [token, cases.length, tasks.length, consultations.length]);

  const loadCases = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/cases?page=${page}&perPage=10&search=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setCases(data.data.data); setCasesTotal(data.data.pagination.total); setCasesPage(page); }
    } catch (e) { console.error('Cases load error:', e); }
  }, [token, searchQuery]);

  const loadLeads = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/leads?page=${page}&perPage=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setLeads(data.data.data); setLeadsTotal(data.data.pagination.total); setLeadsPage(page); }
    } catch (e) { console.error('Leads load error:', e); }
  }, [token]);

  const loadConsultations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/consultations?perPage=50', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setConsultations(data.data.data || []);
    } catch (e) { console.error('Consultations load error:', e); }
  }, [token]);

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/documents?perPage=50', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDocuments(data.data.data || []);
    } catch (e) { console.error('Documents load error:', e); }
  }, [token]);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tasks?perPage=50', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTasks(data.data.data || []);
    } catch (e) { console.error('Tasks load error:', e); }
  }, [token]);

  const loadStaff = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff?perPage=100', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStaff(data.data.data || []);
    } catch (e) { console.error('Staff load error:', e); }
  }, [token]);

  const loadPricingPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/pricing');
      const data = await res.json();
      if (data.success) setPricingPlans(data.data || []);
    } catch (e) { console.error('Pricing load error:', e); }
  }, []);

  const loadSubscription = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data?.subscription) setSubscription(data.data.subscription);
      else setSubscription(null);
    } catch (e) { console.error('Subscription load error:', e); setSubscription(null); }
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications?perPage=20', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotifications(data.data.data || []);
    } catch (e) { console.error('Notifications load error:', e); }
  }, [token]);

  // Load data on view change
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      switch (currentView) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'cases':
          await loadCases(1);
          break;
        case 'leads':
          await loadLeads(1);
          break;
        case 'consultations':
          await loadConsultations();
          break;
        case 'documents':
          await loadDocuments();
          break;
        case 'tasks':
          await loadTasks();
          break;
        case 'staff':
        case 'org-chart':
          await loadStaff();
          break;
        case 'pricing':
        case 'subscription':
          await loadPricingPlans();
          await loadSubscription();
          break;
        case 'analytics':
          await loadDashboard();
          break;
        case 'clients':
          break;
        case 'subscriptions':
          break;
        case 'messages':
          break;
      }
    };
    loadData();
  }, [currentView, isAuthenticated, loadDashboard, loadCases, loadLeads, loadConsultations, loadDocuments, loadTasks, loadStaff, loadPricingPlans, loadSubscription]);

  // Load notifications and subscription on auth
  useEffect(() => {
    if (isAuthenticated && token) {
      void (async () => {
        try { await Promise.all([loadNotifications(), loadSubscription()]); } catch { /* ignore */ }
      })();
    }
  }, [isAuthenticated, token, loadNotifications, loadSubscription]);

  // ============================================
  // NAVIGATION ITEMS (role-based)
  // ============================================
  const getNavItems = (): { id: View; label: string; icon: any; group: string }[] => {
    const role = user?.role || 'client';
    const isClient = role === 'client';
    const isLegal = role === 'attorney' || role === 'paralegal';

    if (isClient) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
        { id: 'cases', label: 'My Cases', icon: FolderKanban, group: 'My Legal' },
        { id: 'documents', label: 'My Documents', icon: FileText, group: 'My Legal' },
        { id: 'consultations', label: 'Consultations', icon: BookOpen, group: 'My Legal' },
        { id: 'messages', label: 'Messages', icon: MessageSquare, group: 'My Legal' },
        { id: 'subscription', label: subscription ? 'My Plan' : 'Subscribe', icon: subscription ? Crown : Zap, group: 'Plan' },
      ];
    }

    if (isLegal) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
        { id: 'cases', label: 'My Cases', icon: FolderKanban, group: 'Practice' },
        { id: 'consultations', label: 'Consultations', icon: BookOpen, group: 'Practice' },
        { id: 'documents', label: 'Documents', icon: FileText, group: 'Practice' },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle2, group: 'Practice' },
        { id: 'staff', label: 'Staff Portal', icon: Users, group: 'Firm' },
        { id: 'org-chart', label: 'Org Structure', icon: TreePine, group: 'Firm' },
      ];
    }

    // Admin / Managing Director
    return [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, group: 'Main' },
      { id: 'cases', label: 'Cases', icon: FolderKanban, group: 'Practice' },
      { id: 'clients', label: 'Clients', icon: Users, group: 'Practice' },
      { id: 'leads', label: 'Leads', icon: Target, group: 'Practice' },
      { id: 'consultations', label: 'Consultations', icon: BookOpen, group: 'Practice' },
      { id: 'documents', label: 'Documents', icon: FileText, group: 'Practice' },
      { id: 'tasks', label: 'Tasks', icon: CheckCircle2, group: 'Practice' },
      { id: 'staff', label: 'Staff', icon: Users, group: 'Firm' },
      { id: 'org-chart', label: 'Org Structure', icon: TreePine, group: 'Firm' },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, group: 'Firm' },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, group: 'Insights' },
      { id: 'pricing', label: 'Pricing', icon: DollarSign, group: 'More' },
    ];
  };

  // ============================================
  // RENDER VIEW CONTENT
  // ============================================
  const renderView = () => {
    const role = user?.role || 'client';
    const isClient = role === 'client';
    const isManagement = ['managing_director', 'systems_admin'].includes(role);

    switch (currentView) {
      case 'dashboard':
        if (isClient) {
          return (
            <ClientDashboard
              user={user}
              stats={stats}
              cases={cases}
              consultations={consultations}
              tasks={tasks}
              subscription={subscription}
              onViewChange={navigate}
            />
          );
        }
        if (role === 'attorney' || role === 'paralegal') {
          return (
            <LegalAdvisorDashboard
              user={user}
              stats={stats}
              cases={cases}
              consultations={consultations}
              tasks={tasks}
              token={token}
              onViewChange={navigate}
              charts={charts}
              firmHealth={firmHealth}
            />
          );
        }
        if (isManagement) {
          return (
            <AdminDashboard
              user={user}
              stats={stats}
              cases={cases}
              leads={leads}
              staff={staff}
              token={token}
              onViewChange={navigate}
              charts={charts}
              firmHealth={firmHealth}
            />
          );
        }
        return (
          <ClientDashboard
            user={user}
            stats={stats}
            cases={cases}
            consultations={consultations}
            tasks={tasks}
            subscription={subscription}
            onViewChange={navigate}
          />
        );

      case 'cases':
        return <CasesView cases={cases} page={casesPage} total={casesTotal} onPageChange={loadCases} onRefresh={() => loadCases(casesPage)} loading={false} />;

      case 'leads':
        return <LeadsView leads={leads} page={leadsPage} total={leadsTotal} onPageChange={loadLeads} onRefresh={() => loadLeads(leadsPage)} loading={false} />;

      case 'documents':
        return <DocumentsView token={token} documents={documents} onRefresh={loadDocuments} user={user} loading={false} />;

      case 'consultations':
        return <ConsultationsView token={token} consultations={consultations} onRefresh={loadConsultations} user={user} staff={staff} />;

      case 'tasks':
        return <TasksView token={token} tasks={tasks} onRefresh={loadTasks} user={user} staff={staff} />;

      case 'staff':
        return <StaffPortal staff={staff} user={user} />;

      case 'org-chart':
        return <OrgChartView staff={staff} />;

      case 'analytics':
        return <AnalyticsView token={token} stats={stats} />;

      case 'pricing':
        return <PricingView plans={pricingPlans} onSubscribe={() => navigate('subscription')} onLoginClick={() => navigate('login')} isAuthenticated={true} />;

      case 'subscription':
        return (
          <ClientSubscriptionView
            token={token}
            user={user}
            subscription={subscription}
            pricingPlans={pricingPlans}
            onSubscriptionChange={loadSubscription}
          />
        );

      case 'messages':
        return <ClientMessagesView token={token} user={user} />;

      case 'clients':
        return <AdminClientsView token={token} />;

      case 'subscriptions':
        return <AdminSubscriptionsView token={token} />;

      default:
        return <div className="text-center py-20 text-slate-400">View not found</div>;
    }
  };

  // ============================================
  // LOADING GUARD
  // ============================================
  if (authLoading && !loadingTimeout && currentView !== 'login' && currentView !== 'signup') {
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

  // ============================================
  // NOT AUTHENTICATED → Landing / Login / Signup
  // ============================================
  if (!isAuthenticated) {
    if (currentView === 'login' || currentView === 'signup') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            variants={landingVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LoginScreen
              onLogin={() => {}}
              loading={false}
              error={loginError}
              initialSignup={currentView === 'signup'}
              onBackToHome={() => navigate('home')}
              onSwitchToSignup={() => navigate('signup')}
              onSwitchToLogin={() => navigate('login')}
            />
          </motion.div>
        </AnimatePresence>
      );
    }
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="landing"
          variants={landingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <LandingPage
            onLoginClick={() => navigate('login')}
            onSignUp={(email?: string, name?: string) => {
              if (email) sessionStorage.setItem('il_intake_email', email);
              if (name) sessionStorage.setItem('il_intake_name', name);
              navigate('signup');
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================
  // SHOW LANDING PAGE (for authenticated users)
  // ============================================
  if (currentView === 'home') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="landing-auth"
          variants={landingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <LandingPage
            isAuthenticated={true}
            onBackToDashboard={() => navigate('dashboard')}
            userName={user?.full_name?.split(' ')[0]}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================
  // AUTHENTICATED DASHBOARD
  // ============================================
  const navItems = getNavItems();
  const navGroups = [...new Set(navItems.map(i => i.group))];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ========== SIDEBAR ========== */}
      <aside className={`${sidebarOpen ? 'w-[272px]' : 'w-[68px]'} bg-[#0c1e3c] text-white flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0`}>
        {/* Logo Area */}
        <div
          className="p-4 flex items-center gap-3 border-b border-[#c9a84c]/20 cursor-pointer hover:bg-[#132d52]/30 transition-all duration-200 group"
          onClick={() => navigate('home')}
          title="Visit Homepage"
        >
          <div className="relative">
            <Image src="/logo_legal.png" alt="Infinity Legal SA" width={48} height={27} className="flex-shrink-0 object-contain" />
            <div className="absolute -inset-2 bg-[#c9a84c]/0 group-hover:bg-[#c9a84c]/5 rounded-lg transition-all duration-300" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-bold text-lg tracking-tight">Infinity Legal</span>
              <p className="text-[10px] text-[#7a8fb0] uppercase tracking-widest">
                {user?.role === 'client' ? 'Client Portal' : user?.role === 'attorney' ? 'Legal Advisor Portal' : 'Admin Portal'}
              </p>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {/* Homepage Link */}
            <button
              onClick={() => navigate('home')}
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
                {sidebarOpen && gi === 0 && group !== 'Overview' && group !== 'Main' && (
                  <div className="px-3 pt-2 pb-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7a94b8]">
                      <span className="text-[#c9a84c]/60 mr-1.5">—</span>{group}
                    </span>
                  </div>
                )}
                {navItems.filter(i => i.group === group).map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
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
                <div className="text-[10px] text-[#7a94b8] truncate">{roleDisplayLabels[user?.role || ''] || user?.role?.replace(/_/g, ' ')}</div>
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

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="glass-nav h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => navigate('home')}
                className="text-[#7a94b8] hover:text-[#0c1e3c] transition-colors duration-200 flex items-center gap-1"
                title="Visit Homepage"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-semibold text-[#0c1e3c]">{viewLabels[currentView] || currentView.replace(/-/g, ' ')}</span>
            </nav>
            <Badge className="bg-[#c9a84c]/5 text-[#a88832] text-[9px] font-medium border-0 hover:bg-[#c9a84c]/10 transition-colors duration-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              POPIA
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
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
            {/* User Menu */}
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
                  <div className="text-[10px] text-slate-500 leading-tight">{roleDisplayLabels[user?.role || ''] || user?.role?.replace(/_/g, ' ')}</div>
                </div>
                <ChevronRight className={`w-3 h-3 text-slate-400 hidden sm:block transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border shadow-xl rounded-xl z-[60] overflow-hidden animate-scale-in">
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

        {/* Page Content with transitions */}
        <div className="flex-1 overflow-auto p-6" ref={contentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
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

      {/* Ask Infinity Bubble */}
      <AskInfinityBubble />
    </div>
  );
}
