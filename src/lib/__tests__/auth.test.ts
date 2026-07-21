/**
 * Unit tests for src/lib/auth.ts (RBAC + password validation)
 * Covers: hasPermission, hasAnyPermission, hasAllPermissions, isRoleAtLeast,
 * canManageRole, role-group predicates, validatePasswordStrength.
 */
import { test, expect, describe } from 'bun:test';
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleAtLeast,
  canManageRole,
  isLegalStaff,
  isDirector,
  isAdmin,
  isStaff,
  validatePasswordStrength,
  type RoleKey,
} from '@/lib/auth';

describe('auth: ROLES tier ordering', () => {
  test('managing_director is the highest tier', () => {
    const mdTier = ROLES.managing_director.tier;
    for (const key of Object.keys(ROLES) as RoleKey[]) {
      if (key === 'managing_director') continue;
      expect(ROLES[key].tier).toBeLessThanOrEqual(mdTier);
    }
  });

  test('guest is the lowest tier', () => {
    const gTier = ROLES.guest.tier;
    for (const key of Object.keys(ROLES) as RoleKey[]) {
      if (key === 'guest') continue;
      expect(ROLES[key].tier).toBeGreaterThanOrEqual(gTier);
    }
  });

  test('client sits above guest but below every staff role', () => {
    expect(ROLES.client.tier).toBeGreaterThan(ROLES.guest.tier);
    for (const staffRole of [
      'receptionist',
      'office_administrator',
      'paralegal',
      'attorney',
      'admin',
      'managing_director',
    ] as RoleKey[]) {
      expect(ROLES.client.tier).toBeLessThan(ROLES[staffRole].tier);
    }
  });
});

describe('auth: hasPermission (RBAC matrix)', () => {
  test('managing_director has every permission', () => {
    for (const p of Object.values(PERMISSIONS)) {
      expect(hasPermission('managing_director', p)).toBe(true);
    }
  });

  test('guest has no permissions', () => {
    for (const p of Object.values(PERMISSIONS)) {
      expect(hasPermission('guest', p)).toBe(false);
    }
  });

  test('client can view own cases and documents but not others\'', () => {
    expect(hasPermission('client', PERMISSIONS.VIEW_OWN_CASES)).toBe(true);
    expect(hasPermission('client', PERMISSIONS.VIEW_DOCUMENTS)).toBe(true);
    expect(hasPermission('client', PERMISSIONS.VIEW_ALL_CASES)).toBe(false);
    expect(hasPermission('client', PERMISSIONS.CREATE_CASE)).toBe(false);
    expect(hasPermission('client', PERMISSIONS.MANAGE_USERS)).toBe(false);
  });

  test('attorney can create and edit cases but not delete them', () => {
    expect(hasPermission('attorney', PERMISSIONS.CREATE_CASE)).toBe(true);
    expect(hasPermission('attorney', PERMISSIONS.EDIT_CASE)).toBe(true);
    expect(hasPermission('attorney', PERMISSIONS.DELETE_CASE)).toBe(false);
  });

  test('systems_admin can delete cases and run backups', () => {
    expect(hasPermission('systems_admin', PERMISSIONS.DELETE_CASE)).toBe(true);
    expect(hasPermission('systems_admin', PERMISSIONS.RUN_BACKUPS)).toBe(true);
    expect(hasPermission('systems_admin', PERMISSIONS.MANAGE_SYSTEM)).toBe(true);
  });

  test('returns false for an unknown role', () => {
    expect(hasPermission('nonexistent' as RoleKey, PERMISSIONS.VIEW_OWN_CASES)).toBe(false);
  });
});

describe('auth: hasAnyPermission / hasAllPermissions', () => {
  test('hasAnyPermission is true if at least one permission is held', () => {
    expect(hasAnyPermission('client', [PERMISSIONS.CREATE_CASE, PERMISSIONS.VIEW_OWN_CASES])).toBe(true);
    expect(hasAnyPermission('client', [PERMISSIONS.CREATE_CASE, PERMISSIONS.DELETE_CASE])).toBe(false);
  });

  test('hasAllPermissions is true only when every permission is held', () => {
    expect(hasAllPermissions('attorney', [PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.EDIT_CASE])).toBe(true);
    expect(hasAllPermissions('attorney', [PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.DELETE_CASE])).toBe(false);
  });

  test('empty permission list: any=true, all=true (vacuous truth)', () => {
    expect(hasAnyPermission('guest', [])).toBe(false);
    expect(hasAllPermissions('guest', [])).toBe(true);
  });
});

