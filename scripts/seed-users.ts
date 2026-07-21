/**
 * Infinity Legal ZA - Seed Missing Users
 * Task 2-a: Add 7 missing users with bcrypt-hashed passwords and set supervisor_id
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const BCRYPT_ROUNDS = 10;

interface NewUser {
  email: string;
  role: string;
  department: string | null;
  full_name: string;
}

const NEW_USERS: NewUser[] = [
  { email: 'hr@infinitylegal.co.za', role: 'hr_manager', department: 'hr', full_name: 'Precious Ndlovu' },
  { email: 'finance@infinitylegal.co.za', role: 'finance_manager', department: 'finance', full_name: 'David van Wyk' },
  { email: 'receptionist@infinitylegal.co.za', role: 'receptionist', department: 'administration', full_name: 'Amina Ebrahim' },
  { email: 'supervisor@infinitylegal.co.za', role: 'supervising_officer', department: 'management', full_name: 'Kagiso Patel' },
  { email: 'candidate@infinitylegal.co.za', role: 'candidate_attorney', department: 'litigation', full_name: 'Naledi Botha' },
  { email: 'officeadmin@infinitylegal.co.za', role: 'office_administrator', department: 'administration', full_name: 'Farhana Desai' },
  { email: 'client@infinitylegal.co.za', role: 'client', department: null, full_name: 'Johan Smith' },
];

async function main() {
  console.log('=== Seeding Missing Users ===\n');

  // Hash the password once for all users
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  console.log(`Generated bcrypt hash: ${passwordHash.substring(0, 20)}...`);

  // Get existing reference users for supervisor assignments
  const mdUser = await prisma.user.findUnique({ where: { email: 'md@infinitylegal.co.za' } });
  const partnerUser = await prisma.user.findUnique({ where: { email: 'partner@infinitylegal.co.za' } });
  const officerUser = await prisma.user.findUnique({ where: { email: 'officer@infinitylegal.co.za' } });

  if (!mdUser || !partnerUser || !officerUser) {
    throw new Error('Required reference users not found (md, partner, or officer)');
  }

  // Build a map of all users (existing + new) for supervisor assignments
  const allUsersMap: Record<string, string> = {}; // email -> id mapping

  // Pre-populate with existing users
  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const eu of existingUsers) {
    allUsersMap[eu.email] = eu.id;
  }

  for (const userData of NEW_USERS) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      console.log(`  SKIP: ${userData.email} already exists (id: ${existing.id})`);
      allUsersMap[userData.email] = existing.id;
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: passwordHash,
        full_name: userData.full_name,
        role: userData.role as any,
        department: userData.department as any,
        is_active: true,
        email_verified: true,
        last_password_change: new Date(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });

    // Also create a Profile record
    await prisma.profile.create({
      data: {
        user_id: user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role as any,
        department: userData.department as any,
        is_active: true,
      },
    });

    allUsersMap[userData.email] = user.id;
    console.log(`  CREATED: ${userData.email} (${userData.role}) - id: ${user.id}`);
  }

  // ============================================
  // Set supervisor_id assignments
  // ============================================
  console.log('\n=== Setting Supervisor Assignments ===\n');

  // Supervisor mapping:
  // - supervising_officer -> senior_partner
  // - paralegal -> supervising_officer
  // - candidate_attorney -> legal_officer
  // - All other staff -> managing_director
  // - client/guest -> no supervisor

  const supervisorAssignments: Array<{ email: string; supervisorEmail: string; reason: string }> = [
    // supervising_officer reports to senior_partner
    { email: 'supervisor@infinitylegal.co.za', supervisorEmail: 'partner@infinitylegal.co.za', reason: 'Supervising Officer reports to Senior Partner' },
    // paralegals report to supervising_officer
    { email: 'paralegal@infinitylegal.co.za', supervisorEmail: 'supervisor@infinitylegal.co.za', reason: 'Paralegal reports to Supervising Officer' },
    // candidate attorneys report to legal_officer
    { email: 'candidate@infinitylegal.co.za', supervisorEmail: 'officer@infinitylegal.co.za', reason: 'Candidate Attorney reports to Legal Officer' },
    // All other staff report to managing_director
    { email: 'hr@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'HR Manager reports to Managing Director' },
    { email: 'finance@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Finance Manager reports to Managing Director' },
    { email: 'receptionist@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Receptionist reports to Managing Director' },
    { email: 'officeadmin@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Office Administrator reports to Managing Director' },
    { email: 'associate@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Associate reports to Managing Director' },
    { email: 'officer@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Legal Officer reports to Managing Director' },
    { email: 'consultant@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Senior Consultant reports to Managing Director' },
    { email: 'admin@infinitylegal.co.za', supervisorEmail: 'md@infinitylegal.co.za', reason: 'Systems Admin reports to Managing Director' },
  ];

  for (const assignment of supervisorAssignments) {
    const userId = allUsersMap[assignment.email];
    const supervisorId = allUsersMap[assignment.supervisorEmail];

    if (!userId || !supervisorId) {
      console.log(`  SKIP: ${assignment.email} or ${assignment.supervisorEmail} not found`);
      continue;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { supervisor_id: supervisorId },
    });

    console.log(`  SET: ${assignment.email} -> supervised by ${assignment.supervisorEmail} (${assignment.reason})`);
  }

  // ============================================
  // Verify - list all users
  // ============================================
  console.log('\n=== Verification: All Users ===\n');

  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      full_name: true,
      role: true,
      department: true,
      supervisor_id: true,
      is_active: true,
      supervisor: { select: { email: true } },
    },
    orderBy: { role: 'asc' },
  });

  console.log(`${'Email'.padEnd(40)} ${'Full Name'.padEnd(20)} ${'Role'.padEnd(25)} ${'Department'.padEnd(15)} ${'Supervisor'.padEnd(35)} Active`);
  console.log('-'.repeat(145));

  for (const u of allUsers) {
    const supervisorStr = u.supervisor?.email || 'none';
    console.log(
      `${u.email.padEnd(40)} ${(u.full_name || '-').padEnd(20)} ${u.role.padEnd(25)} ${(u.department || '-').padEnd(15)} ${supervisorStr.padEnd(35)} ${u.is_active}`
    );
  }

  console.log(`\nTotal users: ${allUsers.length}`);
  console.log('\n=== Seed Complete ===');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
