/**
 * Infinity OS — Role-Based Access Control (RBAC)
 * Enterprise legal practice management with full organizational hierarchy
 * Infinity Legal (Pty) Ltd — South Africa
 */

import { supabaseAdmin } from './supabase-admin'
import { createClient } from '@supabase/supabase-js'

// ============ ROLE DEFINITIONS ============

export const ROLES = {
  // Executive Leadership
  MANAGING_DIRECTOR: 'managing_director',
  DEPUTY_MD: 'deputy_md',
  
  // Legal Department
  SENIOR_PARTNER: 'senior_partner',
  ASSOCIATE: 'associate',
  JUNIOR_ATTORNEY: 'junior_attorney',
  PARALEGAL: 'paralegal',
  LEGAL_ASSISTANT: 'legal_assistant',
  
  // Operations
  OPERATIONS_DIRECTOR: 'operations_director',
  OFFICE_MANAGER: 'office_manager',
  
  // Finance & Administration
  CFO: 'cfo',
  BILLING_SPECIALIST: 'billing_specialist',
  
  // Business Development
  MARKETING_DIRECTOR: 'marketing_director',
  CLIENT_RELATIONS: 'client_relations',
  INTAKE_AGENT: 'intake_agent',
  
  // IT & Technology
  IT_DIRECTOR: 'it_director',
  SYSTEMS_ADMIN: 'systems_admin',
  
  // Human Resources
  HR_DIRECTOR: 'hr_director',
  
  // General
  ADMIN: 'admin',
  CLIENT: 'client',
  
  // Legacy mappings (backward compatibility)
  MANAGING_PARTNER: 'managing_partner',
  LEGAL_OFFICER: 'legal_officer',
  IT_ADMIN: 'it_admin',
  ATTORNEY: 'attorney',
}

export const DEPARTMENTS = {
  EXECUTIVE: 'executive',
  LEGAL: 'legal',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  BUSINESS_DEV: 'business_development',
  IT: 'it',
  HR: 'human_resources',
  CLIENT: 'client',
}

// Role → Access tier (higher = more access)
export const ROLE_TIERS = {
  // Executive
  [ROLES.MANAGING_DIRECTOR]: 100,
  [ROLES.DEPUTY_MD]: 95,
  
  // Legal
  [ROLES.SENIOR_PARTNER]: 90,
  [ROLES.ASSOCIATE]: 80,
  [ROLES.JUNIOR_ATTORNEY]: 70,
  [ROLES.PARALEGAL]: 50,
  [ROLES.LEGAL_ASSISTANT]: 40,
  
  // Operations
  [ROLES.OPERATIONS_DIRECTOR]: 75,
  [ROLES.OFFICE_MANAGER]: 60,
  
  // Finance
  [ROLES.CFO]: 85,
  [ROLES.BILLING_SPECIALIST]: 55,
  
  // Business Development
  [ROLES.MARKETING_DIRECTOR]: 65,
  [ROLES.CLIENT_RELATIONS]: 45,
  [ROLES.INTAKE_AGENT]: 30,
  
  // IT
  [ROLES.IT_DIRECTOR]: 75,
  [ROLES.SYSTEMS_ADMIN]: 70,
  
  // HR
  [ROLES.HR_DIRECTOR]: 75,
  
  // General
  [ROLES.ADMIN]: 60,
  [ROLES.CLIENT]: 10,
  
  // Legacy mappings
  [ROLES.MANAGING_PARTNER]: 100,
  [ROLES.LEGAL_OFFICER]: 80,
  [ROLES.IT_ADMIN]: 70,
  [ROLES.ATTORNEY]: 80,
}

// Role → Department mapping
export const ROLE_DEPARTMENTS = {
  [ROLES.MANAGING_DIRECTOR]: DEPARTMENTS.EXECUTIVE,
  [ROLES.DEPUTY_MD]: DEPARTMENTS.EXECUTIVE,
  [ROLES.SENIOR_PARTNER]: DEPARTMENTS.LEGAL,
  [ROLES.ASSOCIATE]: DEPARTMENTS.LEGAL,
  [ROLES.JUNIOR_ATTORNEY]: DEPARTMENTS.LEGAL,
  [ROLES.PARALEGAL]: DEPARTMENTS.LEGAL,
  [ROLES.LEGAL_ASSISTANT]: DEPARTMENTS.LEGAL,
  [ROLES.OPERATIONS_DIRECTOR]: DEPARTMENTS.OPERATIONS,
  [ROLES.OFFICE_MANAGER]: DEPARTMENTS.OPERATIONS,
  [ROLES.CFO]: DEPARTMENTS.FINANCE,
  [ROLES.BILLING_SPECIALIST]: DEPARTMENTS.FINANCE,
  [ROLES.MARKETING_DIRECTOR]: DEPARTMENTS.BUSINESS_DEV,
  [ROLES.CLIENT_RELATIONS]: DEPARTMENTS.BUSINESS_DEV,
  [ROLES.INTAKE_AGENT]: DEPARTMENTS.BUSINESS_DEV,
  [ROLES.IT_DIRECTOR]: DEPARTMENTS.IT,
  [ROLES.SYSTEMS_ADMIN]: DEPARTMENTS.IT,
  [ROLES.HR_DIRECTOR]: DEPARTMENTS.HR,
  [ROLES.ADMIN]: DEPARTMENTS.OPERATIONS,
  [ROLES.CLIENT]: DEPARTMENTS.CLIENT,
  // Legacy
  [ROLES.MANAGING_PARTNER]: DEPARTMENTS.EXECUTIVE,
  [ROLES.LEGAL_OFFICER]: DEPARTMENTS.LEGAL,
  [ROLES.IT_ADMIN]: DEPARTMENTS.IT,
  [ROLES.ATTORNEY]: DEPARTMENTS.LEGAL,
}

