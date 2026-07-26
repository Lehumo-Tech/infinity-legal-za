/**
 * Infinity Legal ZA - Database Client (Prisma + Neon Postgres)
 *
 * Provides a Prisma Client singleton for server-side Route Handlers.
 * Uses Neon serverless Postgres via the pooler (PgBouncer) endpoint.
 * preparedStatements=false is REQUIRED for PgBouncer transaction mode.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  // Neon pooler (PgBouncer) runs in transaction mode, which does NOT support
  // prepared statements. Disabling them prevents "prepared statement does not exist"
  // errors and the cascading "connection Closed" errors that crashed the dev server.
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Hard-reconnect safety: if the client disconnects (Neon idle reaping),
// clear the singleton so the next request creates a fresh client.
db.$on('error' as never, () => {
  globalForPrisma.prisma = undefined;
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Check if the database is properly configured
 */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');
}

/**
 * Get the database client or return an error response.
 * Use this at the top of API route handlers.
 */
export function requireDb() {
  return { db, error: null };
}

export type DatabaseClient = PrismaClient;
