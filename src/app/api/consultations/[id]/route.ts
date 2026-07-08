/**
 * GET/PUT/DELETE /api/consultations/[id] - Get/Update/Cancel a single consultation via Prisma
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
const VALID_MEETING_TYPES = ['in_person', 'video_call', 'phone_call'];

// Staff roles that can access any consultation
const STAFF_ROLES = ['managing_director', 'systems_admin', 'admin', 'attorney', 'paralegal'];

/**
 * Permission check: callers who are not staff may only access their own
 * consultations. Returns an apiError response if forbidden, otherwise null.
 */
async function assertConsultationAccess(
  auth: { authenticated: true; user: { userId: string; role: string } } | { authenticated: false; user: null; error: any },
  consultation: { client_id: string } | null
) {
  if (!consultation) return null; // caller handles 404 separately
  if (auth.authenticated && STAFF_ROLES.includes(auth.user.role)) return null;

  // Client: must own the consultation (consultation.client_id references User.id)
  if (!auth.authenticated) {
    return apiError('Authentication required', 401, 'AUTH_REQUIRED');
  }
  const client = await db.client.findFirst({
    where: { user_id: auth.user.userId },
    select: { id: true, user_id: true },
  });
  if (!client || consultation.client_id !== client.user_id) {
    return apiError('Insufficient permissions', 403, 'FORBIDDEN');
  }
  return null;
}

// GET - Get single consultation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    const consultation = await db.consultation.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, full_name: true, email: true, phone: true } },
        attorney: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true, status: true } },
      },
    });

    if (!consultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const forbidden = await assertConsultationAccess(auth, consultation);
    if (forbidden) return forbidden;

    return apiResponse(consultation);
  } catch (error) {
    console.error('Get consultation error:', error);
    return apiError('Failed to load consultation', 500, 'CONSULTATION_ERROR');
  }
}

// PUT - Update a consultation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    // Verify consultation exists
    const existingConsultation = await db.consultation.findUnique({
      where: { id },
      select: { id: true, client_id: true },
    });

    if (!existingConsultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const forbidden = await assertConsultationAccess(auth, existingConsultation);
    if (forbidden) return forbidden;

    const body = await request.json();
    const {
      status,
      notes,
      scheduled_at,
      duration_minutes,
      meeting_type,
      location,
      meeting_link,
    } = body;

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate meeting_type enum if provided
    if (meeting_type && !VALID_MEETING_TYPES.includes(meeting_type)) {
      return apiError(`Invalid meeting_type. Must be one of: ${VALID_MEETING_TYPES.join(', ')}`, 400, 'INVALID_MEETING_TYPE');
    }

    // Build update data
    const updateData: Prisma.ConsultationUpdateInput = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;
    if (scheduled_at !== undefined) updateData.scheduled_at = new Date(scheduled_at);
    if (duration_minutes !== undefined) updateData.duration_minutes = Number(duration_minutes);
    if (meeting_type !== undefined) updateData.meeting_type = meeting_type;
    if (location !== undefined) updateData.location = location;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;

    const updatedConsultation = await db.consultation.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, full_name: true, email: true } },
        attorney: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_CONSULTATION',
      resource_type: 'consultation',
      resource_id: id,
      details: { message: 'Consultation updated' },
    });

    return apiResponse(updatedConsultation);
  } catch (error) {
    console.error('Update consultation error:', error);
    return apiError('Failed to update consultation', 500, 'UPDATE_CONSULTATION_ERROR');
  }
}

// DELETE - Cancel consultation (set status to 'cancelled')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    // Verify consultation exists
    const existingConsultation = await db.consultation.findUnique({
      where: { id },
      select: { id: true, client_id: true },
    });

    if (!existingConsultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const forbidden = await assertConsultationAccess(auth, existingConsultation);
    if (forbidden) return forbidden;

    // Cancel the consultation by setting status to 'cancelled'
    const cancelledConsultation = await db.consultation.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CANCEL_CONSULTATION',
      resource_type: 'consultation',
      resource_id: id,
      details: { message: 'Consultation cancelled' },
    });

    return apiResponse(cancelledConsultation);
  } catch (error) {
    console.error('Cancel consultation error:', error);
    return apiError('Failed to cancel consultation', 500, 'CANCEL_CONSULTATION_ERROR');
  }
}
