/**
 * Database seed script for Infinity Legal ZA
 * Creates only pricing plans - no mock staff users.
 * Staff accounts should be created via the admin panel or signup flow.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Infinity Legal ZA database (pricing plans only)...');

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

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 No mock users created. Sign up via the app to create your account.');
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