// Role display labels
export const ROLE_LABELS = {
  [ROLES.MANAGING_DIRECTOR]: 'Managing Director',
  [ROLES.DEPUTY_MD]: 'Deputy Managing Director',
  [ROLES.SENIOR_PARTNER]: 'Senior Partner',
  [ROLES.ASSOCIATE]: 'Associate Attorney',
  [ROLES.JUNIOR_ATTORNEY]: 'Junior Attorney',
  [ROLES.PARALEGAL]: 'Paralegal',
  [ROLES.LEGAL_ASSISTANT]: 'Legal Assistant',
  [ROLES.OPERATIONS_DIRECTOR]: 'Operations Director',
  [ROLES.OFFICE_MANAGER]: 'Office Manager',
  [ROLES.CFO]: 'Chief Financial Officer',
  [ROLES.BILLING_SPECIALIST]: 'Billing Specialist',
  [ROLES.MARKETING_DIRECTOR]: 'Marketing Director',
  [ROLES.CLIENT_RELATIONS]: 'Client Relations Manager',
  [ROLES.INTAKE_AGENT]: 'Intake Specialist',
  [ROLES.IT_DIRECTOR]: 'IT Director',
  [ROLES.SYSTEMS_ADMIN]: 'Systems Administrator',
  [ROLES.HR_DIRECTOR]: 'HR Director',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.CLIENT]: 'Client',
  // Legacy
  [ROLES.MANAGING_PARTNER]: 'Managing Partner',
  [ROLES.LEGAL_OFFICER]: 'Legal Officer',
  [ROLES.IT_ADMIN]: 'IT Administrator',
  [ROLES.ATTORNEY]: 'Attorney',
}

// Normalize legacy roles to new system
export function normalizeRole(role) {
  const LEGACY_MAP = {
    'managing_partner': 'managing_director',
    'legal_officer': 'associate',
    'attorney': 'associate',
    'it_admin': 'systems_admin',
  }
  return LEGACY_MAP[role] || role
}

// ============ ROLE GROUPS ============

// All legal staff who can work on cases
const LEGAL_STAFF = [
  ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD,
  ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY,
  ROLES.PARALEGAL, ROLES.LEGAL_ASSISTANT,
  // Legacy
  ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY,
]

// Officers who can sign, approve, view privileged notes
const OFFICERS = [
  ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD,
  ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY,
  // Legacy
  ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY,
]

// Directors / Department heads
const DIRECTORS = [
  ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD,
  ROLES.OPERATIONS_DIRECTOR, ROLES.CFO, ROLES.MARKETING_DIRECTOR,
  ROLES.IT_DIRECTOR, ROLES.HR_DIRECTOR,
  ROLES.MANAGING_PARTNER,
]

// All staff with portal access
const PORTAL_STAFF = [
  ...LEGAL_STAFF,
  ROLES.OPERATIONS_DIRECTOR, ROLES.OFFICE_MANAGER,
  ROLES.CFO, ROLES.BILLING_SPECIALIST,
  ROLES.MARKETING_DIRECTOR, ROLES.CLIENT_RELATIONS, ROLES.INTAKE_AGENT,
  ROLES.IT_DIRECTOR, ROLES.SYSTEMS_ADMIN,
  ROLES.HR_DIRECTOR, ROLES.ADMIN, ROLES.IT_ADMIN,
]

// ============ PERMISSION MATRIX ============

