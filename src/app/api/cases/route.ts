/**
 * GET/POST /api/cases - List/Create cases with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { checkHighRisk, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// GET - List cases with pagination and filters
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const urgency = url.searchParams.get('urgency');
    const search = url.searchParams.get('search');

    // Build Supabase query
    const selectFields = '*, client:profiles!client_id(id, full_name, email), lead_attorney:profiles!lead_attorney_id(id, full_name)';

    let query = db.from('cases').select(selectFields, { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (case_type) query = query.eq('case_type', case_type);
    if (urgency) query = query.eq('urgency', urgency);

    // Search across multiple fields
    if (search) {
      query = query.or(`title.ilike.%${search}%,matter_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Non-admin users can only see their own cases
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      query = query.or(`client_id.eq.${auth.user.userId},lead_attorney_id.eq.${auth.user.userId},support_paralegal_id.eq.${auth.user.userId}`);
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
      created_at: c.created_at,
      updated_at: c.updated_at,
      client: c.client,
      lead_attorney: c.lead_attorney,
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
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { title, description, case_type, urgency, client_id, estimated_value } = body;

    if (!title || !case_type || !urgency || !client_id) {
      return apiError('Title, case type, urgency, and client are required', 400, 'MISSING_FIELDS');
    }

    // Validate enum fields
    const validCaseTypes = ['family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning', 'corporate_commercial', 'debt_collection', 'immigration', 'labour_law', 'personal_injury', 'other'];
    if (!validCaseTypes.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${validCaseTypes.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencies.includes(urgency)) {
      return apiError(`Invalid urgency. Must be one of: ${validUrgencies.join(', ')}`, 400, 'INVALID_URGENCY');
    }

    // Validate client exists
    const { data: clientExists } = await db
      .from('profiles')
      .select('user_id')
      .eq('user_id', client_id)
      .single();
    if (!clientExists) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // High-risk detection
    const highRiskCheck = checkHighRisk(`${title} ${description || ''}`);

    // Sanitize string inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = description ? sanitizeString(description) : null;

    // Generate matter number
    const { count: caseCount } = await db
      .from('cases')
      .select('*', { count: 'exact', head: true });
    const currentYear = new Date().getFullYear();
    const matter_number = `IL-${currentYear}-${String((caseCount || 0) + 1).padStart(4, '0')}`;

    const { data: newCase, error: insertError } = await db
      .from('cases')
      .insert({
        matter_number,
        title: sanitizedTitle,
        description: sanitizedDescription,
        case_type,
        urgency,
        status: 'intake',
        client_id,
        lead_attorney_id: auth.user.userId,
        estimated_value: estimated_value || null,
        is_high_risk: highRiskCheck.isHighRisk,
      })
      .select()
      .single();

    if (insertError || !newCase) {
      console.error('Create case insert error:', insertError);
      return apiError('Failed to create case', 500, 'CREATE_CASE_ERROR');
    }

    // Create timeline entry
    await db.from('case_timeline').insert({
      case_id: newCase.id,
      user_id: auth.user.userId,
      action: 'CASE_CREATED',
      description: 'Case created and assigned',
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
