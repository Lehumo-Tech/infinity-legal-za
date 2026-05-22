/**
 * GET/POST /api/leads - List/Create leads with pagination via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          assigned_paralegal: { select: { id: true, full_name: true } },
          assigned_officer: { select: { id: true, full_name: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    const formattedLeads = leads.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      case_type: l.case_type,
      description: l.description,
      assigned_paralegal_id: l.assigned_paralegal_id,
      assigned_officer_id: l.assigned_officer_id,
      lead_score: l.lead_score,
      estimated_value: l.estimated_value,
      sla_deadline: l.sla_deadline,
      first_contact_date: l.first_contact_date,
      created_at: l.created_at,
      updated_at: l.updated_at,
      assigned_paralegal: l.assigned_paralegal,
      assigned_officer: l.assigned_officer,
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { name, email, phone, source, case_type, description } = body;

    if (!name || !email || !source) {
      return apiError('Name, email, and source are required', 400, 'MISSING_FIELDS');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Validate source enum
    const validSources = ['website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'other'];
    if (!validSources.includes(source)) {
      return apiError(`Invalid source. Must be one of: ${validSources.join(', ')}`, 400, 'INVALID_SOURCE');
    }

    const slaDeadline = new Date(Date.now() + 7 * 86400000);

    const lead = await db.lead.create({
      data: {
        name: sanitizeString(name),
        email: email.toLowerCase(),
        phone: phone ? sanitizeString(phone) : null,
        source,
        case_type: case_type || null,
        description: description ? sanitizeString(description) : null,
        status: 'new',
        first_contact_date: new Date(),
        sla_deadline: slaDeadline,
        lead_score: 50,
      },
    });

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
