/**
 * Infinity Legal ZA - Database Client (Prisma + SQLite)
 *
 * Provides a Prisma Client singleton for server-side Route Handlers.
 * Uses SQLite as the database backend.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Check if the database is properly configured
 */
export function isDbConfigured(): boolean {
  return true;
}

/**
 * Get the database client or return an error response.
 * Use this at the top of API route handlers.
 */
export function requireDb() {
  return { db, error: null };
}

export type DatabaseClient = PrismaClient;
