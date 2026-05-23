/**
 * Database seed script for Infinity Legal ZA
 * Run with: npx prisma db seed
 * Or manually: bun run prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Use the same hashing as the auth library
function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = createHmac('sha512', salt)
    .update(password)
    .digest('hex');
  return `${salt}:${hash}`;
}

const PASSWORD = hashPassword('Password123!');

async function main() {
  console.log('🌱 Seeding Infinity Legal ZA database...');

  // ─── Pricing Plans ────────────────────────────────
  console.log('  Creating pricing plans...');
  
  const civilPlan = await prisma.pricingPlan.upsert({
    where: { slug: 'civil-legal-plan' },
    update: {},
    create: {
      name: 'Civil Legal Plan',
      slug: 'civil-legal-plan',
      price_monthly: 99,
      price_annual: 999,
      currency: 'ZAR',
      features: JSON.stringify([
        'Contract disputes',
        'Consumer rights complaints',
        'Property & conveyancing advisory',
        'Debt collection assistance',
        'Defamation claims',
        '★ Personal income tax advice',
      ]),
      max_cases: 5,
      max_documents: 25,
      is_active: true,
      sort_order: 1,
    },
  });

  const labourPlan = await prisma.pricingPlan.upsert({
    where: { slug: 'labour-legal-plan' },
    update: {},
    create: {
      name: 'Labour Legal Plan',
      slug: 'labour-legal-plan',
      price_monthly: 99,
      price_annual: 999,
      currency: 'ZAR',
      features: JSON.stringify([
        'Unfair dismissal disputes',
        'CCMA representation & arbitration',
        'Workplace discrimination claims',
        'Employment contract reviews',
        'Disciplinary hearing assistance',
        '★ Personal income tax advice',
      ]),
      max_cases: 5,
      max_documents: 25,
      is_active: true,
      sort_order: 2,
    },
  });

  const extensivePlan = await prisma.pricingPlan.upsert({
    where: { slug: 'extensive-plan' },
    update: {},
    create: {
      name: 'Extensive Plan',
      slug: 'extensive-plan',
      price_monthly: 139,
      price_annual: 1399,
      currency: 'ZAR',
      features: JSON.stringify([
        'All Civil + Labour matters',
        'Criminal matters & bail applications',
        'Traffic offence defence',
        'Domestic violence protection orders',
        'Tax advice + submission services',
        '★ Personal income tax advice AND submission services',
        '★ Antenuptial contract drafting, lodgement, execution',
      ]),
      max_cases: 15,
      max_documents: 100,
      is_active: true,
      sort_order: 3,
    },
  });

  console.log(`  ✓ ${3} pricing plans created`);

  // ─── Staff Users ──────────────────────────────────
  console.log('  Creating staff users...');

  const staffUsers = [
    { email: 'admin@infinitylegal.co.za', full_name: 'Thabo Mokoena', role: 'managing_director' as const, department: 'management' as const },
    { email: 'senior@infinitylegal.co.za', full_name: 'Nomsa Dlamini', role: 'senior_partner' as const, department: 'litigation' as const },
    { email: 'associate@infinitylegal.co.za', full_name: 'Pieter van der Merwe', role: 'associate' as const, department: 'litigation' as const },
    { email: 'paralegal@infinitylegal.co.za', full_name: 'Lerato Moloi', role: 'paralegal' as const, department: 'conveyancing' as const },
    { email: 'hr@infinitylegal.co.za', full_name: 'Fatima Patel', role: 'hr_manager' as const, department: 'hr' as const },
    { email: 'finance@infinitylegal.co.za', full_name: 'Johan Botha', role: 'finance_manager' as const, department: 'finance' as const },
    { email: 'reception@infinitylegal.co.za', full_name: 'Zanele Nkosi', role: 'receptionist' as const, department: 'administration' as const },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: PASSWORD,
        full_name: u.full_name,
        role: u.role,
        department: u.department,
        is_active: true,
        email_verified: true,
        last_password_change: new Date(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`  ✓ ${staffUsers.length} staff users created (password: Password123!)`);

  // ─── Attorney Profiles ────────────────────────────
  console.log('  Creating attorney profiles...');

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@infinitylegal.co.za' } });
  const seniorUser = await prisma.user.findUnique({ where: { email: 'senior@infinitylegal.co.za' } });
  const associateUser = await prisma.user.findUnique({ where: { email: 'associate@infinitylegal.co.za' } });

  if (adminUser) {
    await prisma.attorney.upsert({
      where: { user_id: adminUser.id },
      update: {},
      create: {
        user_id: adminUser.id,
        lpc_number: 'LPC-2024-0001',
        firm_name: 'Infinity Legal (Pty) Ltd',
        specializations: JSON.stringify(['Family Law', 'Corporate Commercial', 'Estate Planning']),
        years_experience: 22,
        is_verified: true,
        hourly_rate: 2500,
        availability_status: 'available',
      },
    });
  }

  if (seniorUser) {
    await prisma.attorney.upsert({
      where: { user_id: seniorUser.id },
      update: {},
      create: {
        user_id: seniorUser.id,
        lpc_number: 'LPC-2024-0002',
        firm_name: 'Infinity Legal (Pty) Ltd',
        specializations: JSON.stringify(['Civil Litigation', 'Labour Law']),
        years_experience: 18,
        is_verified: true,
        hourly_rate: 2200,
        availability_status: 'available',
      },
    });
  }

  if (associateUser) {
    await prisma.attorney.upsert({
      where: { user_id: associateUser.id },
      update: {},
      create: {
        user_id: associateUser.id,
        lpc_number: 'LPC-2024-0003',
        firm_name: 'Infinity Legal (Pty) Ltd',
        specializations: JSON.stringify(['Criminal Defence', 'Civil Litigation']),
        years_experience: 6,
        is_verified: true,
        hourly_rate: 1800,
        availability_status: 'available',
      },
    });
  }

  console.log('  ✓ Attorney profiles created');

  // ─── Sample Backup Record ─────────────────────────
  console.log('  Creating backup record...');
  
  await prisma.backupRecord.create({
    data: {
      filename: `backup-${new Date().toISOString().split('T')[0]}.db`,
      size_bytes: 1024000,
      backup_type: 'scheduled',
      status: 'completed',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
    },
  });

  console.log('  ✓ Backup record created');

  // ─── Firm Settings ────────────────────────────────
  console.log('  Creating firm settings...');
  
  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   admin@infinitylegal.co.za    / Password123!  (Managing Director)');
  console.log('   senior@infinitylegal.co.za   / Password123!  (Senior Partner)');
  console.log('   associate@infinitylegal.co.za / Password123! (Associate)');
  console.log('   paralegal@infinitylegal.co.za / Password123! (Paralegal)');
  console.log('   hr@infinitylegal.co.za       / Password123!  (HR Manager)');
  console.log('   finance@infinitylegal.co.za  / Password123!  (Finance Manager)');
  console.log('   reception@infinitylegal.co.za / Password123! (Receptionist)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
