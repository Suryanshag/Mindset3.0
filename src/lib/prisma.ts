// TODO(follow-up): introduce txn() helper to make maxWait/timeout default
// — until then, every prisma.$transaction call must pass { maxWait: 8000, timeout: 15000 }

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless: keep the pool tight so a single function instance
    // doesn't hold open too many Neon connections while the rest of
    // the app fans out across instances.
    max: 5,
    // Reuse warm connections for a minute before letting them close —
    // matches the cron/idle cadence of a dashboard session.
    idleTimeoutMillis: 60_000,
    // Fail fast on a stuck connection acquisition rather than letting
    // a request hang.
    connectionTimeoutMillis: 5_000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
