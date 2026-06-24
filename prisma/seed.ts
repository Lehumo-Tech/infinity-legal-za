/**
 * Infinity Legal ZA - Database Seed Script
 * Creates initial pricing plans, staff users, and sample clients with cases.
 * Run with: bun run db:seed
 *
 * Login credentials:
 *   Managing Director: tidimalo@infinitylegal.org / Tidimalo@2025!
 *   Co-Director (IT):  brian@infinitylegal.org / Brian@2025!
 *   Legal Advisor:     tshepo@infinitylegal.org / Tshepo@2025!
 *   Client:            thabo@example.com / Client@2025!
 *   Client:            sarah@example.com / Client@2025!
 *
 * IMPORTANT: Uses bcryptjs for password hashing to match local-auth.ts
 * IMPORTANT: Uses slugs matching PricingView.tsx PLAN_STYLES map
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

  // ─── Create Pricing Plans ───
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

  // Clean up old slug variants if they exist
  // Map old slugs to new slugs for migration
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

  // ─── Create Staff Users ───
  const tidimaloPasswordHash = await hashPassword('Tidimalo@2025!');
  const brianPasswordHash = await hashPassword('Brian@2025!');
  const tshepoPasswordHash = await hashPassword('Tshepo@2025!');
  const clientPasswordHash = await hashPassword('Client@2025!');
  const passwordExpiry = new Date();
  passwordExpiry.setDate(passwordExpiry.getDate() + 90);

  const staffUsers = [
    {
      email: 'tidimalo@infinitylegal.org',
      password: tidimaloPasswordHash,
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
    },
    {
      email: 'brian@infinitylegal.org',
      password: brianPasswordHash,
      full_name: 'Brian Mokwena',
      phone: '+27 11 555 0101',
      role: 'systems_admin',
      department: 'it',
      is_active: true,
      email_verified: true,
      popi_consent: true,
      password_expires_at: passwordExpiry,
      last_password_change: new Date(),
    },
    {
      email: 'tshepo@infinitylegal.org',
      password: tshepoPasswordHash,
      full_name: 'Tshepo Rametsi',
      phone: '+27 11 555 0102',
      role: 'attorney',
      department: 'litigation',
      practice_number: 'NP/2021/0042',
      bar_admission_date: new Date('2015-03-20'),
      specialization: JSON.stringify(['labour_law', 'family_law', 'civil_litigation']),
      hourly_rate: 850,
      bio: 'Legal advisor specialising in labour law and family law with extensive CCMA experience.',
      is_active: true,
      email_verified: true,
      popi_consent: true,
      password_expires_at: passwordExpiry,
      last_password_change: new Date(),
    },
  ];

  const createdStaff: Record<string, string> = {};
  for (const userData of staffUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existing) {
      // Update password hash to bcrypt format
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: passwordHash,
          popi_consent: true,
          email_verified: true,
        },
      });
      createdStaff[userData.email] = existing.id;
      console.log(`✏️  Updated user: ${userData.email} (bcrypt password)`);
    } else {
      const user = await prisma.user.create({ data: userData });
      createdStaff[userData.email] = user.id;
      console.log(`✅ Created user: ${userData.full_name} (${userData.role})`);
    }
  }

  // ─── Create Client Users + Client Profiles ───
  const attorneyId = createdStaff['tshepo@infinitylegal.org'];

  const clientData = [
    {
      user: {
        email: 'thabo@example.com',
        password: clientPasswordHash,
        full_name: 'Thabo Molefe',
        phone: '+27 82 123 4567',
        role: 'client',
        id_number: '8501015800089',
        email_verified: true,
        popi_consent: true,
        password_expires_at: passwordExpiry,
        last_password_change: new Date(),
      },
      client: {
        contract_number: 'INF-202501-00001',
        id_number: '8501015800089',
        subscription_status: 'active',
        membership_number: 'IL-M001',
        membership_card_issued: true,
        employer: 'Sasol Limited',
        occupation: 'Chemical Engineer',
        annual_income: 650000,
        tags: JSON.stringify(['vip', 'corporate']),
      },
      planSlug: 'labour_legal_plan',
      case: {
        case_ref: 'IL-2025-L001',
        case_number: 'CCMA/JHB/2025/0234',
        title: 'Unfair Dismissal - Sasol Ltd',
        description: 'Client was dismissed without proper procedure after 8 years of service. CCMA referral for unfair dismissal.',
        case_type: 'labour',
        urgency: 'high',
        status: 'active',
        opposing_party: 'Sasol Limited',
        court_name: 'CCMA Johannesburg',
        jurisdiction: 'Gauteng',
        estimated_value: 520000,
        is_high_risk: true,
        tags: JSON.stringify(['ccma', 'urgent']),
      },
    },
    {
      user: {
        email: 'sarah@example.com',
        password: clientPasswordHash,
        full_name: 'Sarah Naidoo',
        phone: '+27 73 987 6543',
        role: 'client',
        id_number: '9205020080067',
        email_verified: true,
        popi_consent: true,
        password_expires_at: passwordExpiry,
        last_password_change: new Date(),
      },
      client: {
        contract_number: 'INF-202501-00002',
        id_number: '9205020080067',
        subscription_status: 'active',
        membership_number: 'IL-M002',
        membership_card_issued: true,
        employer: 'Self-employed',
        occupation: 'Restaurant Owner',
        annual_income: 420000,
        tags: JSON.stringify(['small-business']),
      },
      planSlug: 'civil_legal_plan',
      case: {
        case_ref: 'IL-2025-C001',
        case_number: 'GJ/2025/5678',
        title: 'Commercial Lease Dispute - Sandton City',
        description: 'Landlord attempting to increase lease by 40% without proper notice. Seeking interdict and lease review.',
        case_type: 'civil',
        urgency: 'medium',
        status: 'review',
        opposing_party: 'Sandton City Properties (Pty) Ltd',
        court_name: 'Gauteng High Court',
        jurisdiction: 'Gauteng',
        estimated_value: 180000,
        is_high_risk: false,
        tags: JSON.stringify(['commercial', 'lease']),
      },
    },
  ];

  const createdClientIds: string[] = [];

  for (const cd of clientData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: cd.user.email },
    });

    if (existingUser) {
      // Update password to bcrypt
      await prisma.user.update({
        where: { email: cd.user.email },
        data: {
          password: clientPasswordHash,
          popi_consent: true,
          email_verified: true,
        },
      });
      const existingClient = await prisma.client.findUnique({
        where: { user_id: existingUser.id },
      });
      if (existingClient) {
        createdClientIds.push(existingClient.id);
      }
      console.log(`✏️  Updated client: ${cd.user.email} (bcrypt password)`);
      continue;
    }

    // Find the plan
    const plan = await prisma.pricingPlan.findUnique({
      where: { slug: cd.planSlug },
    });
    if (!plan) {
      console.log(`⚠️  Plan "${cd.planSlug}" not found, skipping client ${cd.user.email}`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({ data: cd.user });

    // Create client profile
    const client = await prisma.client.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        ...cd.client,
      },
    });

    createdClientIds.push(client.id);

    // Create case
    const caseData = {
      ...cd.case,
      client_id: client.id,
      attorney_id: attorneyId,
    };
    await prisma.case.create({ data: caseData });

    // Create subscription
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.userSubscription.create({
      data: {
        client_id: client.id,
        plan_id: plan.id,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      },
    });

    console.log(`✅ Created client: ${cd.user.full_name} with case & subscription`);
  }

  // ─── Create POPIA consent log for each user ───
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    const existingConsent = await prisma.consentLog.findFirst({
      where: { user_id: user.id, consent_type: 'popi_act' },
    });
    if (!existingConsent) {
      await prisma.consentLog.create({
        data: {
          user_id: user.id,
          consent_type: 'popi_act',
          granted: true,
          ip_address: '127.0.0.1',
          version: '1.0',
        },
      });
    }
  }
  console.log('✅ Created POPIA consent logs');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   ┌──────────────────────────────────────────────────────┐');
  console.log('   │  Managing Director:  tidimalo@infinitylegal.org         │');
  console.log('   │  Co-Director (IT):  brian@infinitylegal.org            │');
  console.log('   │  Legal Advisor:     tshepo@infinitylegal.org           │');
  console.log('   │  Client:             thabo@example.com               │');
  console.log('   │  Client:             sarah@example.com               │');
  console.log('   │  Password (MD):      Tidimalo@2025!                  │');
  console.log('   │  Password (Co-Dir):  Brian@2025!                     │');
  console.log('   │  Password (Legal):   Tshepo@2025!                    │');
  console.log('   │  Password (clients): Client@2025!                    │');
  console.log('   └──────────────────────────────────────────────────────┘');
  console.log('\n⚠️  Change passwords after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
