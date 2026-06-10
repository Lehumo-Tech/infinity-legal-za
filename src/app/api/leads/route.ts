/**
 * GET/POST /api/leads - List/Create leads with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');

    // Build Supabase query
    const selectFields = '*, assigned_paralegal:profiles!assigned_paralegal_id(id, full_name), assigned_officer:profiles!assigned_officer_id(id, full_name)';

    let query = db.from('leads').select(selectFields, { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    // Search across multiple fields
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    const result = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (result.error) {
      console.error('Leads query error:', result.error);
      return apiError('Failed to load leads', 500, 'LEADS_ERROR');
    }

    const total = result.count || 0;

    const formattedLeads = (result.data || []).map((l: any) => ({
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
      created_at: l.created_at,
      updated_at: l.updated_at,
      assigned_paralegal: l.assigned_paralegal,
      assigned_officer: l.assigned_officer,
    }));

    return apiResponse({
      data: formattedLeads,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Leads list error:', error);
    return apiError('Failed to load leads', 500, 'LEADS_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { name, email, phone, source, case_type, description } = body;

    if (!name || !email || !source) {
      return apiError('Name, email, and source are required', 400, 'MISSING_FIELDS');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Validate source enum
    const validSources = ['website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'other'];
    if (!validSources.includes(source)) {
      return apiError(`Invalid source. Must be one of: ${validSources.join(', ')}`, 400, 'INVALID_SOURCE');
    }

    const slaDeadline = new Date(Date.now() + 7 * 86400000);

    const { data: lead, error: insertError } = await db
      .from('leads')
      .insert({
        name: sanitizeString(name),
        email: email.toLowerCase(),
        phone: phone ? sanitizeString(phone) : null,
        source,
        case_type: case_type || null,
        description: description ? sanitizeString(description) : null,
        status: 'new',
        first_contact_date: new Date().toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        lead_score: 50,
      })
      .select()
      .single();

    if (insertError || !lead) {
      console.error('Create lead insert error:', insertError);
      return apiError('Failed to create lead', 500, 'CREATE_LEAD_ERROR');
    }

    await createAuditLog({
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
