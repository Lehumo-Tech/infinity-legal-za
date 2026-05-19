/**
 * GET/POST /api/cases - List/Create cases with pagination
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiRateLimiter, checkHighRisk } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult, checkRateLimit, withMiddleware } from '@/lib/middleware';

// GET - List cases with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);
    
    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const urgency = url.searchParams.get('urgency');
    const search = url.searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (case_type) where.case_type = case_type;
    if (urgency) where.urgency = urgency;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { matter_number: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Non-admin users can only see their own cases
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      where.OR = [
        { client_id: auth.user.userId },
        { lead_attorney_id: auth.user.userId },
        { support_paralegal_id: auth.user.userId },
      ];
    }

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          client: { select: { id: true, full_name: true, email: true } },
          lead_attorney: { select: { id: true, full_name: true } },
          support_paralegal: { select: { id: true, full_name: true } },
          _count: { select: { documents: true, tasks: true, messages: true } },
        },
      }),
      db.case.count({ where }),
    ]);

    return apiResponse({
      data: cases,
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { title, description, case_type, urgency, client_id, estimated_value } = body;

    if (!title || !case_type || !urgency || !client_id) {
      return apiError('Title, case type, urgency, and client are required', 400, 'MISSING_FIELDS');
    }

    // High-risk detection
    const highRiskCheck = checkHighRisk(`${title} ${description || ''}`);

    // Generate matter number
    const currentYear = new Date().getFullYear();
    const caseCount = await db.case.count();
    const matter_number = `IL-${currentYear}-${String(caseCount + 1).padStart(4, '0')}`;

    const newCase = await db.case.create({
      data: {
        matter_number,
        title,
        description: description || null,
        case_type,
        urgency,
        status: 'intake',
        client_id,
        lead_attorney_id: auth.user.userId,
        estimated_value: estimated_value || null,
        is_high_risk: highRiskCheck.isHighRisk,
      },
      include: {
        client: { select: { full_name: true, email: true } },
        lead_attorney: { select: { full_name: true } },
      },
    });

    // Create timeline entry
    await db.caseTimeline.create({
      data: {
        case_id: newCase.id,
        user_id: auth.user.userId,
        action: 'CASE_CREATED',
        description: 'Case created and assigned',
      },
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