export const PERMISSIONS = {
  // Case Management
  VIEW_ALL_CASES: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  VIEW_ASSIGNED_CASES: [...LEGAL_STAFF],
  CREATE_CASE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.INTAKE_AGENT, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],
  UPDATE_CASE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],
  CLOSE_CASE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Document Management
  VIEW_DOCUMENTS: [...LEGAL_STAFF],
  CREATE_DOCUMENT: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],
  APPROVE_DOCUMENT: [...OFFICERS],
  SIGN_DOCUMENT: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  SEND_TO_CLIENT: [...OFFICERS],

  // Privileged Notes (Attorney-Client Privilege)
  VIEW_PRIVILEGED_NOTES: [...OFFICERS],
  CREATE_PRIVILEGED_NOTES: [...OFFICERS],

  // Lead Management
  VIEW_LEADS: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.INTAKE_AGENT, ROLES.CLIENT_RELATIONS, ROLES.MARKETING_DIRECTOR, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  CREATE_LEAD: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.INTAKE_AGENT, ROLES.CLIENT_RELATIONS, ROLES.MANAGING_PARTNER],
  QUALIFY_LEAD: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.INTAKE_AGENT, ROLES.MANAGING_PARTNER],
  ASSIGN_LEAD: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Billing & Finance
  VIEW_BILLING: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.CFO, ROLES.BILLING_SPECIALIST, ROLES.SENIOR_PARTNER, ROLES.MANAGING_PARTNER, ROLES.ADMIN],
  APPROVE_BILLING: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.CFO, ROLES.SENIOR_PARTNER, ROLES.MANAGING_PARTNER],

  // User Management
  MANAGE_USERS: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.IT_DIRECTOR, ROLES.SYSTEMS_ADMIN, ROLES.HR_DIRECTOR, ROLES.MANAGING_PARTNER, ROLES.IT_ADMIN],
  VIEW_AUDIT_LOGS: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.IT_DIRECTOR, ROLES.SYSTEMS_ADMIN, ROLES.MANAGING_PARTNER, ROLES.IT_ADMIN],

  // Tasks
  VIEW_ALL_TASKS: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  CREATE_TASK: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],
  COMPLETE_TASK: [...LEGAL_STAFF],

  // HR & Administration
  VIEW_HR: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.HR_DIRECTOR, ROLES.MANAGING_PARTNER],
  MANAGE_LEAVE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.HR_DIRECTOR, ROLES.OPERATIONS_DIRECTOR, ROLES.MANAGING_PARTNER],
  VIEW_REPORTS: [...DIRECTORS, ROLES.SENIOR_PARTNER, ROLES.CFO],

  // Document Management (Templates, Versioning)
  MANAGE_DOCUMENTS: [...OFFICERS, ROLES.PARALEGAL],

  // Communication Hub
  MANAGE_ANNOUNCEMENTS: [...DIRECTORS],

  // Knowledge Management
  MANAGE_KNOWLEDGE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],

  // Compliance & Risk
  VIEW_COMPLIANCE: [ROLES.MANAGING_DIRECTOR, ROLES.DEPUTY_MD, ROLES.SENIOR_PARTNER, ROLES.ASSOCIATE, ROLES.JUNIOR_ATTORNEY, ROLES.PARALEGAL, ROLES.CFO, ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY],

  // Portal Access
  ACCESS_PORTAL: PORTAL_STAFF,
}

// ============ ACCESS CONTROL FUNCTIONS ============

export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

export function hasMinTier(role, minTier) {
  const tier = ROLE_TIERS[role] || 0
  return tier >= minTier
}

export function isLegalStaff(role) {
  return LEGAL_STAFF.includes(role)
}

export function isOfficer(role) {
  return OFFICERS.includes(role)
}

export function isDirector(role) {
  return DIRECTORS.includes(role)
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role
}

export function getRoleDepartment(role) {
  return ROLE_DEPARTMENTS[role] || DEPARTMENTS.OPERATIONS
}

// ============ API MIDDLEWARE ============

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

export async function requireRole(request, allowedRoles) {
  const user = await getUserFromRequest(request)
  if (!user) return { error: 'Unauthorized. Please log in.', status: 401 }

  const role = user.profile?.role || 'client'
  if (!allowedRoles.includes(role)) {
    return { error: `Access denied. Required roles: ${allowedRoles.join(', ')}`, status: 403 }
  }
  return { user }
}

export async function requirePermission(request, permission) {
  const user = await getUserFromRequest(request)
  if (!user) return { error: 'Unauthorized. Please log in.', status: 401 }

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, permission)) {
    return { error: `Access denied. Missing permission: ${permission}`, status: 403 }
  }
  return { user }
}

export async function createAuditLog({ userId, action, resourceType, resourceId, details, ipAddress }) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ipAddress || null,
        created_at: new Date().toISOString(),
      }])
    if (error) console.error('Audit log error:', error)
  } catch (err) {
    console.error('Audit log write failed:', err.message)
  }
}
