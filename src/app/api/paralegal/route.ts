/**
 * GET /api/paralegal - Paralegal Portal aggregated data
 * Access: paralegal role
 *
 * Uses Prisma to aggregate the paralegal's tasks, assigned leads, and recent documents.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['paralegal'];

export async function GET(request: NextRequest) {
  try {
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

    // Run all queries in parallel
    const [myTasks, myAssignedLeads, recentDocuments, upcomingDeadlines] = await Promise.all([
      // My tasks (assigned_to = userId, not completed/cancelled)
      db.task.findMany({
        where: {
          assigned_to: userId,
          status: { notIn: ['completed', 'cancelled'] },
        },
        include: {
          creator: { select: { id: true, full_name: true, email: true } },
          case: { select: { id: true, case_ref: true, title: true, status: true } },
        },
        orderBy: { created_at: 'desc' },
      }),

      // Leads assigned to me — leads are IntakeSubmissions with personal_info.assigned_to = userId
      db.intakeSubmission.findMany({
        where: {
          status: { notIn: ['retained', 'lost', 'draft'] },
        },
        orderBy: { created_at: 'desc' },
      }),

      // Recent documents I uploaded
      db.document.findMany({
        where: { uploaded_by: userId },
        include: {
          case: { select: { id: true, case_ref: true, title: true, status: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),

      // Upcoming deadlines (tasks due in next 7 days, not completed/cancelled)
      db.task.findMany({
        where: {
          assigned_to: userId,
          status: { notIn: ['completed', 'cancelled'] },
          due_date: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          case: { select: { id: true, case_ref: true, title: true } },
        },
        orderBy: { due_date: 'asc' },
      }),
    ]);

    // Filter leads in JS by personal_info.assigned_to === userId
    const myAssignedLeadsFiltered = myAssignedLeads.filter(sub => {
      const pi = (sub.personal_info && typeof sub.personal_info === 'object' ? sub.personal_info : {}) as Record<string, unknown>;
      return pi.assigned_to === userId;
    });

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

    // Format leads — has first_name/last_name from personal_info
    const myAssignedLeadsFormatted = myAssignedLeadsFiltered.map((sub) => {
      const pi = (sub.personal_info && typeof sub.personal_info === 'object' ? sub.personal_info : {}) as Record<string, unknown>;
      const fullName = typeof pi.full_name === 'string' ? pi.full_name : '';
      const parts = fullName.split(/\s+/);
      const firstName = typeof pi.first_name === 'string' ? pi.first_name : parts[0] || '';
      const lastName = typeof pi.last_name === 'string' ? pi.last_name : parts.slice(1).join(' ') || '';
      return {
        id: sub.id,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: typeof pi.email === 'string' ? pi.email : '',
        phone: typeof pi.phone === 'string' ? pi.phone : '',
        source: typeof pi.source === 'string' ? pi.source : 'website',
        status: sub.status,
        case_type: sub.case_type,
        description: sub.case_description,
        lead_score: typeof pi.lead_score === 'number'
          ? pi.lead_score
          : (sub.ai_confidence ? Math.round(sub.ai_confidence * 100) : null),
        created_at: sub.created_at,
      };
    });

    // Format upcoming deadlines
    const upcomingDeadlinesFormatted = upcomingDeadlines.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      case: t.case,
    }));

    // Format recent documents
    const recentDocumentsFormatted = recentDocuments.map((d) => ({
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
    const pendingTasks = myTasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
    const urgentDeadlines = upcomingDeadlines.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;
    const activeLeads = myAssignedLeadsFiltered.length;

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
