/**
 * GET/POST /api/cases - List/Create cases with pagination via Prisma/SQLite
 * Role-based filtering:
 * - Clients see only their own cases
 * - Attorneys see cases assigned to them
 * - Admins/managing_director see all cases
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'tax', 'personal_injury', 'debt_recovery', 'other'];
const VALID_STATUSES = ['intake', 'review', 'active', 'on_hold', 'closed', 'archived'];

/**
 * Generate a unique case reference in format INF-YYYYMM-XXXXX
 */
async function generateCaseRef(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INF-${year}${month}`;

  // Find the highest existing case_ref with this prefix
  const existingCases = await db.case.findMany({
    where: { case_ref: { startsWith: prefix } },
    select: { case_ref: true },
    orderBy: { case_ref: 'desc' },
    take: 1,
  });

  let nextNum = 1;
  if (existingCases.length > 0) {
    const lastRef = existingCases[0].case_ref;
    const lastNum = parseInt(lastRef.split('-').pop() || '0', 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(5, '0')}`;
}

// GET - List cases with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const search = url.searchParams.get('search');
    const urgency = url.searchParams.get('urgency');

    const role = auth.user.role as RoleKey;
    const canViewAll = hasPermission(role, PERMISSIONS.VIEW_ALL_CASES);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (!canViewAll) {
      // Client: find their client profile first, then filter by client_id
      const clientProfile = await db.client.findUnique({
        where: { user_id: auth.user.userId },
      });
      if (clientProfile) {
        where.client_id = clientProfile.id;
      } else {
        // Attorney: see cases assigned to them
        const isAttorney = ['attorney', 'associate', 'candidate_attorney'].includes(role);
        if (isAttorney) {
          where.attorney_id = auth.user.userId;
        } else {
          // No access to any cases
          return apiResponse({
            data: [],
            pagination: createPaginationResult(0, page, perPage),
          });
        }
      }
    }

    // Apply filters
    if (status) where.status = status;
    if (case_type) where.case_type = case_type;
    if (urgency) where.urgency = urgency;

    // Search across title, case_ref, description
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { case_ref: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          client: { include: { user: { select: { id: true, full_name: true, email: true } } } },
          attorney: { select: { id: true, full_name: true, email: true, role: true } },
        },
      }),
      db.case.count({ where }),
    ]);

    const formattedCases = cases.map((c) => ({
      id: c.id,
      case_ref: c.case_ref,
      case_number: c.case_number,
      title: c.title,
      description: c.description,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      client_id: c.client_id,
      attorney_id: c.attorney_id,
      opposing_party: c.opposing_party,
      court_name: c.court_name,
      jurisdiction: c.jurisdiction,
      estimated_value: c.estimated_value,
      retainer_amount: c.retainer_amount,
      next_deadline: c.next_deadline,
      notes: c.notes,
      tags: c.tags,
      is_high_risk: c.is_high_risk,
      created_at: c.created_at,
      updated_at: c.updated_at,
      client: c.client?.user ? { id: c.client.user.id, full_name: c.client.user.full_name, email: c.client.user.email } : null,
      lead_attorney: c.attorney ? { id: c.attorney.id, full_name: c.attorney.full_name, email: c.attorney.email } : null,
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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { title, description, case_type, estimated_value, opposing_party, court_name, jurisdiction, notes, urgency } = body;
    let { client_id } = body;

    if (!title || !case_type) {
      return apiError('Title and case type are required', 400, 'MISSING_FIELDS');
    }

    // Validate case_type enum
    if (!VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    // Validate status if provided
    const status = body.status || 'intake';
    if (!VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate urgency if provided
    if (urgency && !['low', 'medium', 'high', 'critical'].includes(urgency)) {
      return apiError('Invalid urgency level', 400, 'INVALID_URGENCY');
    }

    // Resolve client_id: if not provided, try to find the caller's own Client record.
    // This lets clients create cases for themselves without specifying client_id.
    if (!client_id) {
      const ownClient = await db.client.findFirst({ where: { user_id: auth.user.userId } });
      if (ownClient) {
        client_id = ownClient.id;
      }
    }

    if (!client_id) {
      return apiError('Client is required. Select a client or ensure your account has a client profile.', 400, 'MISSING_CLIENT');
    }

    // Validate client exists
    const clientExists = await db.client.findUnique({ where: { id: client_id } });
    if (!clientExists) {
      return apiError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    // Generate unique case reference
    const caseRef = await generateCaseRef();

    // Determine attorney_id: if the creator is an attorney, assign to them
    let attorneyId: string | null = null;
    const creatorRole = auth.user.role as RoleKey;
    if (['attorney', 'associate', 'candidate_attorney'].includes(creatorRole)) {
      attorneyId = auth.user.userId;
    } else if (body.attorney_id) {
      // Validate attorney exists
      const attorneyExists = await db.user.findUnique({
        where: { id: body.attorney_id, role: { in: ['attorney', 'associate', 'candidate_attorney'] } },
      });
      if (attorneyExists) {
        attorneyId = body.attorney_id;
      }
    }

    const newCase = await db.case.create({
      data: {
        case_ref: caseRef,
        title,
        description: description || null,
        case_type,
        status,
        urgency: urgency || 'medium',
        client_id,
        attorney_id: attorneyId,
        estimated_value: estimated_value || null,
        opposing_party: opposing_party || null,
        court_name: court_name || null,
        jurisdiction: jurisdiction || null,
        notes: notes || null,
      },
      include: {
        client: { include: { user: { select: { full_name: true, email: true } } } },
        attorney: { select: { full_name: true, email: true } },
      },
    });

    // Create timeline entry
    await db.caseTimeline.create({
      data: {
        case_id: newCase.id,
        event_type: 'CASE_CREATED',
        event_description: 'Case created and assigned',
        performed_by: auth.user.userId,
        is_system_event: false,
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
