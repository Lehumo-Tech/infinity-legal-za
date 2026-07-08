/**
 * Infinity Legal ZA - Authentication Library (Supabase)
 * 
 * Uses Supabase Auth for authentication, with RBAC roles
 * stored in the profiles table.
 */

import { validateLocalToken } from '@/lib/local-auth';

// ============================================
// RBAC - ROLE-BASED ACCESS CONTROL
// (Preserved from original implementation)
// ============================================

export const ROLES = {
  managing_director: { tier: 100, label: 'Managing Director', department: 'management' },
  senior_partner: { tier: 95, label: 'Senior Partner', department: 'management' },
  systems_admin: { tier: 90, label: 'Systems Admin', department: 'it' },
  admin: { tier: 85, label: 'Admin', department: 'management' },
  supervising_officer: { tier: 80, label: 'Supervising Officer', department: 'management' },
  legal_officer: { tier: 75, label: 'Legal Officer', department: 'litigation' },
  attorney: { tier: 72, label: 'Legal Advisor', department: 'litigation' },
  associate: { tier: 70, label: 'Associate', department: 'litigation' },
  senior_consultant: { tier: 65, label: 'Senior Consultant', department: 'consulting' },
  hr_manager: { tier: 60, label: 'HR Manager', department: 'hr' },
  finance_manager: { tier: 60, label: 'Finance Manager', department: 'finance' },
  consultant: { tier: 55, label: 'Consultant', department: 'consulting' },
  paralegal: { tier: 50, label: 'Paralegal', department: 'litigation' },
  candidate_attorney: { tier: 45, label: 'Candidate Legal Advisor', department: 'litigation' },
  office_administrator: { tier: 40, label: 'Office Administrator', department: 'administration' },
  receptionist: { tier: 30, label: 'Receptionist', department: 'administration' },
  client: { tier: 10, label: 'Client', department: undefined },
  guest: { tier: 5, label: 'Guest', department: undefined },
} as const;

export type RoleKey = keyof typeof ROLES;

// Permission definitions
export const PERMISSIONS = {
  VIEW_ALL_CASES: 'view_all_cases',
  VIEW_OWN_CASES: 'view_own_cases',
  CREATE_CASE: 'create_case',
  EDIT_CASE: 'edit_case',
  DELETE_CASE: 'delete_case',
  ASSIGN_CASE: 'assign_case',
  CLOSE_CASE: 'close_case',
  ARCHIVE_CASE: 'archive_case',
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENT: 'upload_document',
  APPROVE_DOCUMENT: 'approve_document',
  SIGN_DOCUMENT: 'sign_document',
  DELETE_DOCUMENT: 'delete_document',
  VIEW_LEADS: 'view_leads',
  CREATE_LEAD: 'create_lead',
  EDIT_LEAD: 'edit_lead',
  CONVERT_LEAD: 'convert_lead',
  DELETE_LEAD: 'delete_lead',
  VIEW_TASKS: 'view_tasks',
  CREATE_TASK: 'create_task',
  EDIT_TASK: 'edit_task',
  DELETE_TASK: 'delete_task',
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DEACTIVATE_USER: 'deactivate_user',
  VIEW_PRIVILEGED_NOTES: 'view_privileged_notes',
  CREATE_PRIVILEGED_NOTE: 'create_privileged_note',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_BILLING: 'view_billing',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  RUN_BACKUPS: 'run_backups',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-to-permission mapping
const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  managing_director: Object.values(PERMISSIONS) as PermissionKey[],
  senior_partner: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE,
    PERMISSIONS.EDIT_CASE, PERMISSIONS.ASSIGN_CASE, PERMISSIONS.CLOSE_CASE, PERMISSIONS.ARCHIVE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT, PERMISSIONS.SIGN_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD, PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
    PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_BILLING,
  ],
  attorney: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE, PERMISSIONS.EDIT_CASE, PERMISSIONS.ASSIGN_CASE, PERMISSIONS.CLOSE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT, PERMISSIONS.SIGN_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD, PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
    PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_BILLING,
  ],
  associate: [
    PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE, PERMISSIONS.EDIT_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_USERS,
  ],
  paralegal: [
    PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
  ],
  legal_officer: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE, PERMISSIONS.EDIT_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
  ],
  supervising_officer: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE, PERMISSIONS.EDIT_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT, PERMISSIONS.SIGN_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD, PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  senior_consultant: [
    PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
  ],
  consultant: [
    PERMISSIONS.VIEW_OWN_CASES,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_TASKS,
  ],
  candidate_attorney: [
    PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK,
  ],
  hr_manager: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.CREATE_USER, PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  finance_manager: [
    PERMISSIONS.VIEW_BILLING, PERMISSIONS.MANAGE_SUBSCRIPTIONS, PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  office_administrator: [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.VIEW_LEADS, PERMISSIONS.VIEW_TASKS,
  ],
  systems_admin: [
    PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.RUN_BACKUPS,
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.DELETE_CASE, PERMISSIONS.DELETE_DOCUMENT,
  ],
  admin: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE, PERMISSIONS.EDIT_CASE,
    PERMISSIONS.ASSIGN_CASE, PERMISSIONS.CLOSE_CASE, PERMISSIONS.ARCHIVE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD, PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
    PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
  ],
  receptionist: [
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD,
  ],
  client: [
    PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_TASKS,
  ],
  guest: [],
};

