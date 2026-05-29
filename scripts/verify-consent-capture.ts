// Smoke-time verification for the consent-capture sprint.
//
// Run AFTER Suryansh has completed a fresh test signup in the UI:
//   set -a && source .env.local && set +a && npx tsx scripts/verify-consent-capture.ts
//
// Prints the most-recently-created User's consent fields and any
// CONSENT_GRANTED AuthEvent rows from the last hour, so we can confirm
// the route persisted them. Read-only — does not mutate anything.

import { prisma } from '@/lib/prisma'

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      createdAt: true,
      consentedAt: true,
      consentVersion: true,
      consentIpAddress: true,
      consentUserAgent: true,
      marketingConsent: true,
      marketingConsentAt: true,
    },
  })

  console.log('=== Latest user ===')
  console.log(JSON.stringify(user, null, 2))

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const events = await prisma.authEvent.findMany({
    where: { kind: 'CONSENT_GRANTED', createdAt: { gte: oneHourAgo } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      userId: true,
      kind: true,
      ip: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
    },
  })

  console.log('\n=== Recent CONSENT_GRANTED events (last hour) ===')
  console.log(JSON.stringify(events, null, 2))

  // Quick pass/fail summary so the smoke driver sees a clear signal.
  const pass =
    !!user?.consentedAt &&
    !!user?.consentVersion &&
    events.length > 0 &&
    events.some((e) => e.userId === user?.id)

  console.log(`\n=== Result: ${pass ? 'PASS' : 'FAIL'} ===`)
  if (!pass) process.exitCode = 2

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
