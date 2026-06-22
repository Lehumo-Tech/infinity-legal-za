/**
 * GET/PUT/DELETE /api/leads/[id] - Get/Update/Delete a single lead via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_SOURCES = ['website', 'referral', 'social_media', 'google_ads', 'walk_in', 'phone', 'email', 'partner', 'event', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'nurturing'];
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'intellectual_property', 'tax', 'personal_injury', 'debt_recovery', 'other'];

// GET - Get single lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // leads has `assigned_to` FK to profiles(id), not assigned_paralegal_id / assigned_officer_id
    const { data: lead, error: fetchError } = await db
      .from('leads')
      .select('*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, email, role)')
      .eq('id', id)
      .single();

    if (fetchError || !lead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    return apiResponse(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    return apiError('Failed to load lead', 500, 'LEAD_ERROR');
  }
}

// PUT - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const { data: existingLead, error: fetchError } = await db
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      source,
      status,
      case_type,
      description,
      assigned_to,
      lead_score,
      estimated_value,
      notes,
      converted_case_id,
    } = body;

    // Validate source enum if provided
    if (source && !VALID_SOURCES.includes(source)) {
      return apiError(`Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`, 400, 'INVALID_SOURCE');
    }

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate case_type enum if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Build update data — leads has first_name/last_name (not name), assigned_to (not assigned_paralegal_id/assigned_officer_id)
    const updateData: Record<string, unknown> = {};
    if (first_name !== undefined) updateData.first_name = sanitizeString(first_name);
    if (last_name !== undefined) updateData.last_name = sanitizeString(last_name);
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? sanitizeString(phone) : null;
    if (company !== undefined) updateData.company = company ? sanitizeString(company) : null;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (case_type !== undefined) updateData.case_type = case_type || null;
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
    if (lead_score !== undefined) updateData.lead_score = lead_score || null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;

    // If status changes to 'retained', set converted_case_id if provided
    if (status === 'retained' && converted_case_id) {
      // Verify the case exists
      const { data: caseExists } = await db
        .from('cases')
        .select('id')
        .eq('id', converted_case_id)
        .single();
      if (!caseExists) {
        return apiError('Converted case not found', 404, 'CASE_NOT_FOUND');
      }
      updateData.converted_case_id = converted_case_id;
    }

    const { data: updatedLead, error: updateError } = await db
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, email)')
      .single();

    if (updateError || !updatedLead) {
      console.error('Update lead error:', updateError);
      return apiError('Failed to update lead', 500, 'UPDATE_LEAD_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: { message: `Lead "${existingLead.first_name} ${existingLead.last_name}" updated` },
    });

    return apiResponse(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    return apiError('Failed to update lead', 500, 'UPDATE_LEAD_ERROR');
  }
}

// DELETE - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const { data: existingLead, error: fetchError } = await db
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const { error: deleteError } = await db
      .from('leads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete lead error:', deleteError);
      return apiError('Failed to delete lead', 500, 'DELETE_LEAD_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: { message: `Lead "${existingLead.first_name} ${existingLead.last_name}" deleted` },
    });

    return apiResponse({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return apiError('Failed to delete lead', 500, 'DELETE_LEAD_ERROR');
  }
}
