/**
 * GET/PUT/DELETE /api/consultations/[id] - Get/Update/Cancel a single consultation
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values
const VALID_STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
const VALID_MEETING_TYPES = ['in_person', 'video_call', 'phone_call'];

// GET - Get single consultation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    const consultation = await db.consultation.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        attorney: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        case: {
          select: {
            id: true,
            matter_number: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!consultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    // Verify consultation exists
    const existingConsultation = await db.consultation.findUnique({ where: { id } });
    if (!existingConsultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

    const body = await request.json();
    const {
      status,
      notes,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      meeting_type,
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
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;
    if (scheduled_date !== undefined) updateData.scheduled_date = new Date(scheduled_date);
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (meeting_type !== undefined) updateData.meeting_type = meeting_type;

    const updatedConsultation = await db.consultation.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        attorney: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
        case: {
          select: {
            id: true,
            matter_number: true,
            title: true,
          },
        },
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_CONSULTATION',
      resource_type: 'consultation',
      resource_id: id,
      details: `Consultation updated`,
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    // Verify consultation exists
    const existingConsultation = await db.consultation.findUnique({ where: { id } });
    if (!existingConsultation) {
      return apiError('Consultation not found', 404, 'CONSULTATION_NOT_FOUND');
    }

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
      details: `Consultation cancelled`,
    });

    return apiResponse(cancelledConsultation);
  } catch (error) {
    console.error('Cancel consultation error:', error);
    return apiError('Failed to cancel consultation', 500, 'CANCEL_CONSULTATION_ERROR');
  }
}
