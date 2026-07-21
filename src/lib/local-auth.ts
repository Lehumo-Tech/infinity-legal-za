/**
 * Infinity Legal ZA - Local Authentication Utility
 *
 * Provides password hashing, JWT token generation/validation,
 * and local auth functions using Prisma/SQLite as a fallback
 * when Supabase is unreachable.
 *
 * Uses bcryptjs for password hashing and crypto for JWT (HMAC-SHA256).
 * Works with the existing Prisma User model in the SQLite schema.
 */

import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

// ============================================
// JWT HELPERS
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'dev-only-jwt-secret-key-32ch!';
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const JWT_ISSUER = 'infinity-legal-za';

export interface JWTPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  iat: number;       // issued at
  exp: number;       // expiry
  iss: string;       // issuer
}

/**
 * Generate a JWT token using HMAC-SHA256.
 * We implement our own JWT instead of using jsonwebtoken library
 * to avoid extra dependencies and keep it simple.
 */
export function generateToken(payload: { userId: string; email: string; role: string }): string {
  const now = Math.floor(Date.now() / 1000);

  const jwtPayload: JWTPayload = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
    iss: JWT_ISSUER,
  };

  // Base64URL encode header and payload
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(jwtPayload));

  // Sign with HMAC-SHA256
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Validate a JWT token and return the payload.
 * Returns null if the token is invalid, expired, or malformed.
 */
export function validateToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    // Timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(body));

    // Check issuer
    if (payload.iss !== JWT_ISSUER) return null;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// ============================================
// PASSWORD HELPERS
// ============================================

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// LOCAL AUTH OPERATIONS
// ============================================

export interface LocalAuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  email_verified: boolean;
  popi_consent: boolean;
}

/**
 * Find a user by email in the local database.
 */
export async function findLocalUser(email: string): Promise<LocalAuthUser | null> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      email_verified: user.email_verified,
      popi_consent: user.popi_consent,
    };
  } catch (error) {
    console.error('[LocalAuth] Failed to find user:', error);
    return null;
  }
}

/**
 * Authenticate a user with email and password using local database.
 * Returns the user and a JWT token, or null if authentication fails.
 */
export async function authenticateLocalUser(
  email: string,
  password: string
): Promise<{ user: LocalAuthUser; token: string } | null> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return null;
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return null;
    }

    // Deactivated users cannot log in (e.g. dismissed staff). Return null to avoid
    // revealing account status — the login route returns a generic 401 either way.
    if (user.is_active === false) {
      return null;
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const authUser: LocalAuthUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      email_verified: user.email_verified,
      popi_consent: user.popi_consent,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: authUser, token };
  } catch (error) {
    console.error('[LocalAuth] Authentication failed:', error);
    return null;
  }
}

/**
 * Create a new local user account.
 * Returns the user and a JWT token, or an error message.
 */
export async function createLocalUser(params: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
}): Promise<{ user: LocalAuthUser; token: string } | { error: string }> {
  try {
    const email = params.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: 'An account with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(params.password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: passwordHash,
        full_name: params.full_name,
        phone: params.phone || null,
        role: params.role || 'client',
        email_verified: true, // Auto-confirm for local auth
        popi_consent: true,
        is_active: true,
      },
    });

    const authUser: LocalAuthUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      email_verified: user.email_verified,
      popi_consent: user.popi_consent,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: authUser, token };
  } catch (error: any) {
    console.error('[LocalAuth] User creation failed:', error);
    if (error?.code === 'P2002') {
      return { error: 'An account with this email already exists' };
    }
    return { error: 'Failed to create account' };
  }
}

/**
 * Confirm a user's email in the local database.
 */
export async function confirmLocalEmail(identifier: { userId?: string; email?: string }): Promise<boolean> {
  try {
    let user;
    if (identifier.userId) {
      user = await db.user.findUnique({ where: { id: identifier.userId } });
    } else if (identifier.email) {
      user = await db.user.findUnique({ where: { email: identifier.email.toLowerCase().trim() } });
    }

    if (!user) return true; // Don't reveal whether user exists

    await db.user.update({
      where: { id: user.id },
      data: { email_verified: true },
    });

    return true;
  } catch (error) {
    console.error('[LocalAuth] Email confirmation failed:', error);
    return true; // Don't reveal errors
  }
}

/**
 * Validate a JWT token and return user info from local DB.
 * Used by the middleware to authenticate requests with local JWT tokens.
 */
export async function validateLocalToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  const payload = validateToken(token);
  if (!payload) return null;

  // Verify user still exists in local DB
  try {
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) return null;

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Check if Supabase is reachable by attempting a lightweight request.
 * Returns true if Supabase is reachable, false otherwise.
 */
export async function isSupabaseReachable(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

// ============================================
// UTILITY: Base64URL encoding/decoding
// ============================================

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}
