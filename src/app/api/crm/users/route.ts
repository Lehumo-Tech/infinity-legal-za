/**
 * GET /api/crm/users - List all users with subscription info
 * PATCH /api/crm/users - Update user role
 * DELETE /api/crm/users - Deactivate user
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || 'all';

    // Build query
    let query = db
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        created_at,
        email_verified
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('CRM users query error:', error);
      return apiError('Failed to fetch users', 500, 'USERS_FETCH_ERROR');
    }

    // Fetch subscription info for each user
    const usersWithSubs = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const { data: subs } = await db
          .from('user_subscriptions')
          .select('status, plan_id, pricing_plans(name)')
          .eq('user_id', profile.id)
          .in('status', ['active', 'trial', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1);

        const sub = (subs || [])[0];
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          subscription_status: sub?.status || null,
          subscription_plan: (sub as any)?.pricing_plans?.name || null,
          created_at: profile.created_at,
          is_active: !profile.email_verified === false, // Derive from email_verified since profiles has no is_active column
        };
      })
    );

    return apiResponse(usersWithSubs);
  } catch (error) {
    console.error('CRM users error:', error);
    return apiError('Failed to fetch users', 500, 'USERS_ERROR');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return apiError('userId and role are required', 400, 'MISSING_FIELDS');
    }

    // Only roles allowed by the profiles.role CHECK constraint
    const validRoles = [
      'managing_director', 'admin', 'attorney', 'paralegal',
      'systems_admin', 'client',
    ];

    if (!validRoles.includes(role)) {
      return apiError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Get current user data for audit
    const { data: currentUser } = await db
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    const { error: updateError } = await db
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return apiError('Failed to update role', 500, 'ROLE_UPDATE_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'update',
      resource_type: 'user_role',
      resource_id: userId,
      details: `Changed role of ${currentUser?.full_name || userId} from ${currentUser?.role || 'unknown'} to ${role}`,
    });

    return apiResponse({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('CRM role update error:', error);
    return apiError('Failed to update role', 500, 'ROLE_ERROR');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
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

    const { data: currentUser } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { error: updateError } = await db
      .from('profiles')
      // Schema has no is_active column — use email_verified as deactivation signal
      .update({ email_verified: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Deactivation error:', updateError);
      return apiError('Failed to deactivate user', 500, 'DEACTIVATE_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'update',
      resource_type: 'user_status',
      resource_id: userId,
      details: `Deactivated user ${currentUser?.full_name || userId}`,
    });

    return apiResponse({ message: 'User deactivated' });
  } catch (error) {
    console.error('CRM deactivate error:', error);
    return apiError('Failed to deactivate user', 500, 'DEACTIVATE_ERROR');
  }
}
