/**
 * POST /api/admin/seed-staff - Create staff accounts using local Prisma/SQLite auth
 *
 * Creates the three designated staff members with proper roles.
 * Admin-only access. Idempotent — skips if accounts already exist.
 *
 * Staff accounts:
 * 1. Tidimalo Tsatsi  — managing_director (Head Legal Advisor / MD)
 * 2. Brian Mokwena    — systems_admin (IT Department & Support / Director)
 * 3. Tshepo Rametse   — attorney role (Legal Advisor)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { hashPassword } from '@/lib/local-auth';

export const dynamic = 'force-dynamic';

const STAFF_ACCOUNTS = [
  {
    email: 'tidimalo@infinitylegal.org',
    password: 'Tidimalo@2025!',
    full_name: 'Tidimalo Tsatsi',
    role: 'managing_director',
    title: 'Head Legal Advisor / Managing Director',
    department: 'management',
    phone: '+27 11 555 0100',
    practice_number: 'NP/2019/0001',
  },
  {
    email: 'brian@infinitylegal.org',
    password: 'Brian@2025!',
    full_name: 'Brian Mokwena',
    role: 'systems_admin',
    title: 'IT Department & Support / Director',
    department: 'it',
    phone: '+27 11 555 0101',
  },
  {
    email: 'tshepo@infinitylegal.org',
    password: 'Tshepo@2025!',
    full_name: 'Tshepo Rametsi',
    role: 'attorney',
    title: 'Legal Advisor',
    department: 'litigation',
    phone: '+27 11 555 0102',
    practice_number: 'NP/2021/0042',
  },
];

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can seed staff accounts', 403, 'FORBIDDEN');
    }

    const results: Array<{
      email: string;
      full_name: string;
      role: string;
      status: 'created' | 'already_exists' | 'error';
      error?: string;
    }> = [];

    for (const staff of STAFF_ACCOUNTS) {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: staff.email.toLowerCase() },
        select: { id: true, role: true, full_name: true },
      });

      if (existingUser) {
        // Fix the role if it's different
        if (existingUser.role !== staff.role || existingUser.full_name !== staff.full_name) {
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              role: staff.role,
              full_name: staff.full_name,
              email_verified: true,
            },
          });
        }

        results.push({
          email: staff.email,
          full_name: staff.full_name,
          role: staff.role,
          status: 'already_exists',
        });
        continue;
      }

      try {
        // Hash the password
        const passwordHash = await hashPassword(staff.password);

        // Create user
        const newUser = await db.user.create({
          data: {
            email: staff.email.toLowerCase(),
            password: passwordHash,
            full_name: staff.full_name,
            phone: staff.phone,
            role: staff.role,
            department: staff.department,
            practice_number: staff.practice_number || null,
            is_active: true,
            email_verified: true,
            popi_consent: true,
          },
        });

        // Audit log
        await createAuditLog({
          user_id: user.userId,
          action: 'STAFF_ACCOUNT_SEEDED',
          resource_type: 'user',
          resource_id: newUser.id,
          details: { email: staff.email, role: staff.role, full_name: staff.full_name },
          ip_address: request.headers.get('x-forwarded-for') || undefined,
        });

        results.push({
          email: staff.email,
          full_name: staff.full_name,
          role: staff.role,
          status: 'created',
        });
      } catch (createErr: any) {
        results.push({
          email: staff.email,
          full_name: staff.full_name,
          role: staff.role,
          status: 'error',
          error: createErr?.message || 'Unknown error',
        });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const existing = results.filter((r) => r.status === 'already_exists').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return apiResponse({
      message: `Staff seeding complete: ${created} created, ${existing} already existed, ${errors} errors`,
      results,
      credentials: results
        .filter((r) => r.status === 'created')
        .map((r) => {
          const staff = STAFF_ACCOUNTS.find((s) => s.email === r.email)!;
          return {
            email: staff.email,
            password: staff.password,
            full_name: staff.full_name,
            role: staff.role,
            title: staff.title,
          };
        }),
    });
  } catch (error) {
    console.error('Staff seed error:', error);
    return apiError('Failed to seed staff accounts', 500, 'SEED_ERROR');
  }
}
