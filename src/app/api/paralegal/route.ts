/**
 * GET /api/paralegal - Paralegal Portal aggregated data
 * Access: paralegal role
 * profiles.role CHECK: ('client','attorney','paralegal','admin','managing_director','systems_admin')
 * cases has: case_ref (not matter_number), attorney_id FK → attorneys(id) (not lead_attorney_id)
 * cases has NO: urgency, is_high_risk, support_paralegal_id, court_date
 * leads has: first_name, last_name (not name), assigned_to (not assigned_paralegal_id)
 * documents has: status (not workflow_status), uploaded_by (not prepared_by)
 * tasks status: ('pending','in_progress','completed','cancelled') — no 'overdue'
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['paralegal'];

export async function GET(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const userId = auth.user.userId;

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Run all queries in parallel using Supabase client
    const [
      myTasksResult,
      myAssignedLeadsResult,
      recentDocumentsResult,
    ] = await Promise.all([
      // My tasks (assigned_to = userId, not completed/cancelled)
      db.from('tasks')
        .select('*, creator:profiles!tasks_created_by_fkey(id, full_name, email), case:cases(id, case_ref, title, status)')
        .eq('assigned_to', userId)
        .not('status', 'in', '("completed","cancelled")')
        .order('created_at', { ascending: false }),

      // Leads assigned to me (assigned_to = userId)
      db.from('leads')
        .select('*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, email)')
        .eq('assigned_to', userId)
        .not('status', 'in', '("retained","lost")')
        .order('created_at', { ascending: false }),

      // Recent documents I uploaded
      db.from('documents')
        .select('*, case:cases(id, case_ref, title, status)')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const myTasks = myTasksResult.data || [];
    const myAssignedLeads = myAssignedLeadsResult.data || [];
    const recentDocuments = recentDocumentsResult.data || [];

    // Upcoming deadlines (tasks due in next 7 days, not completed/cancelled)
    const { data: upcomingDeadlines } = await db
      .from('tasks')
      .select('id, title, priority, status, due_date, case:cases(id, case_ref, title)')
      .eq('assigned_to', userId)
      .gte('due_date', now.toISOString())
      .lte('due_date', sevenDaysFromNow.toISOString())
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date', { ascending: true });

    // Format my tasks
    const myTasksFormatted = myTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      case: t.case,
      creator: t.creator,
    }));

    // Format leads — has first_name/last_name (not name)
    const myAssignedLeadsFormatted = myAssignedLeads.map((l: any) => ({
      id: l.id,
      first_name: l.first_name,
      last_name: l.last_name,
      name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      case_type: l.case_type,
      description: l.description,
      lead_score: l.lead_score,
      created_at: l.created_at,
    }));

    // Format upcoming deadlines
    const upcomingDeadlinesFormatted = (upcomingDeadlines || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      case: t.case,
    }));

    // Format recent documents — has status (not workflow_status)
    const recentDocumentsFormatted = recentDocuments.map((d: any) => ({
      id: d.id,
      file_name: d.file_name,
      document_type: d.document_type,
      status: d.status,
      version: d.version,
      case: d.case,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    // Calculate summary
    const pendingTasks = myTasks.filter((t: any) => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter((t: any) => t.status === 'in_progress').length;
    const urgentDeadlines = (upcomingDeadlines || []).filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length;
    const activeLeads = myAssignedLeads.length;

    return apiResponse({
      my_tasks: myTasksFormatted,
      my_assigned_leads: myAssignedLeadsFormatted,
      upcoming_deadlines: upcomingDeadlinesFormatted,
      recent_documents: recentDocumentsFormatted,
      summary: {
        total_tasks: myTasks.length,
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        urgent_deadlines: urgentDeadlines,
        active_leads: activeLeads,
      },
    });
  } catch (error) {
    console.error('Paralegal portal error:', error);
    return apiError('Failed to load paralegal portal data', 500, 'PARALEGAL_PORTAL_ERROR');
  }
}
