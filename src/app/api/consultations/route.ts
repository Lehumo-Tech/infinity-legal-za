/**
 * GET/POST /api/consultations - List/Create consultations via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

// GET - List consultations with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const attorney_id = url.searchParams.get('attorney_id');
    const client_id = url.searchParams.get('client_id');
    const status = url.searchParams.get('status');
    const date_from = url.searchParams.get('date_from');
    const date_to = url.searchParams.get('date_to');

    const role = auth.user.role as RoleKey;
    const canViewAll =
      hasPermission(role, PERMISSIONS.VIEW_ALL_CASES) ||
      hasPermission(role, PERMISSIONS.VIEW_LEADS);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Permission-based access control
    if (!canViewAll) {
      // Clients can only see their own consultations
      where.client_id = auth.user.userId;
    }

    if (attorney_id) where.attorney_id = attorney_id;
    if (client_id) where.client_id = client_id;
    if (status) where.status = status;

    // Date range filters
    if (date_from || date_to) {
      const scheduledAt: Record<string, Date> = {};
      if (date_from) scheduledAt.gte = new Date(date_from);
      if (date_to) scheduledAt.lte = new Date(date_to);
      where.scheduled_at = scheduledAt;
    }

    const [consultations, total] = await Promise.all([
      db.consultation.findMany({
        where,
        orderBy: { scheduled_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          client: { select: { id: true, full_name: true, email: true, phone: true } },
          attorney: { select: { id: true, full_name: true, email: true, role: true } },
          case: { select: { id: true, case_ref: true, title: true } },
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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const body = await request.json();
    const {
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

    // Resolve client_id
    let resolvedClientId = client_id;

    if (!resolvedClientId && client_email) {
      // Look up existing user by email
      const existingUser = await db.user.findUnique({
        where: { email: client_email.toLowerCase().trim() },
        include: { client_profile: true },
      });

      if (existingUser?.client_profile) {
        resolvedClientId = existingUser.id;
      } else {
        // We need a user account for the client
        return apiError('Client not found. Please create a client account first.', 404, 'CLIENT_NOT_FOUND');
      }
    }

    if (!resolvedClientId || !scheduled_at) {
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

    // Validate client exists
    const clientUser = await db.user.findUnique({
      where: { id: resolvedClientId },
    });
    if (!clientUser) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // Validate attorney exists if provided
    if (attorney_id) {
      const attorney = await db.user.findUnique({
        where: { id: attorney_id },
      });
      if (!attorney) {
        return apiError('Attorney not found', 404, 'ATTORNEY_NOT_FOUND');
      }
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
        client_id: resolvedClientId,
        attorney_id: attorney_id || resolvedClientId, // fallback to client if no attorney
        scheduled_at: new Date(scheduled_at),
        case_id: case_id || null,
        duration_minutes: duration_minutes || 60,
        meeting_type: meeting_type || null,
        notes: notes || null,
        status: status || 'scheduled',
        location: location || null,
        meeting_link: meeting_link || null,
      },
      include: {
        client: { select: { id: true, full_name: true, email: true } },
        attorney: { select: { id: true, full_name: true, email: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_CONSULTATION',
      resource_type: 'consultation',
      resource_id: consultation.id,
      details: { message: `Consultation scheduled for client ${resolvedClientId}` },
    });

    // Create notification for the attorney
    if (attorney_id) {
      await db.notification.create({
        data: {
          user_id: attorney_id,
          title: 'New Consultation Scheduled',
          message: `A consultation has been scheduled with ${clientUser.full_name || clientUser.email} on ${scheduled_at}`,
          type: 'info',
          link: `/consultations/${consultation.id}`,
        },
      });
    }

    return apiResponse(consultation, 201);
  } catch (error) {
    console.error('Create consultation error:', error);
    return apiError('Failed to create consultation', 500, 'CREATE_CONSULTATION_ERROR');
  }
}