export function hasPermission(role: RoleKey, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: RoleKey, permissions: PermissionKey[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: RoleKey, permissions: PermissionKey[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function getRolePermissions(role: RoleKey): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isRoleAtLeast(role: RoleKey, minimumRole: RoleKey): boolean {
  return ROLES[role]?.tier >= ROLES[minimumRole]?.tier;
}

export function canManageRole(actorRole: RoleKey, targetRole: RoleKey): boolean {
  return ROLES[actorRole]?.tier > ROLES[targetRole]?.tier;
}

// Role groups
export const ROLE_GROUPS = {
  LEGAL_STAFF: ['attorney', 'associate', 'paralegal', 'candidate_attorney'] as RoleKey[],
  OFFICERS: ['legal_officer', 'supervising_officer'] as RoleKey[],
  DIRECTORS: ['managing_director', 'senior_partner'] as RoleKey[],
  PORTAL_STAFF: ['attorney', 'associate', 'paralegal', 'legal_officer', 'supervising_officer', 'candidate_attorney'] as RoleKey[],
  ADMIN_STAFF: ['managing_director', 'senior_partner', 'systems_admin', 'admin'] as RoleKey[],
  ALL_STAFF: ['managing_director', 'senior_partner', 'attorney', 'associate', 'paralegal', 'legal_officer', 'supervising_officer', 'senior_consultant', 'consultant', 'candidate_attorney', 'hr_manager', 'finance_manager', 'office_administrator', 'systems_admin', 'admin', 'receptionist'] as RoleKey[],
};

export function isLegalStaff(role: RoleKey): boolean { return ROLE_GROUPS.LEGAL_STAFF.includes(role); }
export function isDirector(role: RoleKey): boolean { return ROLE_GROUPS.DIRECTORS.includes(role); }
export function isAdmin(role: RoleKey): boolean { return ROLE_GROUPS.ADMIN_STAFF.includes(role); }
export function isStaff(role: RoleKey): boolean { return ROLE_GROUPS.ALL_STAFF.includes(role); }

// ============================================
// SUPABASE AUTH - TOKEN VERIFICATION
// ============================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  department?: string;
}

/**
 * Verify a JWT token from the Authorization header.
 * Tries local JWT validation (Prisma/SQLite auth) — Supabase is no longer used.
 * Returns the user payload with role from the User table.
 */
export async function getUserFromToken(authHeader: string | null): Promise<TokenPayload | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);

  try {
    const payload = await validateLocalToken(token);
    if (!payload) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Synchronous version for middleware compatibility.
 * Uses Supabase Auth admin to verify JWT tokens.
 */
export function getUserFromTokenSync(authHeader: string | null): TokenPayload | null {
  // For Supabase, we need async verification.
  // The sync version will be used only in cases where we can't await.
  // In practice, all API routes use the async version.
  if (!authHeader?.startsWith('Bearer ')) return null;
  return null; // Must use async getUserFromToken instead
}

// ============================================
// PASSWORD VALIDATION (kept for signup validation)
// ============================================

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Must contain a special character');
  return { valid: errors.length === 0, errors };
}
