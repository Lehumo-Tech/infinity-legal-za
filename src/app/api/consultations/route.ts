/**
 * GET/POST /api/consultations - List/Create consultations with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Legal roles that can be assigned as attorneys for consultations
const LEGAL_ROLES = [
  'managing_director',
  'senior_partner',
  'associate',
  'legal_officer',
  'supervising_officer',
  'candidate_attorney',
  'senior_consultant',
  'consultant',
];

// GET - List consultations with pagination and filters
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const attorney_id = url.searchParams.get('attorney_id');
    const client_id = url.searchParams.get('client_id');
    const status = url.searchParams.get('status');
    const date_from = url.searchParams.get('date_from');
    const date_to = url.searchParams.get('date_to');

    // Build query
    let query = db
      .from('consultations')
      .select('*, client:profiles!consultations_client_id_fkey(user_id, full_name, email, phone), attorney:profiles!consultations_attorney_id_fkey(user_id, full_name, email, role, department), case:cases(id, matter_number, title)', { count: 'exact' });

    // Permission-based access control
    const canViewAll =
      hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES) ||
      hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS);

    if (!canViewAll) {
      // Clients can only see their own consultations;
      // Other staff can see consultations where they are the attorney or the client
      query = query.or(`client_id.eq.${auth.user.userId},attorney_id.eq.${auth.user.userId}`);
    }

    if (attorney_id) query = query.eq('attorney_id', attorney_id);
    if (client_id) query = query.eq('client_id', client_id);
    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('scheduled_date', date_from);
    if (date_to) query = query.lte('scheduled_date', date_to);

    const { data: consultations, count, error } = await query
      .order('scheduled_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Consultations list query error:', error);
      return apiError('Failed to load consultations', 500, 'CONSULTATIONS_ERROR');
    }

    return apiResponse({
      data: consultations || [],
      pagination: createPaginationResult(count || 0, page, perPage),
    });
  } catch (error) {
    console.error('Consultations list error:', error);
    return apiError('Failed to load consultations', 500, 'CONSULTATIONS_ERROR');
  }
}

// POST - Create a new consultation
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const body = await request.json();
    const {
      client_id,
      attorney_id,
      scheduled_date,
      scheduled_time,
      case_id,
      duration_minutes,
      meeting_type,
      notes,
      status,
    } = body;

    // Validate required fields
    if (!client_id || !attorney_id || !scheduled_date || !scheduled_time) {
      return apiError(
        'client_id, attorney_id, scheduled_date, and scheduled_time are required',
        400,
        'MISSING_FIELDS'
      );
    }

    // Validate meeting_type enum
    const validMeetingTypes = ['in_person', 'video_call', 'phone_call'];
    if (meeting_type && !validMeetingTypes.includes(meeting_type)) {
      return apiError(
        `Invalid meeting_type. Must be one of: ${validMeetingTypes.join(', ')}`,
        400,
        'INVALID_MEETING_TYPE'
      );
    }

    // Validate status enum
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (status && !validStatuses.includes(status)) {
      return apiError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Validate that the attorney exists and has a legal role
    const { data: attorney } = await db
      .from('profiles')
      .select('user_id, full_name, email, role, department')
      .eq('user_id', attorney_id)
      .single();

    if (!attorney) {
      return apiError('Attorney not found', 404, 'ATTORNEY_NOT_FOUND');
    }

    if (!LEGAL_ROLES.includes(attorney.role)) {
      return apiError(
        'The specified user does not have a legal role suitable for consultations',
        400,
        'INVALID_ATTORNEY_ROLE'
      );
    }

    // Validate client exists
    const { data: client } = await db
      .from('profiles')
      .select('user_id, full_name, email')
      .eq('user_id', client_id)
      .single();

    if (!client) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // Validate case exists if provided
    if (case_id) {
      const { data: caseRecord } = await db
        .from('cases')
        .select('id')
        .eq('id', case_id)
        .single();
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    const { data: consultation, error: insertError } = await db
      .from('consultations')
      .insert({
        client_id,
        attorney_id,
        scheduled_date,
        scheduled_time,
        case_id: case_id || null,
        duration_minutes: duration_minutes || 60,
        meeting_type: meeting_type || 'in_person',
        notes: notes ? sanitizeString(notes) : null,
        status: status || 'scheduled',
      })
      .select('*, client:profiles!consultations_client_id_fkey(user_id, full_name, email), attorney:profiles!consultations_attorney_id_fkey(user_id, full_name, email, role), case:cases(id, matter_number, title)')
      .single();

    if (insertError || !consultation) {
      console.error('Create consultation insert error:', insertError);
      return apiError('Failed to create consultation', 500, 'CREATE_CONSULTATION_ERROR');
    }

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_CONSULTATION',
      resource_type: 'consultation',
      resource_id: consultation.id,
      details: `Consultation scheduled for client ${client_id} with attorney ${attorney_id}`,
    });

    // Create notification for the attorney
    await db.from('notifications').insert({
      user_id: attorney_id,
      type: 'consultation',
      title: 'New Consultation Scheduled',
      message: `A consultation has been scheduled with ${client.full_name || client.email} on ${scheduled_date} at ${scheduled_time}`,
      link: `/consultations/${consultation.id}`,
      related_id: consultation.id,
    });

    return apiResponse(consultation, 201);
  } catch (error) {
    console.error('Create consultation error:', error);
    return apiError('Failed to create consultation', 500, 'CREATE_CONSULTATION_ERROR');
  }
}
