/**
 * Infinity Legal ZA - Database Seed Script
 * Creates the initial admin user and pricing plans.
 * Run with: bunx prisma db seed
 *
 * Login credentials:
 *   Email: admin@infinitylegal.org
 *   Password: Infinity@2025!
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

  // ─── Create Admin User ───
  const adminEmail = 'admin@infinitylegal.org';
  const adminPassword = 'Infinity@2025!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⏭️  Admin user already exists, skipping...');
  } else {
    const hashedPassword = hashPassword(adminPassword);
    const passwordExpiry = new Date();
    passwordExpiry.setDate(passwordExpiry.getDate() + 90);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        full_name: 'System Administrator',
        role: 'managing_director',
        department: 'management',
        is_active: true,
        email_verified: true,
        password_expires_at: passwordExpiry,
        last_password_change: new Date(),
      },
    });

    await prisma.profile.create({
      data: {
        user_id: admin.id,
        email: admin.email,
        full_name: admin.full_name || '',
        role: admin.role,
        department: admin.department,
        is_active: true,
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     Managing Director\n`);
  }

  // ─── Create Pricing Plans ───
  const plans = [
    {
      name: 'Civil Legal Plan',
      slug: 'civil-legal',
      price_monthly: 99,
      price_annual: 999,
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
      is_active: true,
      sort_order: 1,
    },
    {
      name: 'Labour Legal Plan',
      slug: 'labour-legal',
      price_monthly: 99,
      price_annual: 999,
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
      is_active: true,
      sort_order: 2,
    },
    {
      name: 'Extensive Cover Plan',
      slug: 'extensive-cover',
      price_monthly: 139,
      price_annual: 1399,
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
      console.log(`✅ Created plan: ${plan.name}`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   ┌─────────────────────────────────────────┐');
  console.log('   │  Email:    admin@infinitylegal.org       │');
  console.log('   │  Password: Infinity@2025!                │');
  console.log('   └─────────────────────────────────────────┘');
  console.log('\n⚠️  Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
