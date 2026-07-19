/**
 * Remove all simulation / seeded demo data from the database.
 *
 * KEEPS:
 *   - Staff accounts (tidimalo@, brian@, tshepo@infinitylegal.org) — needed for login
 *   - PricingPlan rows (config, not demo data)
 *
 * REMOVES all transactional / demo data:
 *   - Demo client users (thabo@, sarah@, test-qc-*, qc-test-*)
 *   - All clients, cases, consultations, tasks, documents, leads, messages
 *   - All subscriptions, payments, communications, notifications
 *   - All audit logs, AI analyses, intake submissions, consent logs, OTP verifications
 *
 * Run with: bun run tsx prisma/clean-seeded-data.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const STAFF_EMAILS = [
  'tidimalo@infinitylegal.org',
  'brian@infinitylegal.org',
  'tshepo@infinitylegal.org',
];

async function main() {
  console.log('🧹 Cleaning simulation/seeded data...\n');

  // Tables in dependency-safe order (children before parents)
  const cleanOrder = [
    'AuditLog',
    'CommunicationLog',
    'Notification',
    'PaymentRecord',
    'UserSubscription',
    'ConsentLog',
    'OtpVerification',
    'AiAnalysis',
    'AiIntakeSession',
    'IntakeSubmission',
    'PrivilegedNote',
    'CaseTimeline',
    'Task',
    'Document',
    'Consultation',
    'Case',
    'Message',
    'Client',
    'EmailTemplate',
    'LegalArticle',
    'AdminSession',
  ];

  for (const table of cleanOrder) {
    const count = await (db as any)[table].deleteMany({});
    if (count.count > 0) console.log(`  ✓ ${table}: cleared ${count.count} rows`);
  }

  // Remove demo client users + QC test users, keep only staff
  const deletedUsers = await db.user.deleteMany({
    where: { email: { notIn: STAFF_EMAILS } },
  });
  console.log(`  ✓ User: cleared ${deletedUsers.count} demo/test users (kept ${STAFF_EMAILS.length} staff accounts)`);

  // Verify final state
  const remainingUsers = await db.user.count();
  const remainingPlans = await db.pricingPlan.count();
  const remainingCases = await db.case.count();
  const remainingClients = await db.client.count();

  console.log('\n✅ Clean complete. Final state:');
  console.log(`   Users: ${remainingUsers} (staff only)`);
  console.log(`   PricingPlans: ${remainingPlans} (config retained)`);
  console.log(`   Cases: ${remainingCases}`);
  console.log(`   Clients: ${remainingClients}`);
}

main()
  .catch((e) => { console.error('❌ Clean failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
