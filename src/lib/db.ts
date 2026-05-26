import { PrismaClient } from '@prisma/client'

// Fix: System-level DATABASE_URL may point to SQLite (file:...) which overrides .env
// Use POSTGRES_URL from .env to override it for the PostgreSQL connection
if (process.env.POSTGRES_URL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:'))) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
