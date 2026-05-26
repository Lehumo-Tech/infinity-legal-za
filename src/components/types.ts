// ============================================
// SHARED TYPES FOR INFINITY LEGAL SA
// ============================================

export type View = 'workbench' | 'cases' | 'leads' | 'documents' | 'consultations' | 'tasks' | 'staff' | 'analytics' | 'pricing' | 'org-chart';
export type UserRole = 'managing_director' | 'senior_partner' | 'associate' | 'paralegal' | 'legal_officer' | 'supervising_officer' | 'senior_consultant' | 'consultant' | 'candidate_attorney' | 'hr_manager' | 'finance_manager' | 'office_administrator' | 'systems_admin' | 'receptionist' | 'client' | 'guest';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department?: string | null;
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
  totalAttorneys: number;
  totalRevenue: number;
}

export interface Consultation {
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

export interface DocumentItem {
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
  completed_date?: string | null;
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
  department?: string | null;
  phone?: string | null;
  is_active: boolean;
  supervisor?: { full_name: string | null; role: string } | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
