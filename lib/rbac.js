/**
 * Infinity OS — Role-Based Access Control (RBAC)
 * Enforces privilege separation between Legal Officers, Paralegals, Intake Agents, etc.
 */

import { supabaseAdmin } from './supabase-admin'
import { createClient } from '@supabase/supabase-js'

// ============ ROLE DEFINITIONS ============

export const ROLES = {
  MANAGING_PARTNER: 'managing_partner',
  LEGAL_OFFICER: 'legal_officer',
  PARALEGAL: 'paralegal',
  INTAKE_AGENT: 'intake_agent',
  ADMIN: 'admin',
  IT_ADMIN: 'it_admin',
  CLIENT: 'client',
  ATTORNEY: 'attorney', // Legacy — maps to legal_officer
}

export const DEPARTMENTS = {
  EXECUTIVE: 'executive',
  LEGAL: 'legal',
  CALL_CENTER: 'call_center',
  OPERATIONS: 'operations',
  IT: 'it',
  CLIENT: 'client',
}

// Role → Access tier (higher = more access)
export const ROLE_TIERS = {
  [ROLES.MANAGING_PARTNER]: 100,
  [ROLES.LEGAL_OFFICER]: 80,
  [ROLES.IT_ADMIN]: 70,
  [ROLES.ADMIN]: 60,
  [ROLES.PARALEGAL]: 50,
  [ROLES.INTAKE_AGENT]: 30,
  [ROLES.ATTORNEY]: 80, // Legacy mapping
  [ROLES.CLIENT]: 10,
}

// Role → Department mapping
export const ROLE_DEPARTMENTS = {
  [ROLES.MANAGING_PARTNER]: DEPARTMENTS.EXECUTIVE,
  [ROLES.LEGAL_OFFICER]: DEPARTMENTS.LEGAL,
  [ROLES.PARALEGAL]: DEPARTMENTS.LEGAL,
  [ROLES.INTAKE_AGENT]: DEPARTMENTS.CALL_CENTER,
  [ROLES.ADMIN]: DEPARTMENTS.OPERATIONS,
  [ROLES.IT_ADMIN]: DEPARTMENTS.IT,
  [ROLES.ATTORNEY]: DEPARTMENTS.LEGAL,
  [ROLES.CLIENT]: DEPARTMENTS.CLIENT,
}

// ============ PERMISSION MATRIX ============

export const PERMISSIONS = {
  // Case Management
  VIEW_ALL_CASES: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  VIEW_ASSIGNED_CASES: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  CREATE_CASE: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL, ROLES.INTAKE_AGENT],
  UPDATE_CASE: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  CLOSE_CASE: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Document Management
  VIEW_DOCUMENTS: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  CREATE_DOCUMENT: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  APPROVE_DOCUMENT: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  SIGN_DOCUMENT: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  SEND_TO_CLIENT: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Privileged Notes (Attorney-Client Privilege)
  VIEW_PRIVILEGED_NOTES: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  CREATE_PRIVILEGED_NOTES: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Lead Management
  VIEW_LEADS: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL, ROLES.INTAKE_AGENT],
  CREATE_LEAD: [ROLES.MANAGING_PARTNER, ROLES.INTAKE_AGENT],
  QUALIFY_LEAD: [ROLES.MANAGING_PARTNER, ROLES.INTAKE_AGENT],
  ASSIGN_LEAD: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // Billing & Finance
  VIEW_BILLING: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ADMIN],
  APPROVE_BILLING: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],

  // User Management
  MANAGE_USERS: [ROLES.MANAGING_PARTNER, ROLES.IT_ADMIN],
  VIEW_AUDIT_LOGS: [ROLES.MANAGING_PARTNER, ROLES.IT_ADMIN],

  // Tasks
  VIEW_ALL_TASKS: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER],
  CREATE_TASK: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],
  COMPLETE_TASK: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL],

  // Portal Access
  ACCESS_PORTAL: [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL, ROLES.INTAKE_AGENT, ROLES.ADMIN, ROLES.IT_ADMIN],
}

// ============ ACCESS CONTROL FUNCTIONS ============

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  // Map legacy 'attorney' to 'legal_officer'
  const effectiveRole = role === ROLES.ATTORNEY ? ROLES.LEGAL_OFFICER : role
  return allowedRoles.includes(effectiveRole)
}

/**
 * Check if a role meets a minimum tier level
 */
export function hasMinTier(role, minTier) {
  const tier = ROLE_TIERS[role] || 0
  return tier >= minTier
}

/**
 * Check if a role is a legal staff member
 */
export function isLegalStaff(role) {
  return [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.PARALEGAL, ROLES.ATTORNEY].includes(role)
}

/**
 * Check if a role is an officer (can sign, approve, view privileged)
 */
export function isOfficer(role) {
  return [ROLES.MANAGING_PARTNER, ROLES.LEGAL_OFFICER, ROLES.ATTORNEY].includes(role)
}

// ============ API MIDDLEWARE ============

/**
 * Extract authenticated user from request
 */
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  // Fetch profile with role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

/**
 * Require specific roles — returns error response or user
 */
export async function requireRole(request, allowedRoles) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return { error: 'Unauthorized. Please log in.', status: 401 }
  }

  const role = user.profile?.role || 'client'
  const effectiveRole = role === ROLES.ATTORNEY ? ROLES.LEGAL_OFFICER : role

  if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(role)) {
    return { error: `Access denied. Required roles: ${allowedRoles.join(', ')}`, status: 403 }
  }

  return { user }
}

/**
 * Require specific permission — returns error response or user
 */
export async function requirePermission(request, permission) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return { error: 'Unauthorized. Please log in.', status: 401 }
  }

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, permission)) {
    return { error: `Access denied. Missing permission: ${permission}`, status: 403 }
  }

  return { user }
}

/**
 * Create an audit log entry
 */
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
