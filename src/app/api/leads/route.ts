/**
 * GET/POST /api/leads - List/Create leads with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString, sanitizeSearchQuery } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_SOURCES = ['website', 'referral', 'social_media', 'google_ads', 'walk_in', 'phone', 'email', 'partner', 'event', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'nurturing'];
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'intellectual_property', 'tax', 'personal_injury', 'debt_recovery', 'other'];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');

    // Build Supabase query — leads has `assigned_to` FK to profiles(id)
    const selectFields = '*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, email)';

    let query = db.from('leads').select(selectFields, { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    // Search across multiple fields — leads has first_name, last_name (not name)
    if (search) {
      query = query.or(`first_name.ilike.%${sanitizeSearchQuery(search)}%,last_name.ilike.%${sanitizeSearchQuery(search)}%,email.ilike.%${sanitizeSearchQuery(search)}%,description.ilike.%${sanitizeSearchQuery(search)}%`);
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
      first_name: l.first_name,
      last_name: l.last_name,
      name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      email: l.email,
      phone: l.phone,
      company: l.company,
      source: l.source,
      status: l.status,
      case_type: l.case_type,
      description: l.description,
      estimated_value: l.estimated_value,
      lead_score: l.lead_score,
      assigned_to: l.assigned_to,
      notes: l.notes,
      tags: l.tags,
      created_at: l.created_at,
      updated_at: l.updated_at,
      assigned_to_profile: l.assigned_to_profile,
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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { first_name, last_name, email, phone, source, case_type, description, estimated_value, company } = body;

    if (!first_name || !last_name || !email || !source) {
      return apiError('First name, last name, email, and source are required', 400, 'MISSING_FIELDS');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Validate source enum
    if (!VALID_SOURCES.includes(source)) {
      return apiError(`Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`, 400, 'INVALID_SOURCE');
    }

    // Validate case_type if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    const { data: lead, error: insertError } = await db
      .from('leads')
      .insert({
        first_name: sanitizeString(first_name),
        last_name: sanitizeString(last_name),
        email: email.toLowerCase(),
        phone: phone ? sanitizeString(phone) : null,
        company: company ? sanitizeString(company) : null,
        source,
        case_type: case_type || null,
        description: description ? sanitizeString(description) : null,
        estimated_value: estimated_value || null,
        status: 'new',
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
