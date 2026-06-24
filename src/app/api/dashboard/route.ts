/**
 * GET /api/dashboard - Dashboard statistics via Supabase
 * Uses getDashboardStats from @/lib/audit for core stats
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { getDashboardStats } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      // Database not configured — return minimal dashboard data
      return apiResponse({
        stats: {
          totalCases: 0, activeCases: 0, pendingCases: 0, closedCases: 0,
          totalLeads: 0, newLeads: 0, totalDocuments: 0,
          pendingTasks: 0, overdueTasks: 0, totalClients: 0,
          totalAttorneys: 0, totalRevenue: 0,
        },
        charts: { casesByType: [], casesByStatus: [], leadsBySource: [] },
        health: { rbac: false, popia: true, auditLogging: false, encryption: true, passwordPolicy: true, backupActive: false },
        recent: { cases: [], leads: [] },
      });
    }

    // Get core stats from the audit helper
    const stats = await getDashboardStats();

    // Fetch additional dashboard data in parallel
    const [
      pendingCasesResult,
      closedCasesResult,
      overdueTasksResult,
      totalAttorneysResult,
      recentCasesResult,
      recentLeadsResult,
      backupRecordResult,
    ] = await Promise.all([
      db.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'review'),
      db.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      db.from('tasks').select('*', { count: 'exact', head: true }).lt('due_date', new Date().toISOString()).neq('status', 'completed'),
      db.from('attorneys').select('*', { count: 'exact', head: true }),
      db
        .from('cases')
        .select('id, case_ref, title, case_type, status, created_at, client:profiles!cases_client_id_fkey(full_name, email), attorney:attorneys!cases_attorney_id_fkey(profile:profiles(full_name, email))')
        .order('created_at', { ascending: false })
        .limit(5),
      db
        .from('leads')
        .select('id, first_name, last_name, email, source, status, lead_score, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      db
        .from('backup_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const pendingCases = pendingCasesResult.count || 0;
    const closedCases = closedCasesResult.count || 0;
    const overdueTasks = overdueTasksResult.count || 0;
    const totalAttorneys = totalAttorneysResult.count || 0;
    const recentCases = recentCasesResult.data || [];
    const recentLeads = recentLeadsResult.data || [];
    const backupRecord = backupRecordResult.data?.[0] || null;

    const recentCasesData = recentCases.map((c: any) => ({
      id: c.id,
      case_ref: c.case_ref,
      title: c.title,
      case_type: c.case_type,
      status: c.status,
      client: c.client,
      lead_attorney: c.attorney?.profile || null,
      created_at: c.created_at,
    }));

    const recentLeadsData = recentLeads.map((l: any) => ({
      id: l.id,
      name: `${l.first_name} ${l.last_name}`.trim(),
      email: l.email,
      source: l.source,
      status: l.status,
      lead_score: l.lead_score,
      created_at: l.created_at,
    }));

    const backupActive = backupRecord?.status === 'completed' &&
      backupRecord.completed_at &&
      (Date.now() - new Date(backupRecord.completed_at).getTime()) < 24 * 60 * 60 * 1000;

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
        totalAttorneys,
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
        backupActive: !!backupActive,
      },
      recent: {
        cases: recentCasesData,
        leads: recentLeadsData,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Failed to load dashboard', 500, 'DASHBOARD_ERROR');
  }
}
