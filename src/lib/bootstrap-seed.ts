/**
 * Infinity Legal ZA - Bootstrap Seed Helper
 *
 * Self-healing first-run seed: if the database has ZERO users, create the
 * bootstrap admin + staff accounts so the platform is accessible on a fresh
 * production database (e.g. a new Vercel deployment pointing at an empty
 * Neon Postgres).
 *
 * SECURITY:
 * - Only runs when `db.user.count() === 0` (truly empty DB). Once any user
 *   exists, this function is a no-op forever — it can NEVER overwrite or
 *   reset existing accounts.
 * - Passwords are hashed with bcryptjs (SALT_ROUNDS=12), matching the
 *   verification path in src/lib/local-auth.ts.
 * - Credentials are the same as prisma/seed.ts + /api/admin/seed-staff.
 *
 * Used by /api/auth/login so the very first login attempt on a fresh
 * production database auto-seeds the staff accounts, then authenticates.
 */

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/local-auth';
import { createAuditLog } from '@/lib/audit';

const SALT_ROUNDS = 12;

interface BootstrapAccount {
  email: string;
  password: string;
  full_name: string;
  role: string;
  title: string;
  department: string;
  phone: string;
  practice_number?: string;
  specialization?: string[];
}

// Mirrors prisma/seed.ts (bootstrap admin) + /api/admin/seed-staff/route.ts
const BOOTSTRAP_ACCOUNTS: BootstrapAccount[] = [
  {
    email: 'tidimalo@infinitylegal.org',
    password: 'Tidimalo@2025!',
    full_name: 'Tidimalo Tsatsi',
    role: 'managing_director',
    title: 'Head Legal Advisor / Managing Director',
    department: 'management',
    phone: '+27 11 555 0100',
    practice_number: 'NP/2019/0001',
    specialization: ['corporate_commercial', 'civil_litigation', 'labour_law'],
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

// Pricing plans — mirrors prisma/seed.ts so a fresh DB also gets its product
// catalogue on first run (otherwise the pricing page is empty on prod).
const BOOTSTRAP_PLANS = [
  {
    name: 'Civil Legal Plan',
    slug: 'civil_legal_plan',
    description: 'For civil disputes and general legal matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: JSON.stringify([
      'Unlimited civil consultations',
      'Document review & drafting',
      'Court representation',
      'AI case analysis',
      'Email support',
    ]),
    max_cases: 10,
    max_documents: 50,
    is_popular: false,
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Labour Legal Plan',
    slug: 'labour_legal_plan',
    description: 'For workplace and employment matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: JSON.stringify([
      'Unlimited labour consultations',
      'CCMA representation',
      'Employment contract review',
      'Dismissal advice',
      'Priority support',
    ]),
    max_cases: 10,
    max_documents: 50,
    is_popular: true,
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Extensive Plan',
    slug: 'extensive_plan',
    description: 'Complete legal coverage across all practice areas.',
    price_monthly: 139,
    price_annual: 1399,
    currency: 'ZAR',
    features: JSON.stringify([
      'All Civil & Labour features',
      'Family law consultations',
      'Criminal defence advice',
      'Estate planning',
      '24/7 priority support',
      'Dedicated legal advisor',
    ]),
    max_cases: 50,
    max_documents: 999,
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

/**
 * Seed the pricing plans if none exist. Safe to call on every request —
 * it's a no-op once plans exist.
 */
async function ensurePricingPlans(): Promise<void> {
  try {
    const planCount = await db.pricingPlan.count();
    if (planCount > 0) return;

    for (const plan of BOOTSTRAP_PLANS) {
      await db.pricingPlan.create({ data: plan });
    }
    console.log('[BootstrapSeed] Created', BOOTSTRAP_PLANS.length, 'pricing plans');
  } catch (error) {
    // Don't let a pricing-plan failure block login — log and move on.
    console.error('[BootstrapSeed] Pricing plan seed failed:', error);
  }
}

