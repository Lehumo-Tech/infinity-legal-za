/**
 * GET/POST /api/consultations - List/Create consultations with pagination via Prisma/SQLite
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);

    const attorney_id = url.searchParams.get('attorney_id');
    const client_id = url.searchParams.get('client_id');
    const status = url.searchParams.get('status');
    const date_from = url.searchParams.get('date_from');
    const date_to = url.searchParams.get('date_to');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (attorney_id) where.attorney_id = attorney_id;
    if (client_id) where.client_id = client_id;
    if (status) where.status = status;
    if (date_from || date_to) {
      const scheduled_date: Record<string, Date> = {};
      if (date_from) scheduled_date.gte = new Date(date_from);
      if (date_to) scheduled_date.lte = new Date(date_to);
      where.scheduled_date = scheduled_date;
    }

    const [consultations, total] = await Promise.all([
      db.consultation.findMany({
        where,
        skip,
        take,
        orderBy: { scheduled_date: 'desc' },
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
            },
          },
        },
      }),
      db.consultation.count({ where }),
    ]);

    return apiResponse({
      data: consultations,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Consultations list error:', error);
    return apiError('Failed to load consultations', 500, 'CONSULTATIONS_ERROR');
  }
}

// POST - Create a new consultation
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
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
    const attorney = await db.user.findUnique({
      where: { id: attorney_id },
    });

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
    const client = await db.user.findUnique({
      where: { id: client_id },
    });

    if (!client) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // Validate case exists if provided
    if (case_id) {
      const caseRecord = await db.case.findUnique({
        where: { id: case_id },
      });
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    const consultation = await db.consultation.create({
      data: {
        client_id,
        attorney_id,
        scheduled_date: new Date(scheduled_date),
        scheduled_time,
        case_id: case_id || null,
        duration_minutes: duration_minutes || 60,
        meeting_type: meeting_type || 'in_person',
        notes: notes ? sanitizeString(notes) : null,
        status: status || 'scheduled',
      },
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

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_CONSULTATION',
      resource_type: 'consultation',
      resource_id: consultation.id,
      details: `Consultation scheduled for client ${client_id} with attorney ${attorney_id}`,
    });

    // Create notification for the attorney
    await db.notification.create({
      data: {
        user_id: attorney_id,
        type: 'consultation',
        title: 'New Consultation Scheduled',
        message: `A consultation has been scheduled with ${client.full_name || client.email} on ${scheduled_date} at ${scheduled_time}`,
        link: `/consultations/${consultation.id}`,
        related_id: consultation.id,
      },
    });

    return apiResponse(consultation, 201);
  } catch (error) {
    console.error('Create consultation error:', error);
    return apiError('Failed to create consultation', 500, 'CREATE_CONSULTATION_ERROR');
  }
}
