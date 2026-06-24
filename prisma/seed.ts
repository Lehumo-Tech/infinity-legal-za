/**
 * Infinity Legal ZA - Database Seed Script
 * Creates initial pricing plans, staff users, and sample clients with cases.
 * Run with: bun run db:seed
 *
 * Login credentials:
 *   Managing Director: md@infinitylegal.org / Infinity@2025!
 *   Systems Admin:     admin@infinitylegal.org / Infinity@2025!
 *   Attorney:          attorney@infinitylegal.org / Infinity@2025!
 *   Client:            thabo@example.com / Client@2025!
 *   Client:            sarah@example.com / Client@2025!
 */

import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = createHmac('sha512', salt).update(password).digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding Infinity Legal ZA database...\n');

  // ─── Create Pricing Plans ───
  const plans = [
    {
      name: 'Civil Legal Plan',
      slug: 'civil-legal',
      description: 'Cover for civil litigation, conveyancing, and corporate matters',
      price_monthly: 99,
      price_annual: 999,
      currency: 'ZAR',
      features: JSON.stringify([
        'Civil litigation management',
        'Conveyancing support',
        'Corporate & commercial matters',
        'Document management (up to 50)',
        'Up to 10 active cases',
        'Email support',
        'POPIA compliance tools',
      ]),
      max_cases: 10,
      max_documents: 50,
      is_popular: false,
      is_active: true,
      sort_order: 1,
    },
    {
      name: 'Labour Legal Plan',
      slug: 'labour-legal',
      description: 'Cover for labour law, CCMA processes, and workplace disputes',
      price_monthly: 99,
      price_annual: 999,
      currency: 'ZAR',
      features: JSON.stringify([
        'Labour law & CCMA processes',
        'Unfair dismissal representation',
        'Workplace dispute resolution',
        'Document management (up to 50)',
        'Up to 10 active cases',
        'Email support',
        'POPIA compliance tools',
      ]),
      max_cases: 10,
      max_documents: 50,
      is_popular: false,
      is_active: true,
      sort_order: 2,
    },
    {
      name: 'Extensive Cover Plan',
      slug: 'extensive-cover',
      description: 'Comprehensive cover across all practice areas with priority support',
      price_monthly: 139,
      price_annual: 1399,
      currency: 'ZAR',
      features: JSON.stringify([
        'All practice areas covered',
        'Family law, criminal defence & civil litigation',
        'Conveyancing, estate planning & corporate',
        'Unlimited document management',
        'Up to 50 active cases',
        'Priority support',
        'AI legal assistant access',
        'POPIA compliance tools',
        'Dedicated attorney assignment',
      ]),
      max_cases: 50,
      max_documents: 999,
      is_popular: true,
      is_active: true,
      sort_order: 3,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.pricingPlan.findUnique({
      where: { slug: plan.slug },
    });
    if (existing) {
      console.log(`⏭️  Plan "${plan.name}" already exists, skipping...`);
    } else {
      await prisma.pricingPlan.create({ data: plan });
      console.log(`✅ Created plan: ${plan.name} (R${plan.price_monthly}/mo)`);
    }
  }

  // ─── Create Staff Users ───
  const passwordHash = hashPassword('Infinity@2025!');
  const clientPasswordHash = hashPassword('Client@2025!');
  const passwordExpiry = new Date();
  passwordExpiry.setDate(passwordExpiry.getDate() + 90);

  const staffUsers = [
    {
      email: 'md@infinitylegal.org',
      password: passwordHash,
      full_name: 'Nomsa Dlamini',
      phone: '+27 11 555 0100',
      role: 'managing_director',
      department: 'management',
      practice_number: 'NP/2019/0001',
      bar_admission_date: new Date('2010-06-15'),
      specialization: JSON.stringify(['corporate_commercial', 'civil_litigation']),
      is_active: true,
      email_verified: true,
      password_expires_at: passwordExpiry,
      last_password_change: new Date(),
    },
    {
      email: 'admin@infinitylegal.org',
      password: passwordHash,
      full_name: 'Pieter van der Merwe',
      phone: '+27 11 555 0101',
      role: 'systems_admin',
      department: 'it',
      is_active: true,
      email_verified: true,
      password_expires_at: passwordExpiry,
      last_password_change: new Date(),
    },
    {
      email: 'attorney@infinitylegal.org',
      password: passwordHash,
      full_name: 'Thandi Mokoena',
      phone: '+27 11 555 0102',
      role: 'attorney',
      department: 'litigation',
      practice_number: 'NP/2021/0042',
      bar_admission_date: new Date('2015-03-20'),
      specialization: JSON.stringify(['labour_law', 'family_law', 'civil_litigation']),
      hourly_rate: 850,
      bio: 'Specialist in labour law and family law with 10 years of experience in CCMA proceedings and divorce matters.',
      is_active: true,
      email_verified: true,
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
      console.log(`⏭️  User "${userData.email}" already exists, skipping...`);
      createdStaff[userData.email] = existing.id;
    } else {
      const user = await prisma.user.create({ data: userData });
      createdStaff[userData.email] = user.id;
      console.log(`✅ Created user: ${userData.full_name} (${userData.role})`);
    }
  }

  // ─── Create Client Users + Client Profiles ───
  const attorneyId = createdStaff['attorney@infinitylegal.org'];

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
        password_expires_at: passwordExpiry,
        last_password_change: new Date(),
      },
      client: {
        contract_number: 'IL-2025-C001',
        id_number: '8501015800089',
        subscription_status: 'active',
        membership_number: 'IL-M001',
        membership_card_issued: true,
        employer: 'Sasol Limited',
        occupation: 'Chemical Engineer',
        annual_income: 650000,
        tags: JSON.stringify(['vip', 'corporate']),
      },
      planSlug: 'labour-legal',
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
        password_expires_at: passwordExpiry,
        last_password_change: new Date(),
      },
      client: {
        contract_number: 'IL-2025-C002',
        id_number: '9205020080067',
        subscription_status: 'active',
        membership_number: 'IL-M002',
        membership_card_issued: true,
        employer: 'Self-employed',
        occupation: 'Restaurant Owner',
        annual_income: 420000,
        tags: JSON.stringify(['small-business']),
      },
      planSlug: 'civil-legal',
      case: {
        case_ref: 'IL-2025-C002',
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
      console.log(`⏭️  Client "${cd.user.email}" already exists, skipping...`);
      const existingClient = await prisma.client.findUnique({
        where: { user_id: existingUser.id },
      });
      if (existingClient) {
        createdClientIds.push(existingClient.id);
      }
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
  console.log('   │  Managing Director:  md@infinitylegal.org            │');
  console.log('   │  Systems Admin:      admin@infinitylegal.org         │');
  console.log('   │  Attorney:           attorney@infinitylegal.org      │');
  console.log('   │  Client:             thabo@example.com               │');
  console.log('   │  Client:             sarah@example.com               │');
  console.log('   │  Password (staff):   Infinity@2025!                  │');
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
