/**
 * Infinity Legal ZA - Authentication Library
 * Password hashing, JWT, RBAC, session management
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============================================
// PASSWORD MANAGEMENT
// ============================================

const SALT_LENGTH = 32;
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const PASSWORD_EXPIRY_DAYS = 90;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const hash = createHmac('sha512', salt)
    .update(password)
    .digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const computedHash = createHmac('sha512', salt)
    .update(password)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

export function isPasswordExpired(lastPasswordChange: Date | null): boolean {
  if (!lastPasswordChange) return true;
  const expiryDate = new Date(lastPasswordChange);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
  return new Date() > expiryDate;
}

export function getPasswordExpiryDate(fromDate: Date = new Date()): Date {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + PASSWORD_EXPIRY_DAYS);
  return expiry;
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Must contain a special character');
  return { valid: errors.length === 0, errors };
}

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_EXPIRY = '24h';
const JWT_REFRESH_EXPIRY_DAYS = 7;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  department?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + 86400, // 24 hours
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(base64UrlDecode(body));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================
// RBAC - ROLE-BASED ACCESS CONTROL
// ============================================

export const ROLES = {
  managing_director: { tier: 100, label: 'Managing Director', department: 'management' },
  senior_partner: { tier: 95, label: 'Senior Partner', department: 'management' },
  associate: { tier: 70, label: 'Associate', department: 'litigation' },
  paralegal: { tier: 50, label: 'Paralegal', department: 'litigation' },
  legal_officer: { tier: 75, label: 'Legal Officer', department: 'litigation' },
  supervising_officer: { tier: 80, label: 'Supervising Officer', department: 'management' },
  senior_consultant: { tier: 65, label: 'Senior Consultant', department: 'consulting' },
  consultant: { tier: 55, label: 'Consultant', department: 'consulting' },
  candidate_attorney: { tier: 45, label: 'Candidate Attorney', department: 'litigation' },
  hr_manager: { tier: 60, label: 'HR Manager', department: 'hr' },
  finance_manager: { tier: 60, label: 'Finance Manager', department: 'finance' },
  office_administrator: { tier: 40, label: 'Office Administrator', department: 'administration' },
  systems_admin: { tier: 90, label: 'Systems Admin', department: 'it' },
  receptionist: { tier: 30, label: 'Receptionist', department: 'administration' },
  client: { tier: 10, label: 'Client', department: undefined },
  guest: { tier: 5, label: 'Guest', department: undefined },
} as const;

export type RoleKey = keyof typeof ROLES;

// Permission definitions
export const PERMISSIONS = {
  // Case permissions
  VIEW_ALL_CASES: 'view_all_cases',
  VIEW_OWN_CASES: 'view_own_cases',
  CREATE_CASE: 'create_case',
  EDIT_CASE: 'edit_case',
  DELETE_CASE: 'delete_case',
  ASSIGN_CASE: 'assign_case',
  CLOSE_CASE: 'close_case',
  ARCHIVE_CASE: 'archive_case',
  
  // Document permissions
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENT: 'upload_document',
  APPROVE_DOCUMENT: 'approve_document',
  SIGN_DOCUMENT: 'sign_document',
  DELETE_DOCUMENT: 'delete_document',
  
  // Lead permissions
  VIEW_LEADS: 'view_leads',
  CREATE_LEAD: 'create_lead',
  EDIT_LEAD: 'edit_lead',
  CONVERT_LEAD: 'convert_lead',
  DELETE_LEAD: 'delete_lead',
  
  // Task permissions
  VIEW_TASKS: 'view_tasks',
  CREATE_TASK: 'create_task',
  EDIT_TASK: 'edit_task',
  DELETE_TASK: 'delete_task',
  
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DEACTIVATE_USER: 'deactivate_user',
  
  // Privileged notes
  VIEW_PRIVILEGED_NOTES: 'view_privileged_notes',
  CREATE_PRIVILEGED_NOTE: 'create_privileged_note',
  
  // Admin
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
  managing_director: Object.values(PERMISSIONS) as PermissionKey[], // All permissions
  senior_partner: [
    PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE,
    PERMISSIONS.EDIT_CASE, PERMISSIONS.ASSIGN_CASE, PERMISSIONS.CLOSE_CASE, PERMISSIONS.ARCHIVE_CASE,
    PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.UPLOAD_DOCUMENT, PERMISSIONS.APPROVE_DOCUMENT, PERMISSIONS.SIGN_DOCUMENT,
    PERMISSIONS.VIEW_LEADS, PERMISSIONS.CREATE_LEAD, PERMISSIONS.EDIT_LEAD, PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.VIEW_TASKS, PERMISSIONS.CREATE_TASK, PERMISSIONS.EDIT_TASK,
    PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_PRIVILEGED_NOTES, PERMISSIONS.CREATE_PRIVILEGED_NOTE,
    PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_BILLING,
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

// Role groups for quick checks
export const ROLE_GROUPS = {
  LEGAL_STAFF: ['associate', 'paralegal', 'candidate_attorney'] as RoleKey[],
  OFFICERS: ['legal_officer', 'supervising_officer'] as RoleKey[],
  DIRECTORS: ['managing_director', 'senior_partner'] as RoleKey[],
  PORTAL_STAFF: ['associate', 'paralegal', 'legal_officer', 'supervising_officer', 'candidate_attorney'] as RoleKey[],
  ADMIN_STAFF: ['managing_director', 'senior_partner', 'systems_admin'] as RoleKey[],
  ALL_STAFF: ['managing_director', 'senior_partner', 'associate', 'paralegal', 'legal_officer', 'supervising_officer', 'senior_consultant', 'consultant', 'candidate_attorney', 'hr_manager', 'finance_manager', 'office_administrator', 'systems_admin', 'receptionist'] as RoleKey[],
};

export function isLegalStaff(role: RoleKey): boolean {
  return ROLE_GROUPS.LEGAL_STAFF.includes(role);
}

export function isDirector(role: RoleKey): boolean {
  return ROLE_GROUPS.DIRECTORS.includes(role);
}

export function isAdmin(role: RoleKey): boolean {
  return ROLE_GROUPS.ADMIN_STAFF.includes(role);
}

export function isStaff(role: RoleKey): boolean {
  return ROLE_GROUPS.ALL_STAFF.includes(role);
}

// Session helper
export function getUserFromToken(authHeader: string | null): TokenPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}
