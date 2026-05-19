/**
 * GET/POST /api/leads - List/Create leads with pagination via PocketBase
 */

import { NextRequest } from 'next/server';
import { listRecords, createRecord, countRecords } from '@/lib/pb-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLogPB } from '@/lib/audit-pb';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);
    
    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');

    const filters: string[] = [];
    if (status) filters.push(`status='${status}'`);
    if (source) filters.push(`source='${source}'`);
    if (search) filters.push(`(name~'${search}' || email~'${search}' || description~'${search}')`);

    const filterStr = filters.length > 0 ? filters.join(' && ') : '';

    const res = await listRecords('leads', {
      page,
      perPage,
      filter: filterStr,
      sort: '-created',
      expand: 'assigned_paralegal_id,assigned_officer_id',
    });

    const pbData = res.data as any;
    const leads = (pbData?.items || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      case_type: l.case_type,
      description: l.description,
      assigned_paralegal_id: l.assigned_paralegal_id,
      assigned_officer_id: l.assigned_officer_id,
      lead_score: l.lead_score,
      estimated_value: l.estimated_value,
      sla_deadline: l.sla_deadline,
      first_contact_date: l.first_contact_date,
      created_at: l.created,
      updated_at: l.updated,
      assigned_paralegal: l.expand?.assigned_paralegal_id ? { id: l.expand.assigned_paralegal_id.id, full_name: l.expand.assigned_paralegal_id.full_name } : null,
      assigned_officer: l.expand?.assigned_officer_id ? { id: l.expand.assigned_officer_id.id, full_name: l.expand.assigned_officer_id.full_name } : null,
    }));

    return apiResponse({
      data: leads,
      pagination: createPaginationResult(pbData?.totalItems || 0, page, perPage),
    });
  } catch (error) {
    console.error('Leads list error:', error);
    return apiError('Failed to load leads', 500, 'LEADS_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { name, email, phone, source, case_type, description } = body;

    if (!name || !email || !source) {
      return apiError('Name, email, and source are required', 400, 'MISSING_FIELDS');
    }

    const slaDeadline = new Date(Date.now() + 7 * 86400000).toISOString().split('.')[0] + 'Z';

    const res = await createRecord('leads', {
      name,
      email,
      phone: phone || '',
      source,
      case_type: case_type || '',
      description: description || '',
      status: 'new',
      first_contact_date: new Date().toISOString().split('.')[0] + 'Z',
      sla_deadline: slaDeadline,
      lead_score: 50,
    });

    const lead = res.data as any;

    await createAuditLogPB({
      user_id: auth.user.userId,
      action: 'CREATE_LEAD',
      resource_type: 'lead',
      resource_id: lead.id,
    });

    return apiResponse(lead, 201);
  } catch (error) {
    console.error('Create lead error:', error);
    return apiError('Failed to create lead', 500, 'CREATE_LEAD_ERROR');
  }
}
