/**
 * GET/POST /api/cases - List/Create cases with pagination via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { checkHighRisk, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

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

    // Build where clause
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
        },
      }),
      db.case.count({ where }),
    ]);

    const formattedCases = cases.map(c => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      description: c.description,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      client_id: c.client_id,
      lead_attorney_id: c.lead_attorney_id,
      support_paralegal_id: c.support_paralegal_id,
      court_date: c.court_date,
      estimated_value: c.estimated_value,
      is_high_risk: c.is_high_risk,
      next_action: c.next_action,
      next_action_date: c.next_action_date,
      created_at: c.created_at,
      updated_at: c.updated_at,
      client: c.client,
      lead_attorney: c.lead_attorney,
    }));

    return apiResponse({
      data: formattedCases,
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

    // Validate enum fields
    const validCaseTypes = ['family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning', 'corporate_commercial', 'debt_collection', 'immigration', 'labour_law', 'personal_injury', 'other'];
    if (!validCaseTypes.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${validCaseTypes.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencies.includes(urgency)) {
      return apiError(`Invalid urgency. Must be one of: ${validUrgencies.join(', ')}`, 400, 'INVALID_URGENCY');
    }

    // Validate client exists
    const clientExists = await db.user.findUnique({ where: { id: client_id } });
    if (!clientExists) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // High-risk detection
    const highRiskCheck = checkHighRisk(`${title} ${description || ''}`);

    // Sanitize string inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = description ? sanitizeString(description) : null;

    // Generate matter number
    const caseCount = await db.case.count();
    const currentYear = new Date().getFullYear();
    const matter_number = `IL-${currentYear}-${String(caseCount + 1).padStart(4, '0')}`;

    const newCase = await db.case.create({
      data: {
        matter_number,
        title: sanitizedTitle,
        description: sanitizedDescription,
        case_type,
        urgency,
        status: 'intake',
        client_id,
        lead_attorney_id: auth.user.userId,
        estimated_value: estimated_value || null,
        is_high_risk: highRiskCheck.isHighRisk,
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
