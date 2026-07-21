/**
 * GET /api/crm/users - List all users with subscription info
 * PATCH /api/crm/users - Update user role
 * DELETE /api/crm/users - Deactivate user (set is_active = false)
 *
 * Rewritten from Supabase to Prisma/SQLite.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || 'all';

    // Build where clause
    const where: Record<string, unknown> = {};
    if (role !== 'all') {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Fetch users with their client profile (→ subscriptions → plan)
    const users = await db.user.findMany({
      where,
      take: 200,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        client_profile: {
          select: {
            id: true,
            subscriptions: {
              where: { status: { in: ['active', 'trial', 'past_due'] } },
              take: 1,
              orderBy: { created_at: 'desc' },
              select: {
                status: true,
                plan: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const usersWithSubs = users.map((user) => {
      const sub = user.client_profile?.subscriptions?.[0];
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        // The Client profile PK — required by POST /api/cases { client_id }.
        // Without this, staff cannot create cases for clients who don't yet have one.
        client_profile_id: user.client_profile?.id || null,
        subscription_status: sub?.status || null,
        subscription_plan: sub?.plan?.name || null,
        created_at: user.created_at,
        is_active: user.is_active,
      };
    });

    return apiResponse(usersWithSubs);
  } catch (error) {
    console.error('CRM users error:', error);
    return apiError('Failed to fetch users', 500, 'USERS_ERROR');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return apiError('userId and role are required', 400, 'MISSING_FIELDS');
    }

    // Only roles allowed by the User.role CHECK constraint
    const validRoles = [
      'managing_director', 'admin', 'attorney', 'paralegal',
      'systems_admin', 'client',
    ];

    if (!validRoles.includes(role)) {
      return apiError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Get current user data for audit
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { full_name: true, role: true },
    });

    if (!currentUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'update',
      resource_type: 'user_role',
      resource_id: userId,
      details: { message: `Changed role of ${currentUser.full_name || userId} from ${currentUser.role || 'unknown'} to ${role}` },
    });

    return apiResponse({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('CRM role update error:', error);
    return apiError('Failed to update role', 500, 'ROLE_ERROR');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return apiError('userId is required', 400, 'MISSING_USER_ID');
    }

    if (userId === auth.user.userId) {
      return apiError('Cannot deactivate yourself', 400, 'SELF_DEACTIVATE');
    }

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { full_name: true },
    });

    if (!currentUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Soft-delete: set is_active = false instead of actually deleting
    await db.user.update({
      where: { id: userId },
      data: { is_active: false },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'update',
      resource_type: 'user_status',
      resource_id: userId,
      details: { message: `Deactivated user ${currentUser.full_name || userId}` },
    });

    return apiResponse({ message: 'User deactivated' });
  } catch (error) {
    console.error('CRM deactivate error:', error);
    return apiError('Failed to deactivate user', 500, 'DEACTIVATE_ERROR');
  }
}