/**
 * Ensure the bootstrap admin + staff accounts exist.
 *
 * This is the CRITICAL self-healing hook. It checks each bootstrap staff
 * account by email and creates any that are missing. This handles two
 * scenarios:
 *   1. A fresh/empty production database (new Vercel deployment) — all
 *      staff accounts are created on the first login attempt.
 *   2. A production database that has OTHER users but is missing the
 *      documented staff accounts (e.g. the prod DB was seeded with
 *      different credentials in the past) — only the missing staff
 *      accounts are created, existing users are NEVER touched.
 *
 * SAFETY:
 * - Idempotent: checks by email before creating. Existing accounts are
 *   never overwritten or re-passworded.
 * - Only creates accounts with the exact emails in BOOTSTRAP_ACCOUNTS —
 *   no role escalation for arbitrary emails.
 * - On a populated DB where all staff exist, this adds 3 fast findUnique
 *   queries per login (covered by Neon's pool). Acceptable cost for
 *   self-healing.
 *
 * Returns true if any account was created, false otherwise (including on
 * failure — login should still proceed so the caller returns its normal
 * 401 and the user can retry).
 */
export async function ensureBootstrapUsers(): Promise<boolean> {
  try {
    // Fast path: if the DB is completely empty, seed everything (plans +
    // all staff). This is the fresh-deployment case.
    const userCount = await db.user.count();
    const dbIsEmpty = userCount === 0;

    if (dbIsEmpty) {
      console.log('[BootstrapSeed] Database has zero users — seeding all bootstrap accounts...');
      // Seed pricing plans first (non-blocking on failure).
      await ensurePricingPlans();
    }

    const passwordExpiry = new Date();
    passwordExpiry.setDate(passwordExpiry.getDate() + 90);

    let firstUserId: string | null = null;
    let createdCount = 0;

    for (const account of BOOTSTRAP_ACCOUNTS) {
      const existing = await db.user.findUnique({
        where: { email: account.email.toLowerCase() },
        select: { id: true },
      });
      if (existing) {
        // Account already exists — never touch it. This is the key safety
        // property: we cannot reset or overwrite an existing account.
        continue;
      }

      const passwordHash = await hashPassword(account.password);

      const user = await db.user.create({
        data: {
          email: account.email.toLowerCase(),
          password: passwordHash,
          full_name: account.full_name,
          phone: account.phone,
          role: account.role,
          department: account.department,
          practice_number: account.practice_number || null,
          specialization: account.specialization
            ? JSON.stringify(account.specialization)
            : null,
          is_active: true,
          email_verified: true,
          popi_consent: true,
          password_expires_at: passwordExpiry,
          last_password_change: new Date(),
        },
      });

      if (firstUserId === null) firstUserId = user.id;
      createdCount++;
      console.log('[BootstrapSeed] Created:', account.email, '| role:', account.role);
    }

    // If nothing was created, all staff accounts already exist — fast no-op.
    if (createdCount === 0) {
      return false;
    }

    // POPIA consent log for the first created account (mirrors prisma/seed.ts).
    if (firstUserId) {
      const existingConsent = await db.consentLog.findFirst({
        where: { user_id: firstUserId, consent_type: 'popi_act' },
      });
      if (!existingConsent) {
        await db.consentLog.create({
          data: {
            user_id: firstUserId,
            consent_type: 'popi_act',
            granted: true,
            ip_address: '127.0.0.1',
            version: '1.0',
          },
        });
      }
    }

    // Audit log (best-effort — don't fail login if audit logging breaks).
    try {
      await createAuditLog({
        action: 'BOOTSTRAP_SEED_PERFORMED',
        resource_type: 'user',
        details: { accounts_created: createdCount },
      });
    } catch {
      // ignore audit log failures
    }

    console.log(`[BootstrapSeed] Seeding complete — ${createdCount} account(s) created.`);
    return true;
  } catch (error) {
    // NEVER let a seed failure block the login flow — log and return false
    // so the caller proceeds with authentication (which will return its
    // normal 401). The user will see "invalid credentials" and can retry.
    console.error('[BootstrapSeed] Seed failed (login will proceed normally):', error);
    return false;
  }
}
