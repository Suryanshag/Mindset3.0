#!/usr/bin/env node
// One-shot smoke that drives signup + forgot-password to send three
// real emails to a real inbox so the owner can verify deliverability,
// FROM address, and link behavior.
//
// EMAIL is taken from the EMAIL env var. The script:
//   1. Registers a fresh user at the given address (Welcome +
//      Verification emails)
//   2. Submits /forgot-password for the same email (Reset email)
//   3. Cleans up the DB row after the user confirms
//
// Cleanup is NOT done automatically — the owner needs the user to
// still exist so the verification + reset links resolve. After the
// owner confirms the 3 emails arrived, they run:
//   node scripts/real-mailbox-smoke.mjs --cleanup <email>

import { chromium, devices } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const TEST_EMAIL = process.env.EMAIL ?? null
const NAME = process.env.NAME ?? 'Mindset Owner Test'
const PASSWORD = 'PhaseOneSmoke2026!!'

const args = process.argv.slice(2)
const cleanupMode = args[0] === '--cleanup'
const cleanupEmail = cleanupMode ? args[1] : null

if (!TEST_EMAIL && !cleanupMode) {
  console.error('Set EMAIL env var to the recipient address. Example:')
  console.error('  EMAIL=choudharysuryansh1111@gmail.com node scripts/real-mailbox-smoke.mjs')
  process.exit(2)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function cleanup(email) {
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!u) {
    console.log(`no user with email ${email} — nothing to clean`)
    return
  }
  await prisma.emailVerificationToken.deleteMany({ where: { userId: u.id } })
  await prisma.passwordResetToken.deleteMany({ where: { userId: u.id } })
  await prisma.user.delete({ where: { id: u.id } })
  console.log(`✓ cleaned up user ${u.id} (${email})`)
}

async function main() {
  if (cleanupMode) {
    if (!cleanupEmail) {
      console.error('Usage: node scripts/real-mailbox-smoke.mjs --cleanup <email>')
      process.exit(2)
    }
    await cleanup(cleanupEmail)
    await prisma.$disconnect()
    return
  }

  console.log(`real-mailbox smoke → ${TEST_EMAIL}`)

  // Sanity: if a previous run left a user with this address, refuse
  // and ask for cleanup first so we don't double-send.
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL.toLowerCase() } })
  if (existing) {
    console.error(
      `! user ${TEST_EMAIL} already exists in DB (id=${existing.id}). ` +
        'Run with --cleanup first:'
    )
    console.error(`  node scripts/real-mailbox-smoke.mjs --cleanup ${TEST_EMAIL}`)
    process.exit(3)
  }

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    serviceWorkers: 'block',
  })
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'mindset_cookie_consent_v1',
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: false,
          consentedAt: new Date().toISOString(),
          version: 1,
        })
      )
    } catch {}
  })
  const page = await ctx.newPage()

  // ── 1. Signup → triggers Welcome + Verification emails ───────────
  console.log('1/3 — registering (triggers Welcome + Verification emails)')
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="name"]:visible').first().fill(NAME)
  await page.locator('button:has-text("Next"):visible').first().click()
  await page.waitForTimeout(500)
  await page.locator('input[name="email"]:visible').first().fill(TEST_EMAIL)
  await page.locator('input[name="password"]:visible').first().fill(PASSWORD)
  await page.locator('input[name="confirmPassword"]:visible').first().fill(PASSWORD)
  await page.locator('input[type="checkbox"]:visible').first().check()
  await page.locator('button[type="submit"]:visible').first().click()
  // Wait for the post-signup redirect so we know the API call landed.
  await page.waitForURL('**/verify-email?sent=1', { timeout: 30_000 })
  console.log('   ✓ Welcome + Verification sent — check your inbox now')

  // Give Resend a beat so the verification email's send completes
  // before we trigger the reset send (Resend can throttle bursts).
  await page.waitForTimeout(3_000)

  // ── 2. Forgot password → triggers Reset email ────────────────────
  console.log('2/3 — submitting /forgot-password (triggers Reset email)')
  await ctx.clearCookies()
  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' })
  await page.locator('input[type="email"]:visible').first().fill(TEST_EMAIL)
  await page.locator('button[type="submit"]:visible').first().click()
  await page.waitForTimeout(3_000)
  console.log('   ✓ Reset email send fired')

  // ── 3. Confirm the DB rows exist (so the email links will work) ──
  console.log('3/3 — verifying DB rows exist for the email links')
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL.toLowerCase() },
    include: {
      emailVerificationTokens: { take: 1, orderBy: { createdAt: 'desc' } },
      passwordResetTokens: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!user) {
    console.error('   ✗ user not in DB — signup must have failed')
    process.exit(4)
  }
  const vTok = user.emailVerificationTokens[0]?.token
  const rTok = user.passwordResetTokens[0]?.token
  if (!vTok) console.error('   ✗ EmailVerificationToken row missing')
  if (!rTok) console.error('   ✗ PasswordResetToken row missing')
  if (vTok && rTok) {
    console.log(`   ✓ verification token ${vTok.slice(0, 8)}… (24h expiry)`)
    console.log(`   ✓ reset token ${rTok.slice(0, 8)}… (15min expiry)`)
  }

  await ctx.close()
  await browser.close()
  await prisma.$disconnect()

  console.log('')
  console.log('Done. Check your inbox for 3 emails:')
  console.log('  1. Welcome')
  console.log('  2. Verification — link valid 24h')
  console.log('  3. Password reset — link valid 15 minutes (act soon!)')
  console.log('')
  console.log(`After you've finished, clean up the test user:`)
  console.log(`  node scripts/real-mailbox-smoke.mjs --cleanup ${TEST_EMAIL}`)
}

main().catch(async (err) => {
  console.error('SMOKE FAILED:', err.message)
  await prisma.$disconnect().catch(() => {})
  process.exit(1)
})
