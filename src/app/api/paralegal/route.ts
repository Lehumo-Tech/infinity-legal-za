/**
 * GET /api/paralegal - Paralegal Portal aggregated data
 * Access: paralegal, candidate_attorney
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['paralegal', 'candidate_attorney'];

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const userId = auth.user.userId;

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Run all queries in parallel
    const [
      myCases,
      myTasks,
      upcomingDeadlines,
      documentPrepQueue,
      clientIntake,
      filingSchedule,
    ] = await Promise.all([
      // My assigned cases (support_paralegal_id = userId, not closed/archived)
      db.case.findMany({
        where: {
          support_paralegal_id: userId,
          status: { notIn: ['closed', 'archived'] },
        },
        include: {
          client: {
            select: { id: true, full_name: true, email: true, phone: true },
          },
          lead_attorney: {
            select: { id: true, full_name: true, email: true },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      // My tasks (assigned_to = userId, not completed/cancelled)
      db.task.findMany({
        where: {
          assigned_to: userId,
          status: { notIn: ['completed', 'cancelled'] },
        },
        include: {
          case: {
            select: { id: true, matter_number: true, title: true },
          },
          creator: {
            select: { id: true, full_name: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { due_date: 'asc' },
        ],
      }),
      // Upcoming deadlines (assigned_to = userId, due_date in next 7 days, not completed/cancelled)
      db.task.findMany({
        where: {
          assigned_to: userId,
          due_date: {
            gte: now,
            lte: sevenDaysFromNow,
          },
          status: { notIn: ['completed', 'cancelled'] },
        },
        include: {
          case: {
            select: { id: true, matter_number: true, title: true },
          },
        },
        orderBy: { due_date: 'asc' },
      }),
      // Document prep queue (prepared_by = userId OR workflow_status = 'draft', not archived)
      db.document.findMany({
        where: {
          OR: [
            { prepared_by: userId },
            { workflow_status: 'draft' },
          ],
          workflow_status: { notIn: ['archived'] },
        },
        include: {
          case: {
            select: { id: true, matter_number: true, title: true },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      // Client intake (leads where assigned_paralegal_id = userId, not retained/lost/disqualified)
      db.lead.findMany({
        where: {
          assigned_paralegal_id: userId,
          status: { notIn: ['retained', 'lost', 'disqualified'] },
        },
        orderBy: { created_at: 'desc' },
      }),
      // Filing schedule (cases where support_paralegal_id = userId, court_date in next 30 days, not closed/archived)
      db.case.findMany({
        where: {
          support_paralegal_id: userId,
          court_date: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          status: { notIn: ['closed', 'archived'] },
        },
        include: {
          client: {
            select: { id: true, full_name: true },
          },
          lead_attorney: {
            select: { id: true, full_name: true },
          },
        },
        orderBy: { court_date: 'asc' },
      }),
    ]);

    // Format my cases
    const myCasesFormatted = myCases.map((c) => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      court_date: c.court_date,
      next_action: c.next_action,
      next_action_date: c.next_action_date,
      is_high_risk: c.is_high_risk,
      client: c.client,
      lead_attorney: c.lead_attorney,
    }));

    // Format my tasks
    const myTasksFormatted = myTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      case: t.case,
      creator: t.creator,
    }));

    // Format upcoming deadlines
    const upcomingDeadlinesFormatted = upcomingDeadlines.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      case: t.case,
    }));

    // Format document prep queue
    const documentPrepQueueFormatted = documentPrepQueue.map((d) => ({
      id: d.id,
      title: d.title,
      document_type: d.document_type,
      workflow_status: d.workflow_status,
      version: d.version,
      case: d.case,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    // Format client intake
    const clientIntakeFormatted = clientIntake.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      case_type: l.case_type,
      description: l.description,
      lead_score: l.lead_score,
      sla_deadline: l.sla_deadline,
      created_at: l.created_at,
    }));

    // Format filing schedule
    const filingScheduleFormatted = filingSchedule.map((c) => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      case_type: c.case_type,
      court_date: c.court_date,
      filing_date: c.filing_date,
      client: c.client,
      lead_attorney: c.lead_attorney,
    }));

    // Calculate summary
    const totalAssignedCases = myCases.length;
    const pendingTasks = myTasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
    const overdueTasks = myTasks.filter((t) => t.status === 'overdue').length;
    const urgentDeadlines = upcomingDeadlines.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;
    const documentsInProgress = documentPrepQueue.filter((d) => d.workflow_status === 'draft' || d.workflow_status === 'review').length;
    const activeLeads = clientIntake.length;
    const upcomingFilings = filingSchedule.length;

    return apiResponse({
      my_cases: myCasesFormatted,
      my_tasks: myTasksFormatted,
      upcoming_deadlines: upcomingDeadlinesFormatted,
      document_prep_queue: documentPrepQueueFormatted,
      client_intake: clientIntakeFormatted,
      filing_schedule: filingScheduleFormatted,
      summary: {
        total_assigned_cases: totalAssignedCases,
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks,
        urgent_deadlines: urgentDeadlines,
        documents_in_progress: documentsInProgress,
        active_leads: activeLeads,
        upcoming_filings: upcomingFilings,
      },
    });
  } catch (error) {
    console.error('Paralegal portal error:', error);
    return apiError('Failed to load paralegal portal data', 500, 'PARALEGAL_PORTAL_ERROR');
  }
}
