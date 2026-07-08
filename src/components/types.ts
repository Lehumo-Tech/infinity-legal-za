// ============================================
// SHARED TYPES FOR INFINITY LEGAL SA
// Aligned with deployed Supabase schema
// ============================================

export type View = 'dashboard' | 'workbench' | 'cases' | 'leads' | 'documents' | 'consultations' | 'tasks' | 'staff' | 'analytics' | 'pricing' | 'org-chart' | 'subscription' | 'communications' | 'messages' | 'clients' | 'subscriptions' | 'home' | 'login' | 'signup';
// Schema CHECK constraint: profiles.role IN ('client','attorney','paralegal','admin','managing_director','systems_admin')
export type UserRole = 'managing_director' | 'admin' | 'attorney' | 'paralegal' | 'systems_admin' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
}

export interface Stats {
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
  totalLegalAdvisors: number;
  totalRevenue: number;
  revenueTrend?: string | number;
}

export interface Consultation {
  id: string;
  client_id: string;
  attorney_id: string;
  case_id?: string | null;
  scheduled_at: string; // single timestamp, not separate date/time
  duration_minutes: number;
  status: string;
  notes?: string | null;
  meeting_type: string;
  client?: { full_name: string | null; email: string; profile?: { full_name: string | null; email: string } };
  attorney?: { full_name: string | null; email: string; profile?: { full_name: string | null; email: string } };
  case?: { title: string; case_ref: string } | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  file_name: string; // schema uses file_name, not title
  case_id: string;
  document_type: string;
  status: string; // schema uses status, not workflow_status
  version: number;
  file_path: string; // required in schema
  file_url?: string | null;
  file_size?: number | null;
  uploaded_by?: string | null; // schema uses uploaded_by, not prepared_by
  created_at: string;
  case?: { title: string; case_ref: string };
  uploaded_by_user?: { full_name: string | null }; // was prepared_by_user
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  case_id?: string | null;
  assigned_to: string;
  created_by: string;
  priority: string;
  status: string;
  due_date?: string | null;
  completed_at?: string | null; // schema uses completed_at, not completed_date
  assignee?: { full_name: string | null };
  creator?: { full_name: string | null };
  case?: { title: string } | null;
  created_at: string;
}

export interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
  // No is_active, department, or supervisor columns in profiles schema
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
