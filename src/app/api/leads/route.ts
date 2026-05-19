/**
 * GET/POST /api/leads - List/Create leads with pagination
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
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

    return apiResponse({
      data: leads,
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

    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        source,
        case_type: case_type || null,
        description: description || null,
        status: 'new',
        first_contact_date: new Date(),
        sla_deadline: new Date(Date.now() + 7 * 86400000), // 7-day SLA
        lead_score: 50, // Default score
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
