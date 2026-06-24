/**
 * GET /api/dashboard - Dashboard statistics via Prisma/SQLite
 * Returns role-specific dashboard data:
 * - managing_director/admin: total cases, active cases, total clients, revenue, leads
 * - attorney: their assigned cases, upcoming consultations, tasks
 * - client: their cases, upcoming consultations, subscription status
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { getDashboardStats } from '@/lib/audit';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const user = auth.user;
    const role = user.role as RoleKey;

    // Admin/Managing Director dashboard — full overview
    if (hasPermission(role, PERMISSIONS.VIEW_ALL_CASES) && hasPermission(role, PERMISSIONS.VIEW_ANALYTICS)) {
      const stats = await getDashboardStats();

      // Get additional data in parallel
      const [pendingCases, closedCases, overdueTasks, totalAttorneys, recentCases, recentLeads] = await Promise.all([
        db.case.count({ where: { status: 'review' } }),
        db.case.count({ where: { status: 'closed' } }),
        db.task.count({
          where: {
            due_date: { lt: new Date() },
            status: { not: 'completed' },
          },
        }),
        db.user.count({ where: { role: 'attorney', is_active: true } }),
        db.case.findMany({
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            client: { include: { user: { select: { full_name: true, email: true } } } },
            attorney: { select: { full_name: true, email: true } },
          },
        }),
        db.intakeSubmission.findMany({
          take: 5,
          orderBy: { created_at: 'desc' },
          where: { status: { not: 'draft' } },
        }),
      ]);

      const recentCasesData = recentCases.map((c) => ({
        id: c.id,
        case_ref: c.case_ref,
        title: c.title,
        case_type: c.case_type,
        status: c.status,
        client: c.client?.user ? { full_name: c.client.user.full_name, email: c.client.user.email } : null,
        lead_attorney: c.attorney ? { full_name: c.attorney.full_name, email: c.attorney.email } : null,
        created_at: c.created_at,
      }));

      const recentLeadsData = recentLeads.map((l) => {
        const personalInfo = (l.personal_info || {}) as Record<string, unknown>;
        return {
          id: l.id,
          name: `${personalInfo.full_name || 'Unknown'}`.trim(),
          email: personalInfo.email || '',
          source: 'website',
          status: l.status,
          lead_score: l.ai_confidence ? Math.round(l.ai_confidence * 100) : null,
          created_at: l.created_at,
        };
      });

      return apiResponse({
        stats: {
          totalCases: stats.totalCases,
          activeCases: stats.activeCases,
          pendingCases,
          closedCases,
          totalLeads: stats.totalLeads,
          newLeads: stats.newLeads,
          totalDocuments: stats.totalDocuments,
          pendingTasks: stats.pendingTasks,
          overdueTasks,
          totalClients: stats.totalClients,
          totalLegalAdvisors: totalAttorneys,
          totalRevenue: stats.totalRevenue,
        },
        charts: {
          casesByType: stats.casesByType,
          casesByStatus: stats.casesByStatus,
          leadsBySource: stats.leadsBySource,
        },
        health: {
          rbac: true,
          popia: true,
          auditLogging: true,
          encryption: true,
          passwordPolicy: true,
          backupActive: false,
        },
        recent: {
          cases: recentCasesData,
          leads: recentLeadsData,
        },
      });
    }

    // Attorney dashboard — their assigned cases, consultations, tasks
    if (role === 'attorney' || role === 'associate' || role === 'candidate_attorney') {
      const [myCases, upcomingConsultations, myTasks] = await Promise.all([
        db.case.findMany({
          where: { attorney_id: user.userId },
          orderBy: { created_at: 'desc' },
          include: {
            client: { include: { user: { select: { full_name: true, email: true } } } },
          },
        }),
        db.consultation.findMany({
          where: {
            attorney_id: user.userId,
            status: { in: ['scheduled', 'confirmed'] },
            scheduled_at: { gte: new Date() },
          },
          orderBy: { scheduled_at: 'asc' },
          take: 5,
          include: {
            client: { select: { full_name: true, email: true } },
            case: { select: { case_ref: true, title: true } },
          },
        }),
        db.task.findMany({
          where: { assigned_to: user.userId, status: { not: 'completed' } },
          orderBy: { due_date: 'asc' },
          take: 10,
        }),
      ]);

      return apiResponse({
        role: 'attorney',
        stats: {
          totalCases: myCases.length,
          activeCases: myCases.filter((c) => c.status === 'active').length,
          upcomingConsultations: upcomingConsultations.length,
          pendingTasks: myTasks.length,
          overdueTasks: myTasks.filter((t) => t.due_date && t.due_date < new Date()).length,
        },
        cases: myCases.map((c) => ({
          id: c.id,
          case_ref: c.case_ref,
          title: c.title,
          case_type: c.case_type,
          status: c.status,
          urgency: c.urgency,
          client: c.client?.user ? { full_name: c.client.user.full_name, email: c.client.user.email } : null,
          next_deadline: c.next_deadline,
          created_at: c.created_at,
        })),
        consultations: upcomingConsultations,
        tasks: myTasks,
      });
    }

    // Client dashboard — their cases, consultations, subscription
    if (role === 'client') {
      // Find client profile
      const clientProfile = await db.client.findUnique({
        where: { user_id: user.userId },
      });

      const clientId = clientProfile?.id;

      const [myCases, upcomingConsultations, subscription] = await Promise.all([
        clientId
          ? db.case.findMany({
              where: { client_id: clientId },
              orderBy: { created_at: 'desc' },
              include: {
                attorney: { select: { full_name: true, email: true } },
              },
            })
          : [],
        db.consultation.findMany({
          where: {
            client_id: user.userId,
            status: { in: ['scheduled', 'confirmed'] },
            scheduled_at: { gte: new Date() },
          },
          orderBy: { scheduled_at: 'asc' },
          take: 5,
          include: {
            attorney: { select: { full_name: true, email: true } },
            case: { select: { case_ref: true, title: true } },
          },
        }),
        clientId
          ? db.userSubscription.findFirst({
              where: { client_id: clientId, status: { in: ['active', 'trial', 'past_due'] } },
              include: { plan: true },
              orderBy: { created_at: 'desc' },
            })
          : null,
      ]);

      return apiResponse({
        role: 'client',
        stats: {
          totalCases: myCases.length,
          activeCases: myCases.filter((c) => c.status === 'active').length,
          upcomingConsultations: upcomingConsultations.length,
          subscriptionStatus: clientProfile?.subscription_status || 'none',
        },
        cases: myCases.map((c) => ({
          id: c.id,
          case_ref: c.case_ref,
          title: c.title,
          case_type: c.case_type,
          status: c.status,
          urgency: c.urgency,
          attorney: c.attorney ? { full_name: c.attorney.full_name, email: c.attorney.email } : null,
          next_deadline: c.next_deadline,
          created_at: c.created_at,
        })),
        consultations: upcomingConsultations,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              plan: subscription.plan
                ? {
                    id: subscription.plan.id,
                    name: subscription.plan.name,
                    slug: subscription.plan.slug,
                    price_monthly: subscription.plan.price_monthly,
                    price_annual: subscription.plan.price_annual,
                  }
                : null,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
            }
          : null,
        membership_number: clientProfile?.membership_number || null,
      });
    }

    // Default: paralegal, consultant, other roles — return basic stats
    const [myTasks, myCases] = await Promise.all([
      db.task.findMany({
        where: { assigned_to: user.userId, status: { not: 'completed' } },
        orderBy: { due_date: 'asc' },
        take: 10,
      }),
      hasPermission(role, PERMISSIONS.VIEW_ALL_CASES)
        ? db.case.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
              client: { include: { user: { select: { full_name: true, email: true } } } },
            },
          })
        : [],
    ]);

    return apiResponse({
      role,
      stats: {
        totalCases: myCases.length,
        pendingTasks: myTasks.length,
      },
      cases: myCases,
      tasks: myTasks,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Failed to load dashboard', 500, 'DASHBOARD_ERROR');
  }
}
