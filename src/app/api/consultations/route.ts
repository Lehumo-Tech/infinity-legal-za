/**
 * GET/POST /api/consultations - List/Create consultations with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

// GET - List consultations with pagination and filters
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

    const attorney_id = url.searchParams.get('attorney_id');
    const client_id = url.searchParams.get('client_id');
    const status = url.searchParams.get('status');
    const date_from = url.searchParams.get('date_from');
    const date_to = url.searchParams.get('date_to');

    // Build query — consultations.attorney_id FK → attorneys(id) → profiles(id)
    // consultations has scheduled_at (not scheduled_date/scheduled_time)
    // cases has case_ref (not matter_number)
    let query = db
      .from('consultations')
      .select('*, client:profiles!consultations_client_id_fkey(id, full_name, email, phone), attorney:attorneys!consultations_attorney_id_fkey(id, profile:profiles(full_name, email, role)), case:cases(id, case_ref, title)', { count: 'exact' });

    // Permission-based access control
    const canViewAll =
      hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES) ||
      hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS);

    if (!canViewAll) {
      // Clients can only see their own consultations
      query = query.eq('client_id', auth.user.userId);
    }

    if (attorney_id) query = query.eq('attorney_id', attorney_id);
    if (client_id) query = query.eq('client_id', client_id);
    if (status) query = query.eq('status', status);
    // Use scheduled_at instead of scheduled_date
    if (date_from) query = query.gte('scheduled_at', date_from);
    if (date_to) query = query.lte('scheduled_at', date_to);

    const { data: consultations, count, error } = await query
      .order('scheduled_at', { ascending: false })
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
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const body = await request.json();
    let {
      client_id,
      client_email,
      client_name,
      attorney_id,
      scheduled_at,
      case_id,
      duration_minutes,
      meeting_type,
      notes,
      status,
      location,
      meeting_link,
    } = body;

    // Resolve client_id: accept either client_id directly, or client_email+client_name
    if (!client_id && client_email) {
      // Look up existing profile by email
      const { data: existingProfile } = await db
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', client_email)
        .maybeSingle();

      if (existingProfile) {
        client_id = existingProfile.id;
      } else {
        // Create a new client profile
        const { data: newProfile, error: profileError } = await db
          .from('profiles')
          .insert({
            email: client_email,
            full_name: client_name || client_email.split('@')[0],
            role: 'client',
          })
          .select('id, full_name, email')
          .single();

        if (profileError || !newProfile) {
          console.error('Create client profile error:', profileError);
          return apiError('Failed to create client profile', 500, 'CREATE_CLIENT_ERROR');
        }
        client_id = newProfile.id;
      }
    }

    // Validate required fields — schema has scheduled_at (not scheduled_date + scheduled_time)
    if (!client_id || !scheduled_at) {
      return apiError(
        'client_id (or client_email) and scheduled_at are required',
        400,
        'MISSING_FIELDS'
      );
    }

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Validate that the attorney exists in attorneys table if provided
    if (attorney_id) {
      const { data: attorney } = await db
        .from('attorneys')
        .select('id, profile:profiles(full_name, email, role)')
        .eq('id', attorney_id)
        .single();

      if (!attorney) {
        return apiError('Attorney not found', 404, 'ATTORNEY_NOT_FOUND');
      }
    }

    // Validate client exists
    const { data: client } = await db
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', client_id)
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
        attorney_id: attorney_id || null,
        scheduled_at,
        case_id: case_id || null,
        duration_minutes: duration_minutes || 60,
        meeting_type: meeting_type || 'in_person',
        notes: notes ? sanitizeString(notes) : null,
        status: status || 'scheduled',
        location: location || null,
        meeting_link: meeting_link || null,
      })
      .select('*, client:profiles!consultations_client_id_fkey(id, full_name, email), attorney:attorneys!consultations_attorney_id_fkey(id, profile:profiles(full_name, email, role)), case:cases(id, case_ref, title)')
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
      details: { message: `Consultation scheduled for client ${client_id}` },
    });

    // Create notification for the attorney — notifications has no `related_id` column
    if (attorney_id) {
      await db.from('notifications').insert({
        user_id: attorney_id,
        type: 'consultation',
        title: 'New Consultation Scheduled',
        message: `A consultation has been scheduled with ${client.full_name || client.email} on ${scheduled_at}`,
        link: `/consultations/${consultation.id}`,
      });
    }

    return apiResponse(consultation, 201);
  } catch (error) {
    console.error('Create consultation error:', error);
    return apiError('Failed to create consultation', 500, 'CREATE_CONSULTATION_ERROR');
  }
}
