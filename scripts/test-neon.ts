/**
 * Direct Prisma Client test against Neon Postgres.
 * Bypasses the CLI validation issue and tests the actual runtime path.
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const t0 = Date.now();
  console.log('[1] Instantiating PrismaClient with DATABASE_URL from .env...');
  const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });

  try {
    console.log('[2] Connecting (this will cold-start Neon if idle)...');
    const tConnect = Date.now();
    await prisma.$connect();
    console.log(`    Connected in ${Date.now() - tConnect}ms`);

    console.log('[3] Counting User rows...');
    const tUser = Date.now();
    const userCount = await prisma.user.count();
    console.log(`    User count: ${userCount} (in ${Date.now() - tUser}ms)`);

    console.log('[4] Counting real (non-@example.com) users...');
    const realUsers = await prisma.user.count({
      where: { email: { not: { contains: '@example.com' } } },
    });
    console.log(`    Real users: ${realUsers}`);

    console.log('[5] Sampling 5 real users...');
    const sample = await prisma.user.findMany({
      where: { email: { not: { contains: '@example.com' } } },
      select: { id: true, email: true, full_name: true, role: true, created_at: true },
      take: 5,
    });
    console.log('    Sample:', JSON.stringify(sample, null, 2));

    console.log('[6] Counting all tables...');
    const tables = [
      'user', 'client', 'case', 'lead', 'document', 'task',
      'consultation', 'invoice', 'paymentRecord', 'auditLog',
      'consentLog', 'legalArticle', 'pricingPlan', 'notification',
    ];
    for (const t of tables) {
      try {
        const c = await (prisma as any)[t].count();
        console.log(`    ${t}: ${c}`);
      } catch (e: any) {
        console.log(`    ${t}: ERROR ${e.message.substring(0, 80)}`);
      }
    }

    console.log(`\n=== DONE in ${Date.now() - t0}ms total ===`);
  } catch (e: any) {
    console.error('FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
