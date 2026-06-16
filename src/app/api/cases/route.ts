/**
 * GET/POST /api/cases - List/Create cases with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'intellectual_property', 'tax', 'personal_injury', 'debt_recovery', 'other'];
const VALID_STATUSES = ['intake', 'review', 'active', 'on_hold', 'closed', 'archived'];

// GET - List cases with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const search = url.searchParams.get('search');

    // Build Supabase query — attorney_id FK references attorneys(id), attorneys.id → profiles(id)
    const selectFields = '*, client:profiles!cases_client_id_fkey(id, full_name, email), attorney:attorneys!cases_attorney_id_fkey(profile:profiles(full_name, email))';

    let query = db.from('cases').select(selectFields, { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (case_type) query = query.eq('case_type', case_type);

    // Search across multiple fields
    if (search) {
      query = query.or(`title.ilike.%${search}%,case_ref.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Non-admin users can only see their own cases
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      query = query.eq('client_id', auth.user.userId);
    }

    // Apply pagination and ordering
    const result = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (result.error) {
      console.error('Cases query error:', result.error);
      return apiError('Failed to load cases', 500, 'CASES_ERROR');
    }

    const total = result.count || 0;

    const formattedCases = (result.data || []).map((c: any) => ({
      id: c.id,
      case_ref: c.case_ref,
      title: c.title,
      description: c.description,
      case_type: c.case_type,
      status: c.status,
      client_id: c.client_id,
      attorney_id: c.attorney_id,
      opposing_party: c.opposing_party,
      court_name: c.court_name,
      case_number: c.case_number,
      jurisdiction: c.jurisdiction,
      estimated_value: c.estimated_value,
      retainer_amount: c.retainer_amount,
      next_deadline: c.next_deadline,
      notes: c.notes,
      tags: c.tags,
      created_at: c.created_at,
      updated_at: c.updated_at,
      client: c.client,
      lead_attorney: c.attorney?.profile || null,
    }));

    return apiResponse({
      data: formattedCases,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Cases list error:', error);
    return apiError('Failed to load cases', 500, 'CASES_ERROR');
  }
}

// POST - Create new case
export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { title, description, case_type, client_id, estimated_value, opposing_party, court_name, jurisdiction, notes } = body;

    if (!title || !case_type || !client_id) {
      return apiError('Title, case type, and client are required', 400, 'MISSING_FIELDS');
    }

    // Validate case_type enum
    if (!VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    // Validate status if provided
    const status = body.status || 'intake';
    if (!VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate client exists
    const { data: clientExists } = await db
      .from('profiles')
      .select('id')
      .eq('id', client_id)
      .single();
    if (!clientExists) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // Sanitize string inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = description ? sanitizeString(description) : null;

    // Resolve attorney_id: look up the attorney record for the current user
    let attorneyId: string | null = null;
    const { data: attorneyRecord } = await db
      .from('attorneys')
      .select('id')
      .eq('id', auth.user.userId)
      .single();
    if (attorneyRecord) {
      attorneyId = attorneyRecord.id;
    }

    const { data: newCase, error: insertError } = await db
      .from('cases')
      .insert({
        title: sanitizedTitle,
        description: sanitizedDescription,
        case_type,
        status,
        client_id,
        attorney_id: attorneyId,
        estimated_value: estimated_value || null,
        opposing_party: opposing_party ? sanitizeString(opposing_party) : null,
        court_name: court_name ? sanitizeString(court_name) : null,
        jurisdiction: jurisdiction ? sanitizeString(jurisdiction) : null,
        notes: notes ? sanitizeString(notes) : null,
      })
      .select()
      .single();

    if (insertError || !newCase) {
      console.error('Create case insert error:', insertError);
      return apiError('Failed to create case', 500, 'CREATE_CASE_ERROR');
    }

    // Create timeline entry — schema uses event_type, event_description, performed_by
    await db.from('case_timeline').insert({
      case_id: newCase.id,
      event_type: 'CASE_CREATED',
      event_description: 'Case created and assigned',
      performed_by: auth.user.userId,
    });

    await createAuditLog({
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