describe('auth: isRoleAtLeast / canManageRole', () => {
  test('isRoleAtLeast: admin is at least receptionist, paralegal, client', () => {
    expect(isRoleAtLeast('admin', 'receptionist')).toBe(true);
    expect(isRoleAtLeast('admin', 'paralegal')).toBe(true);
    expect(isRoleAtLeast('admin', 'client')).toBe(true);
  });

  test('isRoleAtLeast: paralegal is NOT at least attorney', () => {
    expect(isRoleAtLeast('paralegal', 'attorney')).toBe(false);
  });

  test('isRoleAtLeast: a role is at least itself', () => {
    expect(isRoleAtLeast('attorney', 'attorney')).toBe(true);
    expect(isRoleAtLeast('managing_director', 'managing_director')).toBe(true);
  });

  test('canManageRole: MD can manage every other role', () => {
    for (const r of Object.keys(ROLES) as RoleKey[]) {
      if (r === 'managing_director') continue;
      expect(canManageRole('managing_director', r)).toBe(true);
    }
  });

  test('canManageRole: nobody can manage an equal-tier role', () => {
    expect(canManageRole('attorney', 'attorney')).toBe(false);
    expect(canManageRole('admin', 'admin')).toBe(false);
  });

  test('canManageRole: paralegal cannot manage attorney (lower tier)', () => {
    expect(canManageRole('paralegal', 'attorney')).toBe(false);
    expect(canManageRole('attorney', 'paralegal')).toBe(true);
  });
});

describe('auth: role-group predicates', () => {
  test('isLegalStaff identifies attorneys, associates, paralegals, candidate attorneys', () => {
    expect(isLegalStaff('attorney')).toBe(true);
    expect(isLegalStaff('associate')).toBe(true);
    expect(isLegalStaff('paralegal')).toBe(true);
    expect(isLegalStaff('candidate_attorney')).toBe(true);
    expect(isLegalStaff('legal_officer')).toBe(false); // officer, not "legal staff" group
    expect(isLegalStaff('client')).toBe(false);
  });

  test('isDirector identifies MD and senior partner only', () => {
    expect(isDirector('managing_director')).toBe(true);
    expect(isDirector('senior_partner')).toBe(true);
    expect(isDirector('admin')).toBe(false);
    expect(isDirector('attorney')).toBe(false);
  });

  test('isAdmin identifies MD, senior partner, systems admin, admin', () => {
    expect(isAdmin('managing_director')).toBe(true);
    expect(isAdmin('senior_partner')).toBe(true);
    expect(isAdmin('systems_admin')).toBe(true);
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('attorney')).toBe(false);
    expect(isAdmin('receptionist')).toBe(false);
  });

  test('isStaff is true for every staff role and false for client/guest', () => {
    expect(isStaff('receptionist')).toBe(true);
    expect(isStaff('attorney')).toBe(true);
    expect(isStaff('managing_director')).toBe(true);
    expect(isStaff('client')).toBe(false);
    expect(isStaff('guest')).toBe(false);
  });
});

describe('auth: validatePasswordStrength', () => {
  test('accepts a strong password', () => {
    const r = validatePasswordStrength('Str0ng!Pass');
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test('rejects password shorter than 8 chars', () => {
    const r = validatePasswordStrength('Ab1!xyz');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('at least 8 characters'))).toBe(true);
  });

  test('requires an uppercase letter', () => {
    const r = validatePasswordStrength('lowercase1!');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('uppercase'))).toBe(true);
  });

  test('requires a lowercase letter', () => {
    const r = validatePasswordStrength('UPPERCASE1!');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('lowercase'))).toBe(true);
  });

  test('requires a digit', () => {
    const r = validatePasswordStrength('NoDigitsHere!');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('number'))).toBe(true);
  });

  test('requires a special character', () => {
    const r = validatePasswordStrength('NoSpecial1');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('special character'))).toBe(true);
  });

  test('accumulates ALL errors, not just the first', () => {
    const r = validatePasswordStrength('a');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(4); // length, upper, digit, special
  });
});
