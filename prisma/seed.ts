/**
 * Infinity Legal ZA - Database Seed Script
 * Run with: bun run prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SALT_LENGTH = 32;
function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const hash = createHmac('sha512', salt).update(password).digest('hex');
  return `${salt}:${hash}`;
}
function getPasswordExpiryDate(fromDate: Date = new Date()): Date {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + 90);
  return expiry;
}

async function main() {
  console.log('🌱 Seeding Infinity Legal ZA database...\n');

  // =============================================
  // 1. Create Users
  // =============================================
  console.log('👤 Creating users...');
  
  const users = [
    { email: 'md@infinitylegal.co.za', full_name: 'Thabo Molefe', role: 'managing_director' as const, department: 'management' as const, phone: '+27821234567', bar_number: 'LPC/2020/001' },
    { email: 'partner@infinitylegal.co.za', full_name: 'Nomsa Dlamini', role: 'senior_partner' as const, department: 'management' as const, phone: '+27821234568', bar_number: 'LPC/2019/002' },
    { email: 'associate@infinitylegal.co.za', full_name: 'Sipho Nkosi', role: 'associate' as const, department: 'litigation' as const, phone: '+27821234569', bar_number: 'LPC/2022/003' },
    { email: 'paralegal@infinitylegal.co.za', full_name: 'Lindiwe Mthembu', role: 'paralegal' as const, department: 'family_law' as const, phone: '+27821234570' },
    { email: 'officer@infinitylegal.co.za', full_name: 'Bongani Khumalo', role: 'legal_officer' as const, department: 'litigation' as const, phone: '+27821234571', bar_number: 'LPC/2021/004' },
    { email: 'admin@infinitylegal.co.za', full_name: 'Tech Admin', role: 'systems_admin' as const, department: 'it' as const, phone: '+27821234572' },
    { email: 'consultant@infinitylegal.co.za', full_name: 'Zanele Mokoena', role: 'senior_consultant' as const, department: 'consulting' as const, phone: '+27821234573' },
    { email: 'client1@example.co.za', full_name: 'John Citizen', role: 'client' as const, phone: '+27831112233' },
    { email: 'client2@example.co.za', full_name: 'Mary Smith', role: 'client' as const, phone: '+27832223344' },
    { email: 'client3@example.co.za', full_name: 'David Ndlovu', role: 'client' as const, phone: '+27833334455' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const password = hashPassword('Password123!');
    const user = await db.user.create({
      data: {
        email: u.email,
        password,
        full_name: u.full_name,
        role: u.role,
        department: u.department,
        phone: u.phone,
        bar_number: u.bar_number || null,
        is_active: true,
        email_verified: u.role !== 'client',
        password_expires_at: getPasswordExpiryDate(),
        last_password_change: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`  ✅ Created: ${u.full_name} (${u.role})`);
  }

  // =============================================
  // 2. Create Profiles
  // =============================================
  console.log('\n📋 Creating profiles...');
  for (const user of createdUsers) {
    await db.profile.create({
      data: {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name || '',
        role: user.role,
        department: user.department,
        phone: user.phone,
        is_active: user.is_active,
      },
    });
  }

  // =============================================
  // 3. Create Cases
  // =============================================
  console.log('\n📁 Creating cases...');
  const clients = createdUsers.filter(u => u.role === 'client');
  const attorneys = createdUsers.filter(u => ['associate', 'legal_officer'].includes(u.role));
  
  const caseTypes = ['family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning'];
  const caseStatuses = ['intake', 'pending_review', 'active', 'on_hold', 'settled', 'closed'];
  const urgencies = ['low', 'medium', 'high', 'critical'];
  const caseTitles = [
    'Divorce Proceedings - Molefe v Molefe',
    'Criminal Defence - State v Ndlovu',
    'Property Transfer - Sandton Unit',
    'Will & Estate - Smith Family Trust',
    'Labour Dispute - Worker Compensation',
    'Child Custody - Mthembu Guardianship',
    'Commercial Contract Breach - ABC Ltd',
    'Debt Collection - R250,000 Claim',
    'Immigration Appeal - Work Permit',
    'Personal Injury - Motor Vehicle Accident',
    'Conveyancing - Camps Bay Property',
    'Family Law - Maintenance Application',
    'Civil Claim - Insurance Dispute',
    'Criminal - DUI Defence',
    'Corporate - Company Registration',
  ];

  for (let i = 0; i < caseTitles.length; i++) {
    const client = clients[i % clients.length];
    const attorney = attorneys[i % attorneys.length];
    const status = caseStatuses[i % caseStatuses.length] as any;
    
    await db.case.create({
      data: {
        matter_number: `IL-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        title: caseTitles[i],
        description: `Case description for ${caseTitles[i]}. This involves detailed legal proceedings and requires careful attention to South African law.`,
        case_type: caseTypes[i % caseTypes.length] as any,
        urgency: urgencies[i % urgencies.length] as any,
        status,
        client_id: client.id,
        lead_attorney_id: attorney.id,
        support_paralegal_id: createdUsers.find(u => u.role === 'paralegal')?.id,
        court_date: status === 'active' ? new Date(Date.now() + 30 * 86400000) : null,
        filing_date: status !== 'intake' ? new Date() : null,
        estimated_value: [50000, 150000, 500000, 1200000, 250000, 75000, 300000, 250000, 45000, 180000][i % 10],
        is_high_risk: i === 1 || i === 5,
      },
    });
  }
  console.log(`  ✅ Created ${caseTitles.length} cases`);

  // =============================================
  // 4. Create Leads
  // =============================================
  console.log('\n🎯 Creating leads...');
  const leadNames = [
    'Sarah Johnson', 'Michael Brown', 'Priya Naidoo', 'Ahmed Ismail', 'Lisa van der Merwe',
    'Kgosi Mabuza', 'Fatima Patel', 'Johan Botha', 'Thandiwe Zwane', 'Chris Willemse',
  ];
  const leadSources = ['website', 'referral', 'walk_in', 'social_media', 'advertisement'];
  const leadStatuses = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost'];

  for (let i = 0; i < leadNames.length; i++) {
    await db.lead.create({
      data: {
        name: leadNames[i],
        email: `${leadNames[i].toLowerCase().replace(/\s/g, '.')}@email.co.za`,
        phone: `+278${String(4 + i).padStart(1, '0')}${String(100000 + i * 11111).substring(0, 7)}`,
        source: leadSources[i % leadSources.length] as any,
        status: leadStatuses[i % leadStatuses.length] as any,
        case_type: caseTypes[i % caseTypes.length] as any,
        description: `Lead inquiry about ${caseTypes[i % caseTypes.length].replace(/_/g, ' ')} matter`,
        lead_score: Math.floor(Math.random() * 100),
        estimated_value: Math.floor(Math.random() * 500000) + 10000,
        first_contact_date: new Date(Date.now() - i * 86400000 * 3),
        sla_deadline: new Date(Date.now() + (7 - i) * 86400000),
        assigned_paralegal_id: createdUsers.find(u => u.role === 'paralegal')?.id,
      },
    });
  }
  console.log(`  ✅ Created ${leadNames.length} leads`);

  // =============================================
  // 5. Create Pricing Plans
  // =============================================
  console.log('\n💰 Creating pricing plans...');
  const plans = [
    { name: 'Civil Legal Plan', slug: 'civil-legal', price_monthly: 99, price_annual: 990, currency: 'ZAR', features: JSON.stringify(['Contract disputes', 'Consumer rights complaints', 'Property & conveyancing advisory', 'Debt collection assistance', 'Defamation claims', 'Personal income tax advice']), max_cases: -1, max_documents: -1, is_active: true, sort_order: 1 },
    { name: 'Labour Legal Plan', slug: 'labour-legal', price_monthly: 99, price_annual: 990, currency: 'ZAR', features: JSON.stringify(['Unfair dismissal disputes', 'CCMA representation & arbitration', 'Workplace discrimination claims', 'Employment contract reviews', 'Disciplinary hearing assistance', 'Personal income tax advice']), max_cases: -1, max_documents: -1, is_active: true, sort_order: 2 },
    { name: 'Extensive Plan', slug: 'extensive', price_monthly: 139, price_annual: 1390, currency: 'ZAR', features: JSON.stringify(['All Civil + Labour matters', 'Criminal matters & bail applications', 'Traffic offence defence', 'Domestic violence protection orders', 'Tax advice + submission services', 'Personal income tax advice AND submission services', 'Antenuptial contract drafting, lodgement, execution']), max_cases: -1, max_documents: -1, is_active: true, sort_order: 3 },
  ];

  for (const plan of plans) {
    await db.pricingPlan.create({ data: plan });
  }
  console.log('  ✅ Created 3 pricing plans');

  // =============================================
  // 6. Create Notifications
  // =============================================
  console.log('\n🔔 Creating notifications...');
  const notificationTypes = ['case_update', 'task_assigned', 'document_review', 'deadline', 'system', 'consultation'];
  for (const user of createdUsers.slice(0, 5)) {
    for (let i = 0; i < 5; i++) {
      await db.notification.create({
        data: {
          user_id: user.id,
          type: notificationTypes[i % notificationTypes.length] as any,
          title: ['New Case Assigned', 'Document Review Required', 'Court Date Reminder', 'System Update', 'Consultation Confirmed'][i],
          message: ['You have been assigned a new case.', 'Please review the attached document.', 'Court date is in 3 days.', 'System maintenance scheduled.', 'Your consultation has been confirmed.'][i],
          is_read: i > 2,
          related_id: `ref-${i}`,
        },
      });
    }
  }
  console.log('  ✅ Created notifications');

  // =============================================
  // 7. Create Tasks
  // =============================================
  console.log('\n✅ Creating tasks...');
  const firstCase = await db.case.findFirst();
  if (firstCase) {
    const taskTitles = ['Review case documents', 'Prepare court filing', 'Schedule client meeting', 'Draft settlement proposal', 'Research case law', 'File motion with court', 'Update client on progress', 'Coordinate with opposing counsel'];
    for (let i = 0; i < taskTitles.length; i++) {
      await db.task.create({
        data: {
          title: taskTitles[i],
          description: `Task details: ${taskTitles[i]}`,
          case_id: firstCase.id,
          assigned_to: attorneys[i % attorneys.length].id,
          created_by: createdUsers[0].id,
          priority: (['low', 'medium', 'high', 'urgent'] as const)[i % 4],
          status: (['pending', 'in_progress', 'completed'] as const)[i % 3],
          due_date: new Date(Date.now() + (i + 1) * 86400000),
        },
      });
    }
  }
  console.log('  ✅ Created tasks');

  // =============================================
  // 8. Create Audit Logs
  // =============================================
  console.log('\n📝 Creating audit logs...');
  const auditActions = ['LOGIN', 'VIEW_CASE', 'CREATE_CASE', 'UPDATE_CASE', 'UPLOAD_DOCUMENT', 'USER_SIGNUP'];
  for (let i = 0; i < 20; i++) {
    await db.auditLog.create({
      data: {
        user_id: createdUsers[i % createdUsers.length].id,
        action: auditActions[i % auditActions.length],
        resource_type: ['case', 'document', 'user', 'lead'][i % 4],
        resource_id: `res-${i}`,
        details: JSON.stringify({ index: i }),
        ip_address: `192.168.1.${i + 1}`,
      },
    });
  }
  console.log('  ✅ Created audit logs');

  // =============================================
  // 9. Create Attorneys
  // =============================================
  console.log('\n⚖️ Creating attorney profiles...');
  const attorneyUsers = createdUsers.filter(u => ['associate', 'legal_officer', 'senior_partner'].includes(u.role));
  for (const au of attorneyUsers) {
    await db.attorney.create({
      data: {
        user_id: au.id,
        lpc_number: au.bar_number || `LPC/2024/${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        firm_name: 'Infinity Legal (Pty) Ltd',
        specializations: JSON.stringify(['family_law', 'civil_litigation'].slice(0, 1 + Math.floor(Math.random() * 3))),
        years_experience: 5 + Math.floor(Math.random() * 20),
        is_verified: true,
        hourly_rate: 800 + Math.floor(Math.random() * 1200),
        bio: `Experienced ${au.role.replace(/_/g, ' ')} specializing in South African law.`,
        availability_status: 'available',
      },
    });
  }
  console.log('  ✅ Created attorney profiles');

  console.log('\n🎉 Database seeding complete!');
  console.log(`\n📊 Summary:`);
  console.log(`  Users: ${createdUsers.length}`);
  console.log(`  Cases: ${caseTitles.length}`);
  console.log(`  Leads: ${leadNames.length}`);
  console.log(`  Plans: 3`);
  console.log(`\n🔑 Demo Login Credentials:`);
  console.log(`  Managing Director: md@infinitylegal.co.za / Password123!`);
  console.log(`  Associate: associate@infinitylegal.co.za / Password123!`);
  console.log(`  Client: client1@example.co.za / Password123!`);
  console.log(`  Systems Admin: admin@infinitylegal.co.za / Password123!`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
