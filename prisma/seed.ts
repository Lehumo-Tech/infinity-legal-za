/**
 * Infinity Legal ZA - Database Seed Script
 *
 * Bootstraps the platform with ONLY the real product configuration:
 *   1. Three pricing plans (Civil Legal Plan, Labour Legal Plan, Extensive Plan)
 *      — real product data with real ZAR prices.
 *   2. Slug-migration cleanup (maps legacy slugs to the current PricingView.tsx slugs).
 *   3. A single bootstrap managing_director admin account, so the platform stays
 *      accessible when Clerk auth keys are not yet configured. Once Clerk is
 *      enabled, users are managed in the Clerk dashboard and this bootstrap
 *      admin can be removed.
 *   4. A single POPIA consent log for that bootstrap admin only.
 *
 * NO simulated client data, fake staff accounts, demo cases, or sample
 * subscriptions are created. The previous test fixtures (brian@, tshepo@,
 * thabo@example.com, sarah@example.com, etc.) have all been removed.
 *
 * Run with: bun run db:seed
 *
 * Bootstrap login (delete after Clerk is enabled):
 *   tidimalo@infinitylegal.org / Tidimalo@2025!
 *
 * IMPORTANT: Uses bcryptjs (SALT_ROUNDS=12) for password hashing to match
 *            the verification path in src/lib/local-auth.ts.
 * IMPORTANT: Plan slugs MUST remain `civil_legal_plan`, `labour_legal_plan`,
 *            `extensive_plan` — they match PricingView.tsx PLAN_STYLES keys.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding Infinity Legal ZA database...\n');

  // ─── Create / Update Pricing Plans ───
  // IMPORTANT: Slugs MUST match PricingView.tsx PLAN_STYLES keys
  // (civil_legal_plan, labour_legal_plan, extensive_plan)
  const plans = [
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

  for (const plan of plans) {
    const existing = await prisma.pricingPlan.findUnique({
      where: { slug: plan.slug },
    });
    if (existing) {
      // Update existing plan with correct data
      await prisma.pricingPlan.update({
        where: { slug: plan.slug },
        data: plan,
      });
      console.log(`✏️  Updated plan: ${plan.name} (R${plan.price_monthly}/mo)`);
    } else {
      await prisma.pricingPlan.create({ data: plan });
      console.log(`✅ Created plan: ${plan.name} (R${plan.price_monthly}/mo)`);
    }
  }

  // ─── Slug Migration Cleanup ───
  // Map old slugs to new slugs so any historical rows referencing legacy slugs
  // are repointed at the canonical plan before the legacy plan is deleted.
  const slugMigration: Record<string, string> = {
    'civil-legal': 'civil_legal_plan',
    'labour-legal': 'labour_legal_plan',
    'extensive-cover': 'extensive_plan',
  };
  for (const [oldSlug, newSlug] of Object.entries(slugMigration)) {
    const old = await prisma.pricingPlan.findUnique({ where: { slug: oldSlug } });
    if (old) {
      // Migrate any clients/subscriptions referencing the old plan to the new plan
      const newPlan = await prisma.pricingPlan.findUnique({ where: { slug: newSlug } });
      if (newPlan) {
        await prisma.client.updateMany({ where: { plan_id: old.id }, data: { plan_id: newPlan.id } });
        await prisma.userSubscription.updateMany({ where: { plan_id: old.id }, data: { plan_id: newPlan.id } });
      }
      // Now safe to delete the old plan
      await prisma.pricingPlan.delete({ where: { slug: oldSlug } });
      console.log(`🗑️  Migrated & removed old plan slug: ${oldSlug} → ${newSlug}`);
    }
  }

  // ─── Bootstrap Admin (Managing Director) ───
  // This is the ONLY user created by the seed. It exists so the platform is
  // accessible when Clerk auth keys are absent. Once Clerk is enabled, users
  // are managed in Clerk's dashboard and this bootstrap admin can be removed.
  const passwordExpiry = new Date();
  passwordExpiry.setDate(passwordExpiry.getDate() + 90);

  const adminPasswordHash = await hashPassword('Tidimalo@2025!');

  const adminEmail = 'tidimalo@infinitylegal.org';
  const adminData = {
    email: adminEmail,
    password: adminPasswordHash,
    full_name: 'Tidimalo Tsatsi',
    phone: '+27 11 555 0100',
    role: 'managing_director',
    department: 'management',
    practice_number: 'NP/2019/0001',
    bar_admission_date: new Date('2010-06-15'),
    specialization: JSON.stringify(['corporate_commercial', 'civil_litigation', 'labour_law']),
    is_active: true,
    email_verified: true,
    popi_consent: true,
    password_expires_at: passwordExpiry,
    last_password_change: new Date(),
  };

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUserId: string;
  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: adminData,
    });
    adminUserId = existingAdmin.id;
    console.log(`✏️  Updated bootstrap admin: ${adminEmail} (bcrypt password)`);
  } else {
    const admin = await prisma.user.create({ data: adminData });
    adminUserId = admin.id;
    console.log(`✅ Created bootstrap admin: ${adminData.full_name} (${adminData.role})`);
  }

  // ─── POPIA Consent Log (bootstrap admin only) ───
  const existingConsent = await prisma.consentLog.findFirst({
    where: { user_id: adminUserId, consent_type: 'popi_act' },
  });
  if (!existingConsent) {
    await prisma.consentLog.create({
      data: {
        user_id: adminUserId,
        consent_type: 'popi_act',
        granted: true,
        ip_address: '127.0.0.1',
        version: '1.0',
      },
    });
    console.log('✅ Created POPIA consent log for bootstrap admin');
  } else {
    console.log('ℹ️  POPIA consent log already exists for bootstrap admin');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Bootstrap Login (delete once Clerk is enabled):');
  console.log('   ┌──────────────────────────────────────────────────────┐');
  console.log('   │  Email:    tidimalo@infinitylegal.org                │');
  console.log('   │  Password: Tidimalo@2025!                            │');
  console.log('   │  Role:     managing_director                         │');
  console.log('   └──────────────────────────────────────────────────────┘');
  console.log('\n🧹 All simulated client / case / staff data has been removed.');
  console.log('   Real users and their data are created at runtime via sign-up.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
