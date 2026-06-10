/**
 * Infinity Legal ZA - Comprehensive Seed Data Script
 * Task 3: Populate database with realistic sample data
 *
 * Creates: Cases, Leads, Tasks, Documents, Consultations, Notifications, Case Timelines
 * Uses South African names, context, and ZAR currency
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// USER EMAIL MAP (will be populated from DB)
// ============================================
const userIds: Record<string, string> = {};

// Staff emails (attorneys, paralegals, officers)
const STAFF_EMAILS = [
  'md@infinitylegal.co.za',
  'partner@infinitylegal.co.za',
  'associate@infinitylegal.co.za',
  'paralegal@infinitylegal.co.za',
  'officer@infinitylegal.co.za',
  'supervisor@infinitylegal.co.za',
  'candidate@infinitylegal.co.za',
  'consultant@infinitylegal.co.za',
];

// Client emails
const CLIENT_EMAILS = [
  'client@infinitylegal.co.za',
  'client1@example.co.za',
  'client2@example.co.za',
  'client3@example.co.za',
];

// Attorney emails (those who can be lead_attorney)
const ATTORNEY_EMAILS = [
  'md@infinitylegal.co.za',
  'partner@infinitylegal.co.za',
  'associate@infinitylegal.co.za',
  'officer@infinitylegal.co.za',
  'supervisor@infinitylegal.co.za',
  'candidate@infinitylegal.co.za',
  'consultant@infinitylegal.co.za',
];

// Paralegal emails
const PARALEGAL_EMAILS = [
  'paralegal@infinitylegal.co.za',
  'candidate@infinitylegal.co.za',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ============================================
// DATA DEFINITIONS
// ============================================

interface CaseData {
  matter_number: string;
  title: string;
  description: string;
  case_type: string;
  urgency: string;
  status: string;
  client_email: string;
  lead_attorney_email: string;
  support_paralegal_email: string;
  court_date: Date | null;
  filing_date: Date | null;
  estimated_value: number;
  is_high_risk: boolean;
  next_action: string;
  next_action_date: Date | null;
}

const CASES_DATA: CaseData[] = [
  {
    matter_number: 'IL-2026-0001',
    title: 'Van der Berg v Van der Berg - Divorce Settlement',
    description: 'Contested divorce proceedings involving division of marital estate including residential property in Sandton and joint business interests. Two minor children involved. Opposing party contesting custody arrangement.',
    case_type: 'family_law',
    urgency: 'high',
    status: 'active',
    client_email: 'client@infinitylegal.co.za',
    lead_attorney_email: 'partner@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: daysFromNow(14),
    filing_date: daysAgo(45),
    estimated_value: 2800000,
    is_high_risk: true,
    next_action: 'File supplementary affidavit on custody',
    next_action_date: daysFromNow(3),
  },
  {
    matter_number: 'IL-2026-0002',
    title: 'State v Mahlangu - Fraud Charges',
    description: 'Criminal defence for fraud charges amounting to R1.5M. Client accused of misrepresentation in property development scheme. Multiple counts of fraud under POCA.',
    case_type: 'criminal_defence',
    urgency: 'critical',
    status: 'active',
    client_email: 'client1@example.co.za',
    lead_attorney_email: 'md@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: daysFromNow(7),
    filing_date: daysAgo(60),
    estimated_value: 1500000,
    is_high_risk: true,
    next_action: 'Prepare bail application supplementary documents',
    next_action_date: daysFromNow(1),
  },
  {
    matter_number: 'IL-2026-0003',
    title: 'Nkosi v Johannesburg Metro - Unlawful Eviction',
    description: 'Civil litigation against Johannesburg Metropolitan Municipality for unlawful eviction from property in Hillbrow. Client seeks damages and reinstatement of occupation. PIE Act applicable.',
    case_type: 'civil_litigation',
    urgency: 'high',
    status: 'active',
    client_email: 'client2@example.co.za',
    lead_attorney_email: 'associate@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: daysFromNow(21),
    filing_date: daysAgo(30),
    estimated_value: 450000,
    is_high_risk: false,
    next_action: 'Serve notice of intention to defend',
    next_action_date: daysFromNow(2),
  },
  {
    matter_number: 'IL-2026-0004',
    title: 'Transfer: 14 Bishops Avenue, Bishopscourt',
    description: 'Conveyancing matter for the transfer of residential property in Bishopscourt, Cape Town. Purchase price R4.2M. All bond documentation submitted to Standard Bank.',
    case_type: 'conveyancing',
    urgency: 'medium',
    status: 'active',
    client_email: 'client3@example.co.za',
    lead_attorney_email: 'associate@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(14),
    estimated_value: 4200000,
    is_high_risk: false,
    next_action: 'Follow up on rates clearance certificate',
    next_action_date: daysFromNow(5),
  },
  {
    matter_number: 'IL-2026-0005',
    title: 'Estate Late: A. Govender - Deceased Estate',
    description: 'Administration of deceased estate for Abraham Govender. Estate includes residential property in Chatsworth, vehicle, and investment accounts. Multiple beneficiaries to be identified and verified.',
    case_type: 'estate_planning',
    urgency: 'medium',
    status: 'active',
    client_email: 'client1@example.co.za',
    lead_attorney_email: 'consultant@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(90),
    estimated_value: 1850000,
    is_high_risk: false,
    next_action: 'Submit liquidation and distribution account to Master',
    next_action_date: daysFromNow(10),
  },
  {
    matter_number: 'IL-2026-0006',
    title: 'Mokoena Tech (Pty) Ltd v DataServe SA - Breach of Contract',
    description: 'Corporate dispute regarding breach of software development agreement. Client claims R2.8M in damages for non-delivery of agreed milestones. Opposing party filed counterclaim.',
    case_type: 'corporate_commercial',
    urgency: 'high',
    status: 'active',
    client_email: 'client@infinitylegal.co.za',
    lead_attorney_email: 'partner@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: daysFromNow(28),
    filing_date: daysAgo(20),
    estimated_value: 2800000,
    is_high_risk: true,
    next_action: 'Draft discovery affidavit',
    next_action_date: daysFromNow(7),
  },
  {
    matter_number: 'IL-2026-0007',
    title: 'Debt Collection: ABC Suppliers v Thembeka Traders',
    description: 'Debt collection proceedings for outstanding invoice amount of R385,000. Multiple demands ignored. Proceeding with combined summons in the Magistrates Court.',
    case_type: 'debt_collection',
    urgency: 'low',
    status: 'active',
    client_email: 'client2@example.co.za',
    lead_attorney_email: 'officer@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(10),
    estimated_value: 385000,
    is_high_risk: false,
    next_action: 'File combined summons',
    next_action_date: daysFromNow(4),
  },
  {
    matter_number: 'IL-2026-0008',
    title: 'Pillay v Eskom Holdings - Unfair Dismissal',
    description: 'Labour matter: Client dismissed after 12 years of service. Alleging procedural and substantive unfairness. CCMA referral pending. LRA section 191 application.',
    case_type: 'labour_law',
    urgency: 'medium',
    status: 'pending_review',
    client_email: 'client3@example.co.za',
    lead_attorney_email: 'associate@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: null,
    filing_date: null,
    estimated_value: 620000,
    is_high_risk: false,
    next_action: 'Prepare CCMA referral documentation',
    next_action_date: daysFromNow(6),
  },
  {
    matter_number: 'IL-2026-0009',
    title: 'Dube v Gauteng Dept of Roads - MVA Claim',
    description: 'Personal injury claim arising from motor vehicle accident on N1 highway near Midrand. Client sustained serious orthopaedic injuries. RAF claim to be instituted alternatively common law claim against Roads Department.',
    case_type: 'personal_injury',
    urgency: 'high',
    status: 'active',
    client_email: 'client1@example.co.za',
    lead_attorney_email: 'md@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(5),
    estimated_value: 950000,
    is_high_risk: false,
    next_action: 'Obtain updated medical report from orthopaedic specialist',
    next_action_date: daysFromNow(12),
  },
  {
    matter_number: 'IL-2026-0010',
    title: 'Mothibi v Mothibi - Child Custody Variation',
    description: 'Application for variation of existing custody order. Client seeking primary residence of two minor children. Current order granted in 2023. Material change in circumstances alleged.',
    case_type: 'family_law',
    urgency: 'medium',
    status: 'intake',
    client_email: 'client2@example.co.za',
    lead_attorney_email: 'partner@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: null,
    estimated_value: 180000,
    is_high_risk: false,
    next_action: 'Schedule initial consultation with client',
    next_action_date: daysFromNow(2),
  },
  {
    matter_number: 'IL-2026-0011',
    title: 'State v Khoza - DUI and Reckless Driving',
    description: 'Criminal defence for DUI and reckless driving charges. Client stopped at roadblock in Pretoria. Breathalyser reading 0.95mg/l. Second offence. Potential license suspension.',
    case_type: 'criminal_defence',
    urgency: 'medium',
    status: 'active',
    client_email: 'client3@example.co.za',
    lead_attorney_email: 'officer@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: daysFromNow(10),
    filing_date: daysAgo(21),
    estimated_value: 50000,
    is_high_risk: false,
    next_action: 'Obtain blood test results from forensic lab',
    next_action_date: daysFromNow(8),
  },
  {
    matter_number: 'IL-2026-0012',
    title: 'Transfer: Unit 502, The MARC, Sandton',
    description: 'Sectional title transfer for apartment in Sandton Central. Purchase price R1.9M. Bond with FNB. Sectional title register to be updated.',
    case_type: 'conveyancing',
    urgency: 'low',
    status: 'settled',
    client_email: 'client@infinitylegal.co.za',
    lead_attorney_email: 'associate@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(60),
    estimated_value: 1900000,
    is_high_risk: false,
    next_action: 'Arrange registration at Deeds Office',
    next_action_date: daysFromNow(14),
  },
  {
    matter_number: 'IL-2026-0013',
    title: 'Zwide Holdings v Multi-Sure Insurance - Claim Repudiation',
    description: 'Civil litigation for repudiation of business interruption insurance claim following load-shedding damage to industrial equipment. Claim amount R3.2M. Policy interpretation dispute.',
    case_type: 'civil_litigation',
    urgency: 'high',
    status: 'on_hold',
    client_email: 'client2@example.co.za',
    lead_attorney_email: 'partner@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(75),
    estimated_value: 3200000,
    is_high_risk: true,
    next_action: 'Await expert actuarial report on business interruption calculation',
    next_action_date: daysFromNow(21),
  },
  {
    matter_number: 'IL-2026-0014',
    title: 'Estate Late: B. Mkhize - Will Dispute',
    description: 'Contested will matter. Beneficiary disputing validity of last will and testament on grounds of lack of testamentary capacity. Estate value approximately R5.5M.',
    case_type: 'estate_planning',
    urgency: 'high',
    status: 'active',
    client_email: 'client3@example.co.za',
    lead_attorney_email: 'consultant@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: daysFromNow(35),
    filing_date: daysAgo(40),
    estimated_value: 5500000,
    is_high_risk: true,
    next_action: 'Draft application for removal of executor',
    next_action_date: daysFromNow(9),
  },
  {
    matter_number: 'IL-2026-0015',
    title: 'Cele v Sun City Resort - Slip and Fall Injury',
    description: 'Personal injury claim for injuries sustained from slip and fall at resort. Client suffered fractured hip. Negligence in maintenance of walkway alleged.',
    case_type: 'personal_injury',
    urgency: 'low',
    status: 'intake',
    client_email: 'client1@example.co.za',
    lead_attorney_email: 'associate@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: null,
    estimated_value: 320000,
    is_high_risk: false,
    next_action: 'Obtain incident report from resort management',
    next_action_date: daysFromNow(7),
  },
  {
    matter_number: 'IL-2026-0016',
    title: 'Naidoo v Pick n Pay - Unfair Labour Practice',
    description: 'Labour dispute: Client demoted without due process after 8 years as store manager. Alleging unfair labour practice and occupational detriment under Protected Disclosures Act.',
    case_type: 'labour_law',
    urgency: 'medium',
    status: 'active',
    client_email: 'client2@example.co.za',
    lead_attorney_email: 'officer@infinitylegal.co.za',
    support_paralegal_email: 'candidate@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(15),
    estimated_value: 480000,
    is_high_risk: false,
    next_action: 'File statement of case at CCMA',
    next_action_date: daysFromNow(5),
  },
  {
    matter_number: 'IL-2026-0017',
    title: 'TechVentures SA (Pty) Ltd - Shareholder Agreement',
    description: 'Corporate commercial matter: Drafting and negotiating shareholder agreement for new tech startup with three founding shareholders. Share split 51/29/20. Vesting schedule to be included.',
    case_type: 'corporate_commercial',
    urgency: 'low',
    status: 'active',
    client_email: 'client@infinitylegal.co.za',
    lead_attorney_email: 'consultant@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(7),
    estimated_value: 750000,
    is_high_risk: false,
    next_action: 'Finalise draft shareholder agreement for client review',
    next_action_date: daysFromNow(3),
  },
  {
    matter_number: 'IL-2026-0018',
    title: 'Debt Collection: BuildRight v Khumalo Construction',
    description: 'Debt collection for outstanding construction materials supplied. Amount R178,500. Debtor has acknowledged debt but failed to make payment arrangements.',
    case_type: 'debt_collection',
    urgency: 'medium',
    status: 'closed',
    client_email: 'client3@example.co.za',
    lead_attorney_email: 'officer@infinitylegal.co.za',
    support_paralegal_email: 'paralegal@infinitylegal.co.za',
    court_date: null,
    filing_date: daysAgo(120),
    estimated_value: 178500,
    is_high_risk: false,
    next_action: 'Confirm payment received and close file',
    next_action_date: null,
  },
];

interface LeadData {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  case_type: string;
  description: string;
  assigned_paralegal_email: string;
  assigned_officer_email: string;
  lead_score: number;
  qualification_notes: string;
  estimated_value: number;
  first_contact_date: Date;
  sla_deadline: Date;
}

const LEADS_DATA: LeadData[] = [
  {
    name: 'Bongani Mthembu',
    email: 'bongani.mthembu@gmail.com',
    phone: '+27 82 345 6789',
    source: 'website',
    status: 'new',
    case_type: 'family_law',
    description: 'Seeking divorce attorney. Married in community of property. No children.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 65,
    qualification_notes: 'Initial inquiry received via website contact form. Needs follow-up call.',
    estimated_value: 120000,
    first_contact_date: daysAgo(1),
    sla_deadline: daysFromNow(1),
  },
  {
    name: 'Lerato Khumalo',
    email: 'lerato.k@yahoo.co.za',
    phone: '+27 73 456 7890',
    source: 'referral',
    status: 'contacted',
    case_type: 'criminal_defence',
    description: 'Referred by existing client. Facing theft charges at the Magistrates Court.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 78,
    qualification_notes: 'Referred by Johan Smith. Spoke briefly on phone. Needs in-person consultation.',
    estimated_value: 85000,
    first_contact_date: daysAgo(3),
    sla_deadline: daysFromNow(4),
  },
  {
    name: 'Henri du Plessis',
    email: 'henri.dp@outlook.com',
    phone: '+27 61 234 5678',
    source: 'walk_in',
    status: 'qualified',
    case_type: 'corporate_commercial',
    description: 'Walk-in enquiry regarding company registration and BEE compliance for new logistics venture.',
    assigned_paralegal_email: 'candidate@infinitylegal.co.za',
    assigned_officer_email: 'officer@infinitylegal.co.za',
    lead_score: 82,
    qualification_notes: 'Well-funded startup. Needs comprehensive corporate structuring. High potential value.',
    estimated_value: 350000,
    first_contact_date: daysAgo(5),
    sla_deadline: daysFromNow(2),
  },
  {
    name: 'Fatima Moolla',
    email: 'fatima.moolla@webmail.co.za',
    phone: '+27 84 567 8901',
    source: 'social_media',
    status: 'consultation_scheduled',
    case_type: 'estate_planning',
    description: 'Found us on LinkedIn. Wants to draft a will and set up a family trust for her properties.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 88,
    qualification_notes: 'Owns three rental properties. Wants comprehensive estate planning. Consultation scheduled.',
    estimated_value: 250000,
    first_contact_date: daysAgo(7),
    sla_deadline: daysFromNow(3),
  },
  {
    name: 'Sibusiso Ndaba',
    email: 'sibusiso.n@corporate.co.za',
    phone: '+27 79 890 1234',
    source: 'referral',
    status: 'retained',
    case_type: 'labour_law',
    description: 'Referred by accountant. Wrongful dismissal from mining company after 15 years service.',
    assigned_paralegal_email: 'candidate@infinitylegal.co.za',
    assigned_officer_email: 'officer@infinitylegal.co.za',
    lead_score: 92,
    qualification_notes: 'Strong case. Client has documentation of procedural failures. Retainer agreement signed.',
    estimated_value: 580000,
    first_contact_date: daysAgo(14),
    sla_deadline: daysAgo(1),
  },
  {
    name: 'Annette Bothma',
    email: 'annette.bothma@telkomsa.net',
    phone: '+27 82 901 2345',
    source: 'website',
    status: 'contacted',
    case_type: 'personal_injury',
    description: 'Injured in taxi accident on R59. Looking for attorney to handle RAF claim.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 70,
    qualification_notes: 'Case appears viable. Needs medical records review. Follow-up scheduled.',
    estimated_value: 420000,
    first_contact_date: daysAgo(4),
    sla_deadline: daysFromNow(3),
  },
  {
    name: 'Jaco Prinsloo',
    email: 'jaco.p@builders.co.za',
    phone: '+27 66 012 3456',
    source: 'advertisement',
    status: 'new',
    case_type: 'debt_collection',
    description: 'Saw our ad in the local newspaper. Has multiple debtors owing total of R450K.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 55,
    qualification_notes: 'Awaiting initial contact. Multiple debtors may require separate proceedings.',
    estimated_value: 450000,
    first_contact_date: daysAgo(0),
    sla_deadline: daysFromNow(2),
  },
  {
    name: 'Priya Reddy',
    email: 'priya.reddy@gmail.com',
    phone: '+27 83 123 4567',
    source: 'social_media',
    status: 'qualified',
    case_type: 'civil_litigation',
    description: 'Facebook enquiry. Dispute with body corporate over special levy assessment. Amount in dispute R95,000.',
    assigned_paralegal_email: 'candidate@infinitylegal.co.za',
    assigned_officer_email: 'officer@infinitylegal.co.za',
    lead_score: 60,
    qualification_notes: 'Sectional title dispute. Client has correspondence history. Needs formal letter of demand.',
    estimated_value: 95000,
    first_contact_date: daysAgo(6),
    sla_deadline: daysFromNow(4),
  },
  {
    name: 'Tshepo Moleleki',
    email: 'tshepo.m@mining.co.za',
    phone: '+27 71 234 5678',
    source: 'referral',
    status: 'consultation_scheduled',
    case_type: 'labour_law',
    description: 'Referred by union representative. Occupational health and safety complaint leading to constructive dismissal.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 85,
    qualification_notes: 'Strong case with documented safety violations. Union backing. Consultation set for next week.',
    estimated_value: 720000,
    first_contact_date: daysAgo(10),
    sla_deadline: daysFromNow(5),
  },
  {
    name: 'Carel van Niekerk',
    email: 'carel.vn@farmmail.co.za',
    phone: '+27 65 345 6789',
    source: 'walk_in',
    status: 'lost',
    case_type: 'conveyancing',
    description: 'Walk-in asking about farm transfer in Limpopo. Decided to use local conveyancer closer to property.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 40,
    qualification_notes: 'Lost to geographic preference. Client opted for Limpopo-based firm. No further action.',
    estimated_value: 85000,
    first_contact_date: daysAgo(21),
    sla_deadline: daysAgo(14),
  },
  {
    name: 'Zandile Mthethwa',
    email: 'zandile.m@educate.co.za',
    phone: '+27 76 456 7890',
    source: 'website',
    status: 'qualified',
    case_type: 'family_law',
    description: 'Website enquiry regarding domestic violence interdict and maintenance application.',
    assigned_paralegal_email: 'candidate@infinitylegal.co.za',
    assigned_officer_email: 'officer@infinitylegal.co.za',
    lead_score: 75,
    qualification_notes: 'Urgent matter. Client needs protection order. Has documented evidence of abuse.',
    estimated_value: 65000,
    first_contact_date: daysAgo(2),
    sla_deadline: daysFromNow(1),
  },
  {
    name: 'Rikus Engelbrecht',
    email: 'rikus.e@itfirm.co.za',
    phone: '+27 82 567 8901',
    source: 'cold_call',
    status: 'contacted',
    case_type: 'corporate_commercial',
    description: 'Contacted during outreach campaign. IT company needing shareholder dispute resolution.',
    assigned_paralegal_email: 'paralegal@infinitylegal.co.za',
    assigned_officer_email: 'supervisor@infinitylegal.co.za',
    lead_score: 50,
    qualification_notes: 'Initial interest shown. Needs more information about our corporate dispute resolution services.',
    estimated_value: 180000,
    first_contact_date: daysAgo(8),
    sla_deadline: daysFromNow(6),
  },
];

interface TaskData {
  title: string;
  description: string;
  case_matter_number: string | null;
  assigned_to_email: string;
  created_by_email: string;
  priority: string;
  status: string;
  due_date: Date | null;
  completed_date: Date | null;
}

const TASKS_DATA: TaskData[] = [
  {
    title: 'File supplementary custody affidavit',
    description: 'Draft and file supplementary affidavit regarding custody arrangements for Van der Berg matter. Include social worker report as annexure.',
    case_matter_number: 'IL-2026-0001',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'partner@infinitylegal.co.za',
    priority: 'urgent',
    status: 'in_progress',
    due_date: daysFromNow(3),
    completed_date: null,
  },
  {
    title: 'Prepare bail application documents',
    description: 'Assemble all supporting documents for bail application including surety affidavits and character references.',
    case_matter_number: 'IL-2026-0002',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'urgent',
    status: 'pending',
    due_date: daysFromNow(1),
    completed_date: null,
  },
  {
    title: 'Serve notice of intention to defend',
    description: 'Serve notice on Johannesburg Metro legal department. Confirm receipt and obtain proof of service.',
    case_matter_number: 'IL-2026-0003',
    assigned_to_email: 'candidate@infinitylegal.co.za',
    created_by_email: 'associate@infinitylegal.co.za',
    priority: 'high',
    status: 'pending',
    due_date: daysFromNow(2),
    completed_date: null,
  },
  {
    title: 'Follow up on rates clearance certificate',
    description: 'Contact City of Cape Town for outstanding rates clearance certificate for Bishopscourt transfer.',
    case_matter_number: 'IL-2026-0004',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'associate@infinitylegal.co.za',
    priority: 'medium',
    status: 'in_progress',
    due_date: daysFromNow(5),
    completed_date: null,
  },
  {
    title: 'Submit L&D account to Master',
    description: 'Prepare and submit liquidation and distribution account for Govender deceased estate to the Master of the High Court.',
    case_matter_number: 'IL-2026-0005',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'consultant@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(10),
    completed_date: null,
  },
  {
    title: 'Draft discovery affidavit',
    description: 'Prepare discovery affidavit listing all relevant documents for Mokoena Tech v DataServe matter. Coordinate with client for document collection.',
    case_matter_number: 'IL-2026-0006',
    assigned_to_email: 'candidate@infinitylegal.co.za',
    created_by_email: 'partner@infinitylegal.co.za',
    priority: 'high',
    status: 'pending',
    due_date: daysFromNow(7),
    completed_date: null,
  },
  {
    title: 'File combined summons',
    description: 'Prepare and file combined summons at Johannesburg Magistrates Court for ABC Suppliers debt matter.',
    case_matter_number: 'IL-2026-0007',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'officer@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(4),
    completed_date: null,
  },
  {
    title: 'Prepare CCMA referral documentation',
    description: 'Complete CCMA referral forms (LRA Form 7.11) for Pillay v Eskom matter. Include supporting affidavit.',
    case_matter_number: 'IL-2026-0008',
    assigned_to_email: 'candidate@infinitylegal.co.za',
    created_by_email: 'associate@infinitylegal.co.za',
    priority: 'medium',
    status: 'in_progress',
    due_date: daysFromNow(6),
    completed_date: null,
  },
  {
    title: 'Obtain updated medical report',
    description: 'Contact Dr. Naidoo at Netcare Unitas Hospital for updated orthopaedic assessment report on Dube MVA matter.',
    case_matter_number: 'IL-2026-0009',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'high',
    status: 'pending',
    due_date: daysFromNow(12),
    completed_date: null,
  },
  {
    title: 'Review monthly billing reports',
    description: 'Review and reconcile all matter billing for February 2026. Flag any matters below minimum fee threshold.',
    case_matter_number: null,
    assigned_to_email: 'finance@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'low',
    status: 'completed',
    due_date: daysAgo(2),
    completed_date: daysAgo(3),
  },
  {
    title: 'Update office security protocols',
    description: 'Review and update the office access control policy following the recent POPIA audit findings.',
    case_matter_number: null,
    assigned_to_email: 'officeadmin@infinitylegal.co.za',
    created_by_email: 'admin@infinitylegal.co.za',
    priority: 'medium',
    status: 'completed',
    due_date: daysAgo(5),
    completed_date: daysAgo(6),
  },
  {
    title: 'Organise candidate attorney Practical Legal Training',
    description: 'Register Naledi Botha for the LSSA Practical Legal Training course starting next month. Arrange study leave.',
    case_matter_number: null,
    assigned_to_email: 'hr@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'low',
    status: 'in_progress',
    due_date: daysFromNow(14),
    completed_date: null,
  },
  {
    title: 'File court application for executor removal',
    description: 'Draft and file application for removal of executor in Mkhize estate matter. Include supporting affidavits from beneficiaries.',
    case_matter_number: 'IL-2026-0014',
    assigned_to_email: 'candidate@infinitylegal.co.za',
    created_by_email: 'consultant@infinitylegal.co.za',
    priority: 'high',
    status: 'pending',
    due_date: daysFromNow(9),
    completed_date: null,
  },
  {
    title: 'Obtain blood test results from forensic lab',
    description: 'Follow up with SAPS forensic laboratory for blood alcohol analysis results in Khoza DUI matter.',
    case_matter_number: 'IL-2026-0011',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'officer@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(8),
    completed_date: null,
  },
  {
    title: 'File statement of case at CCMA',
    description: 'Prepare and file detailed statement of case for Naidoo v Pick n Pay labour dispute. Include all supporting documentation.',
    case_matter_number: 'IL-2026-0016',
    assigned_to_email: 'candidate@infinitylegal.co.za',
    created_by_email: 'officer@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(5),
    completed_date: null,
  },
  {
    title: 'Finalise shareholder agreement draft',
    description: 'Complete the draft shareholder agreement for TechVentures SA including vesting schedule and restraint of trade clauses.',
    case_matter_number: 'IL-2026-0017',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'consultant@infinitylegal.co.za',
    priority: 'low',
    status: 'in_progress',
    due_date: daysFromNow(3),
    completed_date: null,
  },
  {
    title: 'Confirm payment and close debt matter',
    description: 'Confirm receipt of final payment from Khumalo Construction and prepare file closure memo.',
    case_matter_number: 'IL-2026-0018',
    assigned_to_email: 'officer@infinitylegal.co.za',
    created_by_email: 'officer@infinitylegal.co.za',
    priority: 'low',
    status: 'completed',
    due_date: daysAgo(10),
    completed_date: daysAgo(11),
  },
  {
    title: 'Schedule consultation with Mothibi client',
    description: 'Contact Mrs Mothibi to schedule initial consultation for child custody variation application.',
    case_matter_number: 'IL-2026-0010',
    assigned_to_email: 'receptionist@infinitylegal.co.za',
    created_by_email: 'partner@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(2),
    completed_date: null,
  },
  {
    title: 'Obtain resort incident report',
    description: 'Request formal incident report and CCTV footage from Sun City Resort for Cele slip and fall matter.',
    case_matter_number: 'IL-2026-0015',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'associate@infinitylegal.co.za',
    priority: 'low',
    status: 'pending',
    due_date: daysFromNow(7),
    completed_date: null,
  },
  {
    title: 'Prepare monthly management report',
    description: 'Compile monthly statistics: new matters opened, matters closed, revenue, WIP, and debtor days for MD review.',
    case_matter_number: null,
    assigned_to_email: 'finance@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'high',
    status: 'overdue',
    due_date: daysAgo(2),
    completed_date: null,
  },
  {
    title: 'Update case management system records',
    description: 'Ensure all case statuses and next actions are current in the system. Flag overdue items for attorney review.',
    case_matter_number: null,
    assigned_to_email: 'officeadmin@infinitylegal.co.za',
    created_by_email: 'admin@infinitylegal.co.za',
    priority: 'medium',
    status: 'overdue',
    due_date: daysAgo(1),
    completed_date: null,
  },
  {
    title: 'Follow up on actuarial report',
    description: 'Contact actuarial expert regarding outstanding business interruption report for Zwide Holdings insurance matter.',
    case_matter_number: 'IL-2026-0013',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'partner@infinitylegal.co.za',
    priority: 'high',
    status: 'overdue',
    due_date: daysAgo(3),
    completed_date: null,
  },
  {
    title: 'Arrange Deeds Office registration',
    description: 'Book registration slot at Deeds Office for MARC Sandton sectional title transfer.',
    case_matter_number: 'IL-2026-0012',
    assigned_to_email: 'paralegal@infinitylegal.co.za',
    created_by_email: 'associate@infinitylegal.co.za',
    priority: 'medium',
    status: 'pending',
    due_date: daysFromNow(14),
    completed_date: null,
  },
  {
    title: 'Backup and archive closed files',
    description: 'Archive all closed matter files older than 6 months to long-term storage. Update the filing index.',
    case_matter_number: null,
    assigned_to_email: 'officeadmin@infinitylegal.co.za',
    created_by_email: 'supervisor@infinitylegal.co.za',
    priority: 'low',
    status: 'pending',
    due_date: daysFromNow(21),
    completed_date: null,
  },
  {
    title: 'Prepare trust account audit documentation',
    description: 'Compile trust account records and reconciliation statements for the annual compliance audit by the Legal Practice Council.',
    case_matter_number: null,
    assigned_to_email: 'finance@infinitylegal.co.za',
    created_by_email: 'md@infinitylegal.co.za',
    priority: 'urgent',
    status: 'in_progress',
    due_date: daysFromNow(3),
    completed_date: null,
  },
];

interface DocumentData {
  title: string;
  case_matter_number: string;
  document_type: string;
  workflow_status: string;
  version: number;
  file_name: string;
  file_size: number;
  prepared_by_email: string;
  approved_by_email: string | null;
  signed_by_email: string | null;
  supervising_officer_email: string | null;
  description: string;
  is_locked: boolean;
}

const DOCUMENTS_DATA: DocumentData[] = [
  {
    title: 'Summons - Van der Berg Divorce',
    case_matter_number: 'IL-2026-0001',
    document_type: 'pleading',
    workflow_status: 'filed',
    version: 2,
    file_name: 'summons_vanderberg_v2.pdf',
    file_size: 245000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: 'partner@infinitylegal.co.za',
    signed_by_email: 'partner@infinitylegal.co.za',
    supervising_officer_email: 'supervisor@infinitylegal.co.za',
    description: 'Divorce summons and particulars of claim filed with the Johannesburg High Court.',
    is_locked: true,
  },
  {
    title: 'Bail Application - Mahlangu',
    case_matter_number: 'IL-2026-0002',
    document_type: 'court_filing',
    workflow_status: 'review',
    version: 1,
    file_name: 'bail_application_mahlangu.pdf',
    file_size: 189000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'supervisor@infinitylegal.co.za',
    description: 'Bail application with supporting affidavits for Mahlangu fraud case.',
    is_locked: false,
  },
  {
    title: 'Notice of Intention to Defend - Nkosi v JHB Metro',
    case_matter_number: 'IL-2026-0003',
    document_type: 'court_filing',
    workflow_status: 'draft',
    version: 1,
    file_name: 'notice_defend_nkosi.pdf',
    file_size: 45000,
    prepared_by_email: 'candidate@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'associate@infinitylegal.co.za',
    description: 'Notice of intention to defend in unlawful eviction matter.',
    is_locked: false,
  },
  {
    title: 'Property Transfer Agreement - Bishops Avenue',
    case_matter_number: 'IL-2026-0004',
    document_type: 'contract',
    workflow_status: 'signed',
    version: 3,
    file_name: 'transfer_agreement_bishops.pdf',
    file_size: 312000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: 'associate@infinitylegal.co.za',
    signed_by_email: 'associate@infinitylegal.co.za',
    supervising_officer_email: 'supervisor@infinitylegal.co.za',
    description: 'Property transfer agreement for 14 Bishops Avenue, Bishopscourt with all bond documentation.',
    is_locked: true,
  },
  {
    title: 'Liquidation & Distribution Account - Govender Estate',
    case_matter_number: 'IL-2026-0005',
    document_type: 'court_filing',
    workflow_status: 'draft',
    version: 1,
    file_name: 'ld_account_govender.pdf',
    file_size: 178000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'consultant@infinitylegal.co.za',
    description: 'Liquidation and distribution account for the estate late A. Govender.',
    is_locked: false,
  },
  {
    title: 'Legal Opinion - Mokoena Tech v DataServe',
    case_matter_number: 'IL-2026-0006',
    document_type: 'opinion',
    workflow_status: 'approved',
    version: 2,
    file_name: 'legal_opinion_mokoena_tech.pdf',
    file_size: 156000,
    prepared_by_email: 'partner@infinitylegal.co.za',
    approved_by_email: 'md@infinitylegal.co.za',
    signed_by_email: null,
    supervising_officer_email: null,
    description: 'Legal opinion on merits of breach of contract claim and counterclaim exposure.',
    is_locked: false,
  },
  {
    title: 'Combined Summons - ABC Suppliers',
    case_matter_number: 'IL-2026-0007',
    document_type: 'pleading',
    workflow_status: 'draft',
    version: 1,
    file_name: 'summons_abc_suppliers.pdf',
    file_size: 67000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'officer@infinitylegal.co.za',
    description: 'Combined summons for debt collection proceedings against Thembeka Traders.',
    is_locked: false,
  },
  {
    title: 'CCMA Referral - Pillay v Eskom',
    case_matter_number: 'IL-2026-0008',
    document_type: 'court_filing',
    workflow_status: 'draft',
    version: 1,
    file_name: 'ccma_referral_pillay.pdf',
    file_size: 89000,
    prepared_by_email: 'candidate@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'associate@infinitylegal.co.za',
    description: 'CCMA referral form and supporting affidavit for unfair dismissal claim.',
    is_locked: false,
  },
  {
    title: 'Client Affidavit - Dube MVA',
    case_matter_number: 'IL-2026-0009',
    document_type: 'affidavit',
    workflow_status: 'review',
    version: 1,
    file_name: 'affidavit_dube_mva.pdf',
    file_size: 94000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'md@infinitylegal.co.za',
    description: 'Client affidavit detailing accident circumstances and injuries for RAF claim.',
    is_locked: false,
  },
  {
    title: 'Internal Memo - Insurance Claim Strategy',
    case_matter_number: 'IL-2026-0013',
    document_type: 'memo',
    workflow_status: 'approved',
    version: 1,
    file_name: 'memo_insurance_strategy.pdf',
    file_size: 52000,
    prepared_by_email: 'partner@infinitylegal.co.za',
    approved_by_email: 'md@infinitylegal.co.za',
    signed_by_email: null,
    supervising_officer_email: null,
    description: 'Internal strategy memo on approach to Zwide Holdings insurance repudiation matter.',
    is_locked: false,
  },
  {
    title: 'Correspondence - Mkhize Will Dispute',
    case_matter_number: 'IL-2026-0014',
    document_type: 'correspondence',
    workflow_status: 'filed',
    version: 1,
    file_name: 'correspondence_mkhize_estate.pdf',
    file_size: 38000,
    prepared_by_email: 'candidate@infinitylegal.co.za',
    approved_by_email: 'consultant@infinitylegal.co.za',
    signed_by_email: null,
    supervising_officer_email: 'supervisor@infinitylegal.co.za',
    description: 'Letter to opposing attorney regarding will validity dispute and proposed way forward.',
    is_locked: true,
  },
  {
    title: 'Shareholder Agreement Draft - TechVentures',
    case_matter_number: 'IL-2026-0017',
    document_type: 'contract',
    workflow_status: 'review',
    version: 2,
    file_name: 'shareholder_agreement_techventures.pdf',
    file_size: 287000,
    prepared_by_email: 'paralegal@infinitylegal.co.za',
    approved_by_email: null,
    signed_by_email: null,
    supervising_officer_email: 'consultant@infinitylegal.co.za',
    description: 'Draft shareholder agreement with vesting schedule and restraint of trade provisions.',
    is_locked: false,
  },
  {
    title: 'Settlement Agreement - Khumalo Debt',
    case_matter_number: 'IL-2026-0018',
    document_type: 'consent_form',
    workflow_status: 'archived',
    version: 1,
    file_name: 'settlement_khumalo_construction.pdf',
    file_size: 41000,
    prepared_by_email: 'officer@infinitylegal.co.za',
    approved_by_email: 'partner@infinitylegal.co.za',
    signed_by_email: 'officer@infinitylegal.co.za',
    supervising_officer_email: 'supervisor@infinitylegal.co.za',
    description: 'Signed settlement agreement for debt collection matter. Payment received and file closed.',
    is_locked: true,
  },
];

interface ConsultationData {
  client_email: string;
  attorney_email: string;
  case_matter_number: string | null;
  scheduled_date: Date;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  notes: string;
  meeting_type: string;
}

const CONSULTATIONS_DATA: ConsultationData[] = [
  {
    client_email: 'client@infinitylegal.co.za',
    attorney_email: 'partner@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0001',
    scheduled_date: daysAgo(7),
    scheduled_time: '10:00',
    duration_minutes: 60,
    status: 'completed',
    notes: 'Discussed divorce proceedings and custody arrangements. Client instructed to file supplementary affidavit. Opposing party\'s attorney contacted regarding mediation.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client1@example.co.za',
    attorney_email: 'md@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0002',
    scheduled_date: daysAgo(3),
    scheduled_time: '14:00',
    duration_minutes: 90,
    status: 'completed',
    notes: 'Reviewed fraud charges and bail conditions. Discussed defence strategy. Client to provide additional financial records from business.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client2@example.co.za',
    attorney_email: 'associate@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0003',
    scheduled_date: daysFromNow(2),
    scheduled_time: '09:30',
    duration_minutes: 45,
    status: 'confirmed',
    notes: 'Follow-up on eviction case. To discuss progress on serving notice of intention to defend.',
    meeting_type: 'video_call',
  },
  {
    client_email: 'client3@example.co.za',
    attorney_email: 'associate@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0004',
    scheduled_date: daysFromNow(5),
    scheduled_time: '11:00',
    duration_minutes: 30,
    status: 'scheduled',
    notes: 'Progress update on Bishopscourt property transfer. Review rates clearance status.',
    meeting_type: 'phone_call',
  },
  {
    client_email: 'client1@example.co.za',
    attorney_email: 'consultant@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0005',
    scheduled_date: daysFromNow(8),
    scheduled_time: '15:00',
    duration_minutes: 60,
    status: 'scheduled',
    notes: 'Review of liquidation and distribution account before submission to Master.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client@infinitylegal.co.za',
    attorney_email: 'partner@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0006',
    scheduled_date: daysAgo(1),
    scheduled_time: '16:00',
    duration_minutes: 60,
    status: 'completed',
    notes: 'Discussed discovery process and document collection for breach of contract matter. Client to provide email correspondence and project documentation.',
    meeting_type: 'video_call',
  },
  {
    client_email: 'client3@example.co.za',
    attorney_email: 'consultant@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0014',
    scheduled_date: daysFromNow(4),
    scheduled_time: '10:30',
    duration_minutes: 90,
    status: 'confirmed',
    notes: 'Will dispute strategy session. Review grounds for executor removal application.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client2@example.co.za',
    attorney_email: 'officer@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0016',
    scheduled_date: daysFromNow(6),
    scheduled_time: '13:00',
    duration_minutes: 45,
    status: 'scheduled',
    notes: 'Consultation on CCMA proceedings for Naidoo v Pick n Pay matter. Prepare client for conciliation hearing.',
    meeting_type: 'video_call',
  },
  {
    client_email: 'client@infinitylegal.co.za',
    attorney_email: 'consultant@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0017',
    scheduled_date: daysFromNow(3),
    scheduled_time: '11:30',
    duration_minutes: 45,
    status: 'scheduled',
    notes: 'Review draft shareholder agreement for TechVentures. Discuss vesting and restraint terms.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client1@example.co.za',
    attorney_email: 'md@infinitylegal.co.za',
    case_matter_number: 'IL-2026-0009',
    scheduled_date: daysAgo(14),
    scheduled_time: '09:00',
    duration_minutes: 60,
    status: 'no_show',
    notes: 'Client did not attend scheduled consultation. Attempted to contact by phone - no answer. Follow-up required.',
    meeting_type: 'in_person',
  },
  {
    client_email: 'client3@example.co.za',
    attorney_email: 'officer@infinitylegal.co.za',
    case_matter_number: null,
    scheduled_date: daysAgo(10),
    scheduled_time: '14:30',
    duration_minutes: 30,
    status: 'cancelled',
    notes: 'Initial consultation cancelled by client. Client indicated they would reschedule but has not done so.',
    meeting_type: 'phone_call',
  },
];

interface NotificationData {
  user_email: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  related_id: string | null;
}

const NOTIFICATIONS_DATA: NotificationData[] = [
  {
    user_email: 'paralegal@infinitylegal.co.za',
    type: 'task_assigned',
    title: 'Urgent: Bail Application Documents Due Tomorrow',
    message: 'You have been assigned an urgent task to prepare bail application documents for the Mahlangu matter (IL-2026-0002). Due date is tomorrow.',
    is_read: false,
    link: '/cases/IL-2026-0002',
    related_id: null,
  },
  {
    user_email: 'partner@infinitylegal.co.za',
    type: 'case_update',
    title: 'Court Date Approaching - Van der Berg',
    message: 'The court date for Van der Berg divorce matter (IL-2026-0001) is in 14 days. Ensure all filings are up to date.',
    is_read: false,
    link: '/cases/IL-2026-0001',
    related_id: null,
  },
  {
    user_email: 'md@infinitylegal.co.za',
    type: 'deadline',
    title: 'Trust Account Audit Due in 3 Days',
    message: 'The annual Legal Practice Council trust account audit documentation is due in 3 days. Finance team is working on preparation.',
    is_read: true,
    link: null,
    related_id: null,
  },
  {
    user_email: 'finance@infinitylegal.co.za',
    type: 'system',
    title: 'Overdue: Monthly Management Report',
    message: 'The monthly management report is now 2 days overdue. Please prioritise completion and submit to the Managing Director.',
    is_read: false,
    link: null,
    related_id: null,
  },
  {
    user_email: 'candidate@infinitylegal.co.za',
    type: 'document_review',
    title: 'Document Awaiting Your Review',
    message: 'The Notice of Intention to Defend for Nkosi v JHB Metro (IL-2026-0003) is in draft and requires your review before filing.',
    is_read: false,
    link: '/cases/IL-2026-0003',
    related_id: null,
  },
  {
    user_email: 'associate@infinitylegal.co.za',
    type: 'consultation',
    title: 'Upcoming Video Consultation - Nkosi',
    message: 'You have a confirmed video call consultation with Nkosi regarding the eviction matter in 2 days at 09:30.',
    is_read: true,
    link: null,
    related_id: null,
  },
  {
    user_email: 'supervisor@infinitylegal.co.za',
    type: 'lead_assigned',
    title: 'New Lead Assigned - Bongani Mthembu',
    message: 'A new family law lead has been assigned to you. SLA deadline is tomorrow. Please make initial contact.',
    is_read: false,
    link: null,
    related_id: null,
  },
  {
    user_email: 'officeadmin@infinitylegal.co.za',
    type: 'task_assigned',
    title: 'Overdue: Update Case Management System',
    description: 'The case management system records update task is overdue by 1 day. Please complete urgently.',
    message: 'The case management system records update task is overdue by 1 day. Please complete urgently.',
    is_read: false,
    link: null,
    related_id: null,
  },
  {
    user_email: 'hr@infinitylegal.co.za',
    type: 'system',
    title: 'PLT Registration Reminder',
    message: 'Reminder: Candidate attorney Practical Legal Training registration should be completed within the next 14 days.',
    is_read: true,
    link: null,
    related_id: null,
  },
  {
    user_email: 'md@infinitylegal.co.za',
    type: 'message',
    title: 'Urgent: High-Risk Case Review Required',
    message: 'Three high-risk cases require your review: Van der Berg divorce, Mahlangu fraud, and Mokoena Tech breach. Combined estimated value exceeds R7M.',
    is_read: false,
    link: null,
    related_id: null,
  },
];

interface TimelineData {
  case_matter_number: string;
  user_email: string;
  action: string;
  description: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: Date;
}

const TIMELINE_DATA: TimelineData[] = [
  {
    case_matter_number: 'IL-2026-0001',
    user_email: 'partner@infinitylegal.co.za',
    action: 'status_change',
    description: 'Case status updated from pending_review to active',
    previous_value: 'pending_review',
    new_value: 'active',
    created_at: daysAgo(45),
  },
  {
    case_matter_number: 'IL-2026-0001',
    user_email: 'paralegal@infinitylegal.co.za',
    action: 'document_filed',
    description: 'Filed summons and particulars of claim with Johannesburg High Court',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(40),
  },
  {
    case_matter_number: 'IL-2026-0001',
    user_email: 'partner@infinitylegal.co.za',
    action: 'consultation',
    description: 'Initial consultation with client regarding custody arrangements and property division',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(7),
  },
  {
    case_matter_number: 'IL-2026-0002',
    user_email: 'md@infinitylegal.co.za',
    action: 'case_created',
    description: 'Matter opened for criminal defence of fraud charges. Initial bail application filed.',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(60),
  },
  {
    case_matter_number: 'IL-2026-0002',
    user_email: 'md@infinitylegal.co.za',
    action: 'urgency_change',
    description: 'Urgency escalated to critical due to approaching court date',
    previous_value: 'high',
    new_value: 'critical',
    created_at: daysAgo(5),
  },
  {
    case_matter_number: 'IL-2026-0003',
    user_email: 'associate@infinitylegal.co.za',
    action: 'case_created',
    description: 'New civil litigation matter opened for unlawful eviction dispute',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(30),
  },
  {
    case_matter_number: 'IL-2026-0004',
    user_email: 'associate@infinitylegal.co.za',
    action: 'document_approved',
    description: 'Property transfer agreement approved for Bishopscourt matter',
    previous_value: 'review',
    new_value: 'approved',
    created_at: daysAgo(14),
  },
  {
    case_matter_number: 'IL-2026-0006',
    user_email: 'partner@infinitylegal.co.za',
    action: 'status_change',
    description: 'Case moved to active status after filing of plea and counterclaim response',
    previous_value: 'pending_review',
    new_value: 'active',
    created_at: daysAgo(15),
  },
  {
    case_matter_number: 'IL-2026-0006',
    user_email: 'partner@infinitylegal.co.za',
    action: 'note_added',
    description: 'Legal opinion completed - favourable assessment of breach of contract claim. Counterclaim exposure estimated at R800K.',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(10),
  },
  {
    case_matter_number: 'IL-2026-0013',
    user_email: 'partner@infinitylegal.co.za',
    action: 'status_change',
    description: 'Case placed on hold pending expert actuarial report on business interruption calculation',
    previous_value: 'active',
    new_value: 'on_hold',
    created_at: daysAgo(14),
  },
  {
    case_matter_number: 'IL-2026-0018',
    user_email: 'officer@infinitylegal.co.za',
    action: 'status_change',
    description: 'Case closed after receipt of final payment from debtor',
    previous_value: 'settled',
    new_value: 'closed',
    created_at: daysAgo(10),
  },
  {
    case_matter_number: 'IL-2026-0018',
    user_email: 'paralegal@infinitylegal.co.za',
    action: 'document_filed',
    description: 'Settlement agreement signed and filed. Payment of R178,500 received in trust account.',
    previous_value: null,
    new_value: null,
    created_at: daysAgo(12),
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Infinity Legal ZA - Comprehensive Data Seed Script       ║');
  console.log('║   Task 3: Populate database with realistic sample data     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ============================================
  // Step 0: Load User IDs
  // ============================================
  console.log('📋 Step 0: Loading user IDs from database...\n');

  const allEmails = [
    ...STAFF_EMAILS,
    ...CLIENT_EMAILS,
    'hr@infinitylegal.co.za',
    'finance@infinitylegal.co.za',
    'receptionist@infinitylegal.co.za',
    'officeadmin@infinitylegal.co.za',
    'admin@infinitylegal.co.za',
  ];

  const users = await prisma.user.findMany({
    where: { email: { in: allEmails } },
    select: { id: true, email: true, role: true, full_name: true },
  });

  for (const u of users) {
    userIds[u.email] = u.id;
  }

  console.log(`  Found ${users.length} users in database:`);
  for (const u of users) {
    console.log(`    ${u.email.padEnd(40)} → ${u.id} (${u.role})`);
  }

  // Validate we have all required users
  const missingEmails = allEmails.filter(e => !userIds[e]);
  if (missingEmails.length > 0) {
    console.error(`\n❌ Missing users: ${missingEmails.join(', ')}`);
    console.error('Please run seed-users.ts first.');
    process.exit(1);
  }
  console.log('\n  ✅ All required users found.\n');

  // ============================================
  // Step 1: Clean existing data (optional - comment out to keep)
  // ============================================
  console.log('🧹 Step 1: Cleaning existing seed data...\n');

  // Delete in order of dependencies
  const deleteResult = await prisma.$transaction([
    prisma.caseTimeline.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.consultation.deleteMany({}),
    prisma.document.deleteMany({}),
    prisma.task.deleteMany({}),
    prisma.lead.deleteMany({}),
    prisma.message.deleteMany({}),
    prisma.case.deleteMany({}),
  ]);

  console.log(`  Deleted: ${deleteResult[0].count} timeline entries, ${deleteResult[1].count} notifications, ${deleteResult[2].count} consultations`);
  console.log(`  Deleted: ${deleteResult[3].count} documents, ${deleteResult[4].count} tasks, ${deleteResult[5].count} leads, ${deleteResult[6].count} messages, ${deleteResult[7].count} cases\n`);

  // ============================================
  // Step 2: Create Cases
  // ============================================
  console.log('📁 Step 2: Creating Cases...\n');

  const caseIdMap: Record<string, string> = {}; // matter_number -> id

  for (const caseData of CASES_DATA) {
    const c = await prisma.case.create({
      data: {
        matter_number: caseData.matter_number,
        title: caseData.title,
        description: caseData.description,
        case_type: caseData.case_type as any,
        urgency: caseData.urgency as any,
        status: caseData.status as any,
        client_id: userIds[caseData.client_email],
        lead_attorney_id: userIds[caseData.lead_attorney_email],
        support_paralegal_id: userIds[caseData.support_paralegal_email],
        court_date: caseData.court_date,
        filing_date: caseData.filing_date,
        estimated_value: caseData.estimated_value,
        is_high_risk: caseData.is_high_risk,
        next_action: caseData.next_action,
        next_action_date: caseData.next_action_date,
      },
    });
    caseIdMap[caseData.matter_number] = c.id;
    console.log(`  ✅ ${caseData.matter_number}: ${caseData.title.substring(0, 50)}... [${caseData.status}/${caseData.urgency}] R${(caseData.estimated_value / 1000000).toFixed(1)}M`);
  }

  console.log(`\n  Total cases created: ${CASES_DATA.length}\n`);

  // ============================================
  // Step 3: Create Leads
  // ============================================
  console.log('🎯 Step 3: Creating Leads...\n');

  for (const leadData of LEADS_DATA) {
    const l = await prisma.lead.create({
      data: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source as any,
        status: leadData.status as any,
        case_type: leadData.case_type as any,
        description: leadData.description,
        assigned_paralegal_id: userIds[leadData.assigned_paralegal_email],
        assigned_officer_id: userIds[leadData.assigned_officer_email],
        lead_score: leadData.lead_score,
        qualification_notes: leadData.qualification_notes,
        estimated_value: leadData.estimated_value,
        first_contact_date: leadData.first_contact_date,
        sla_deadline: leadData.sla_deadline,
      },
    });
    console.log(`  ✅ ${leadData.name} [${leadData.status}/${leadData.source}] Score: ${leadData.lead_score} R${(leadData.estimated_value / 1000).toFixed(0)}K`);
  }

  console.log(`\n  Total leads created: ${LEADS_DATA.length}\n`);

  // ============================================
  // Step 4: Create Tasks
  // ============================================
  console.log('✅ Step 4: Creating Tasks...\n');

  for (const taskData of TASKS_DATA) {
    const t = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        case_id: taskData.case_matter_number ? caseIdMap[taskData.case_matter_number] : null,
        assigned_to: userIds[taskData.assigned_to_email],
        created_by: userIds[taskData.created_by_email],
        priority: taskData.priority as any,
        status: taskData.status as any,
        due_date: taskData.due_date,
        completed_date: taskData.completed_date,
      },
    });
    const caseRef = taskData.case_matter_number ? `[${taskData.case_matter_number}]` : '[General]';
    console.log(`  ✅ ${caseRef} ${taskData.title.substring(0, 45)}... [${taskData.priority}/${taskData.status}] → ${taskData.assigned_to_email.split('@')[0]}`);
  }

  console.log(`\n  Total tasks created: ${TASKS_DATA.length}\n`);

  // ============================================
  // Step 5: Create Documents
  // ============================================
  console.log('📄 Step 5: Creating Documents...\n');

  for (const docData of DOCUMENTS_DATA) {
    const d = await prisma.document.create({
      data: {
        title: docData.title,
        case_id: caseIdMap[docData.case_matter_number],
        document_type: docData.document_type as any,
        workflow_status: docData.workflow_status as any,
        version: docData.version,
        file_name: docData.file_name,
        file_size: docData.file_size,
        prepared_by: userIds[docData.prepared_by_email],
        approved_by: docData.approved_by_email ? userIds[docData.approved_by_email] : null,
        signed_by: docData.signed_by_email ? userIds[docData.signed_by_email] : null,
        supervising_officer: docData.supervising_officer_email ? userIds[docData.supervising_officer_email] : null,
        description: docData.description,
        is_locked: docData.is_locked,
      },
    });
    console.log(`  ✅ ${docData.title.substring(0, 40)}... [${docData.document_type}/${docData.workflow_status}] v${docData.version}`);
  }

  console.log(`\n  Total documents created: ${DOCUMENTS_DATA.length}\n`);

  // ============================================
  // Step 6: Create Consultations
  // ============================================
  console.log('🗓️  Step 6: Creating Consultations...\n');

  for (const consData of CONSULTATIONS_DATA) {
    const c = await prisma.consultation.create({
      data: {
        client_id: userIds[consData.client_email],
        attorney_id: userIds[consData.attorney_email],
        case_id: consData.case_matter_number ? caseIdMap[consData.case_matter_number] : null,
        scheduled_date: consData.scheduled_date,
        scheduled_time: consData.scheduled_time,
        duration_minutes: consData.duration_minutes,
        status: consData.status as any,
        notes: consData.notes,
        meeting_type: consData.meeting_type as any,
      },
    });
    const caseRef = consData.case_matter_number ? `[${consData.case_matter_number}]` : '[No Case]';
    console.log(`  ✅ ${caseRef} ${consData.client_email.split('@')[0]} ↔ ${consData.attorney_email.split('@')[0]} [${consData.status}/${consData.meeting_type}]`);
  }

  console.log(`\n  Total consultations created: ${CONSULTATIONS_DATA.length}\n`);

  // ============================================
  // Step 7: Create Notifications
  // ============================================
  console.log('🔔 Step 7: Creating Notifications...\n');

  for (const notifData of NOTIFICATIONS_DATA) {
    const n = await prisma.notification.create({
      data: {
        user_id: userIds[notifData.user_email],
        type: notifData.type as any,
        title: notifData.title,
        message: notifData.message,
        is_read: notifData.is_read,
        link: notifData.link,
        related_id: notifData.related_id,
      },
    });
    const readStatus = notifData.is_read ? 'READ' : 'UNREAD';
    console.log(`  ✅ [${readStatus}] → ${notifData.user_email.split('@')[0]}: ${notifData.title.substring(0, 45)}...`);
  }

  console.log(`\n  Total notifications created: ${NOTIFICATIONS_DATA.length}\n`);

  // ============================================
  // Step 8: Create Case Timelines
  // ============================================
  console.log('📜 Step 8: Creating Case Timelines...\n');

  for (const tlData of TIMELINE_DATA) {
    const tl = await prisma.caseTimeline.create({
      data: {
        case_id: caseIdMap[tlData.case_matter_number],
        user_id: userIds[tlData.user_email],
        action: tlData.action,
        description: tlData.description,
        previous_value: tlData.previous_value,
        new_value: tlData.new_value,
        created_at: tlData.created_at,
      },
    });
    console.log(`  ✅ ${tlData.case_matter_number}: ${tlData.action} - ${tlData.description.substring(0, 50)}...`);
  }

  console.log(`\n  Total timeline entries created: ${TIMELINE_DATA.length}\n`);

  // ============================================
  // Summary
  // ============================================
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SEED SUMMARY                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Cases:           ${String(CASES_DATA.length).padEnd(42)}║`);
  console.log(`║  Leads:           ${String(LEADS_DATA.length).padEnd(42)}║`);
  console.log(`║  Tasks:           ${String(TASKS_DATA.length).padEnd(42)}║`);
  console.log(`║  Documents:       ${String(DOCUMENTS_DATA.length).padEnd(42)}║`);
  console.log(`║  Consultations:   ${String(CONSULTATIONS_DATA.length).padEnd(42)}║`);
  console.log(`║  Notifications:   ${String(NOTIFICATIONS_DATA.length).padEnd(42)}║`);
  console.log(`║  Timeline Entries:${String(TIMELINE_DATA.length).padEnd(42)}║`);

  // Calculate totals
  const totalCaseValue = CASES_DATA.reduce((sum, c) => sum + c.estimated_value, 0);
  const activeCases = CASES_DATA.filter(c => c.status === 'active').length;
  const highRiskCases = CASES_DATA.filter(c => c.is_high_risk).length;
  const urgentTasks = TASKS_DATA.filter(t => t.priority === 'urgent').length;
  const overdueTasks = TASKS_DATA.filter(t => t.status === 'overdue').length;

  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Case Value:  R${(totalCaseValue / 1000000).toFixed(1)}M${' '.repeat(35 - (totalCaseValue / 1000000).toFixed(1).length)}║`);
  console.log(`║  Active Cases:      ${String(activeCases).padEnd(42)}║`);
  console.log(`║  High-Risk Cases:   ${String(highRiskCases).padEnd(42)}║`);
  console.log(`║  Urgent Tasks:      ${String(urgentTasks).padEnd(42)}║`);
  console.log(`║  Overdue Tasks:     ${String(overdueTasks).padEnd(42)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('🎉 Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
