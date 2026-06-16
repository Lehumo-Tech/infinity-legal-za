/**
 * Infinity Legal ZA - Audit & Analytics Library (Supabase)
 */

import { db, isSupabaseConfigured } from '@/lib/db';

function checkDb() {
  if (!isSupabaseConfigured() || !db) {
    return false;
  }
  return true;
}

export async function createAuditLog(params: {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}) {
  if (!checkDb()) return;
  try {
    const { error } = await db.from('audit_logs').insert({
      user_id: params.user_id || null,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id || null,
      details: params.details || null,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
    });
    if (error) console.error('Failed to create audit log:', error.message);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function trackApiEvent(params: {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  if (!checkDb()) return;
  try {
    await db.from('api_analytics').insert({
      endpoint: params.endpoint,
      method: params.method,
      status_code: params.status_code,
      response_time_ms: params.response_time_ms || null,
      user_id: params.user_id || null,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
    });
  } catch (error) {
    console.error('Failed to track API event:', error);
  }
}

export async function logError(params: {
  error_type: string;
  message: string;
  stack_trace?: string;
  request_path?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!checkDb()) return;
  try {
    await db.from('error_logs').insert({
      error_type: params.error_type as any,
      message: params.message,
      stack_trace: params.stack_trace || null,
      request_path: params.request_path || null,
      user_id: params.user_id || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'popi_act' | 'marketing' | 'data_processing';

export async function logConsent(params: {
  user_id?: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
  version?: string;
}) {
  if (!checkDb()) return;
  try {
    await db.from('consent_logs').insert({
      user_id: params.user_id || null,
      consent_type: params.consent_type,
      granted: params.granted,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
      version: params.version || null,
    });
  } catch (error) {
    console.error('Failed to log consent:', error);
  }
}

// Dashboard analytics helpers
export async function getDashboardStats() {
  if (!checkDb()) {
    return {
      totalCases: 0, activeCases: 0, totalLeads: 0, newLeads: 0,
      totalDocuments: 0, pendingTasks: 0, totalClients: 0, totalRevenue: 0,
      casesByType: [], casesByStatus: [], leadsBySource: [], recentActivity: [],
    };
  }
  const [
    { count: totalCases },
    { count: activeCases },
    { count: totalLeads },
    { count: newLeads },
    { count: totalDocuments },
    { count: pendingTasks },
    { count: totalClients },
  ] = await Promise.all([
    db.from('cases').select('*', { count: 'exact', head: true }),
    db.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('leads').select('*', { count: 'exact', head: true }),
    db.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    db.from('documents').select('*', { count: 'exact', head: true }),
    db.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
  ]);

  // Cases by type
  const { data: casesByType } = await db.from('cases').select('case_type');
  const casesByTypeMap = (casesByType || []).reduce((acc: any, c: any) => {
    acc[c.case_type] = (acc[c.case_type] || 0) + 1;
    return acc;
  }, {});
  const casesByTypeResult = Object.entries(casesByTypeMap).map(([case_type, count]) => ({ case_type, count }));

  // Cases by status
  const { data: casesByStatus } = await db.from('cases').select('status');
  const casesByStatusMap = (casesByStatus || []).reduce((acc: any, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const casesByStatusResult = Object.entries(casesByStatusMap).map(([status, count]) => ({ status, count }));

  // Leads by source
  const { data: leadsBySource } = await db.from('leads').select('source');
  const leadsBySourceMap = (leadsBySource || []).reduce((acc: any, l: any) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});
  const leadsBySourceResult = Object.entries(leadsBySourceMap).map(([source, count]) => ({ source, count }));

  // Recent activity
  const { data: recentActivity } = await db
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Revenue
  const { data: revenueData } = await db.from('cases').select('estimated_value');
  const totalRevenue = (revenueData || []).reduce((sum, c) => sum + (c.estimated_value || 0), 0);

  return {
    totalCases: totalCases || 0,
    activeCases: activeCases || 0,
    totalLeads: totalLeads || 0,
    newLeads: newLeads || 0,
    totalDocuments: totalDocuments || 0,
    pendingTasks: pendingTasks || 0,
    totalClients: totalClients || 0,
    totalRevenue,
    casesByType: casesByTypeResult,
    casesByStatus: casesByStatusResult,
    leadsBySource: leadsBySourceResult,
    recentActivity: recentActivity || [],
  };
}
