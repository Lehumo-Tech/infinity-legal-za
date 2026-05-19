/**
 * GET/POST /api/cases - List/Create cases with pagination via PocketBase
 */

import { NextRequest } from 'next/server';
import { listRecords, createRecord, countRecords, groupByField } from '@/lib/pb-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { checkHighRisk } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLogPB } from '@/lib/audit-pb';

// GET - List cases with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);
    
    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const urgency = url.searchParams.get('urgency');
    const search = url.searchParams.get('search');

    // Build filter string for PocketBase
    const filters: string[] = [];
    if (status) filters.push(`status='${status}'`);
    if (case_type) filters.push(`case_type='${case_type}'`);
    if (urgency) filters.push(`urgency='${urgency}'`);
    if (search) filters.push(`(title~'${search}' || matter_number~'${search}' || description~'${search}')`);

    // Non-admin users can only see their own cases
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      filters.push(`(client_id='${auth.user.userId}' || lead_attorney_id='${auth.user.userId}' || support_paralegal_id='${auth.user.userId}')`);
    }

    const filterStr = filters.length > 0 ? filters.join(' && ') : '';
    
    const res = await listRecords('cases', {
      page,
      perPage,
      filter: filterStr,
      sort: '-created',
      expand: 'client_id,lead_attorney_id',
    });

    const pbData = res.data as any;
    const cases = (pbData?.items || []).map((c: any) => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      description: c.description,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      client_id: c.client_id,
      lead_attorney_id: c.lead_attorney_id,
      support_paralegal_id: c.support_paralegal_id,
      court_date: c.court_date,
      estimated_value: c.estimated_value,
      is_high_risk: c.is_high_risk,
      next_action: c.next_action,
      next_action_date: c.next_action_date,
      created_at: c.created,
      updated_at: c.updated,
      client: c.expand?.client_id ? { id: c.expand.client_id.id, full_name: c.expand.client_id.full_name, email: c.expand.client_id.email } : null,
      lead_attorney: c.expand?.lead_attorney_id ? { id: c.expand.lead_attorney_id.id, full_name: c.expand.lead_attorney_id.full_name } : null,
    }));

    return apiResponse({
      data: cases,
      pagination: createPaginationResult(pbData?.totalItems || 0, page, perPage),
    });
  } catch (error) {
    console.error('Cases list error:', error);
    return apiError('Failed to load cases', 500, 'CASES_ERROR');
  }
}

// POST - Create new case
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { title, description, case_type, urgency, client_id, estimated_value } = body;

    if (!title || !case_type || !urgency || !client_id) {
      return apiError('Title, case type, urgency, and client are required', 400, 'MISSING_FIELDS');
    }

    // High-risk detection
    const highRiskCheck = checkHighRisk(`${title} ${description || ''}`);

    // Generate matter number
    const caseCount = await countRecords('cases');
    const currentYear = new Date().getFullYear();
    const matter_number = `IL-${currentYear}-${String(caseCount + 1).padStart(4, '0')}`;

    const res = await createRecord('cases', {
      matter_number,
      title,
      description: description || '',
      case_type,
      urgency,
      status: 'intake',
      client_id,
      lead_attorney_id: auth.user.userId,
      estimated_value: estimated_value || 0,
      is_high_risk: highRiskCheck.isHighRisk,
    });

    const newCase = res.data as any;

    // Create timeline entry
    await createRecord('case_timeline', {
      case_id: newCase.id,
      user_id: auth.user.userId,
      action: 'CASE_CREATED',
      description: 'Case created and assigned',
    });

    await createAuditLogPB({
      user_id: auth.user.userId,
      action: 'CREATE_CASE',
      resource_type: 'case',
      resource_id: newCase.id,
    });

    return apiResponse(newCase, 201);
  } catch (error) {
    console.error('Create case error:', error);
    return apiError('Failed to create case', 500, 'CREATE_CASE_ERROR');
  }
}
