#!/usr/bin/env node
// End-to-end smoke test for sub-phase 1.4 wrap-up.
//
// Exercises the 6 steps from the kickoff. Each step is a discrete
// section that can fail independently; the runner prints PASS/FAIL
// per step and exits 1 if anything fails. The dev server must already
// be running on $BASE_URL (default http://localhost:3000).
//
// Where the live arcjet authLimiter (5 req / 15min per IP) would
// otherwise block the runner mid-burst, we substitute a Prisma DB
// write to simulate the protected state and then exercise the
// downstream UI wire-up. Step 4 (5-fail lockout) is the canonical
// example — the lockout MECHANISM (incrementing failedLoginAttempts
// and writing lockedUntil) lives in src/lib/auth.ts and is verified
// independently by inspection; this smoke tests the UI wire-up that
// CONSUMES lockedUntil to redirect to /account-locked.
//
// Step 5 (Google OAuth) cannot complete an interactive Google flow
// from a headless browser. We verify the button click kicks off the
// expected /api/auth/signin/google call and stop there.

import { chromium, devices } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config as loadEnv } from 'dotenv'

// Load .env.local so DATABASE_URL is available outside the Next runtime.
loadEnv({ path: '.env.local' })

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE = devices['iPhone 14']
const RUN_ID = Date.now()
const TEST_EMAIL = `smoke-${RUN_ID}@mindset-test.local`
const TEST_NAME = 'Smoke User'
const TEST_PASSWORD = 'SmokePass2026!!'
const NEW_PASSWORD = 'SmokeReset2026##'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const results = []
function record(step, passed, notes = '') {
  results.push({ step, passed, notes })
  const tag = passed ? 'PASS' : 'FAIL'
  console.log(`[${tag}] ${step}${notes ? ` — ${notes}` : ''}`)
}

async function expectUrl(page, predicate, descr, timeoutMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (predicate(page.url())) return true
    await page.waitForTimeout(150)
  }
  throw new Error(`Timed out waiting for ${descr}; ended at ${page.url()}`)
}

async function resetSession(page) {
  // Clear next-auth cookies between steps but keep mindset_onboarded so
  // /user doesn't bounce to /onboarding for our fresh test user.
  await page.context().clearCookies()
  await page.context().addCookies([
    {
      name: 'mindset_onboarded',
      value: '1',
      url: BASE_URL,
      sameSite: 'Lax',
    },
  ])
}

async function cleanupTestUser() {
  const u = await prisma.user.findUnique({ where: { email: TEST_EMAIL.toLowerCase() } })
  if (!u) return
  await prisma.emailVerificationToken.deleteMany({ where: { userId: u.id } })
  await prisma.passwordResetToken.deleteMany({ where: { userId: u.id } })
  await prisma.user.delete({ where: { id: u.id } })
}

async function step1_signup(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' })
  await page.fill('input[name="name"]', TEST_NAME)
  await page.click('button:has-text("Next")')
  await page.waitForTimeout(400)
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.fill('input[name="confirmPassword"]', TEST_PASSWORD)
  await page.locator('input[type="checkbox"]').check()
  await page.click('button[type="submit"]')
  await expectUrl(page, (u) => u.includes('/verify-email?sent=1'), '/verify-email?sent=1', 30_000)

  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL.toLowerCase() },
    include: { emailVerificationTokens: { take: 1, orderBy: { createdAt: 'desc' } } },
  })
  if (!user) throw new Error('user not in DB after signup')
  if (!user.emailVerificationTokens[0]) throw new Error('EmailVerificationToken not stored')
  if (user.emailVerified) throw new Error('user.emailVerified set prematurely')
  record(
    '1. Signup → /verify-email?sent=1',
    true,
    `user=${user.id.slice(0, 8)} token=${user.emailVerificationTokens[0].token.slice(0, 8)}…`
  )
  return user.emailVerificationTokens[0].token
}

async function step2_verifyAndSignIn(page, verificationToken) {
  await page.goto(`${BASE_URL}/verify-email?token=${verificationToken}`, {
    waitUntil: 'domcontentloaded',
  })
  // Success state has "Your email is verified" headline. Both variants
  // (mobile h1, desktop h2) render this string; .first() avoids strict-
  // mode violations on the duplicate match.
  const success = await page
    .getByText(/your email is verified/i)
    .first()
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (!success) {
    console.error('  ! step2 fail debug — url:', page.url())
    console.error('  ! step2 fail debug — title:', await page.title())
    throw new Error('verify-email success text not visible')
  }
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL.toLowerCase() } })
  if (!user?.emailVerified) throw new Error('user.emailVerified not set after token POST')

  // Sign in with the original password and assert /user. Both variants
  // are mounted in the React tree — scope every selector to the visible
  // one so we don't submit a partially-filled hidden form.
  await resetSession(page)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="email"]:visible').first().fill(TEST_EMAIL)
  await page.locator('input[name="password"]:visible').first().fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]:visible').first().click()
  await expectUrl(page, (u) => u.includes('/user'), '/user after signin', 15_000)
  record('2. Verify link → sign in → /user', true, `landed=${new URL(page.url()).pathname}`)
}

async function step3_forgotReset(page) {
  await resetSession(page)
  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' })
  // Both mobile and desktop variants render their own form (only one
  // visible at any viewport). Scope to the visible one.
  await page.locator('input[type="email"]:visible').first().fill(TEST_EMAIL)
  // Wait for the response so we know the POST landed before we hit DB.
  const respP = page.waitForResponse(
    (r) => r.url().includes('/api/auth/forgot-password') && r.request().method() === 'POST',
    { timeout: 15_000 }
  )
  await page.locator('button[type="submit"]:visible').first().click()
  const resp = await respP
  if (resp.status() === 429) throw new Error('forgot-password POST 429 — arcjet rate limit hit')
  if (!resp.ok()) throw new Error(`forgot-password POST returned ${resp.status()}`)
  await page.waitForTimeout(500)

  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL.toLowerCase() },
    include: { passwordResetTokens: { take: 1, orderBy: { createdAt: 'desc' } } },
  })
  const resetToken = user?.passwordResetTokens?.[0]?.token
  if (!resetToken) throw new Error('PasswordResetToken not stored after /forgot-password')

  await page.goto(`${BASE_URL}/reset-password?token=${resetToken}`, {
    waitUntil: 'domcontentloaded',
  })
  // The page does a client-side GET to validate the token then renders
  // the form. Wait directly for a visible password input — the React
  // useEffect will have fired by the time the field appears.
  const visiblePasswords = page.locator('input[type="password"]:visible')
  await visiblePasswords.nth(0).waitFor({ timeout: 20_000 })
  await visiblePasswords.nth(0).fill(NEW_PASSWORD)
  await visiblePasswords.nth(1).fill(NEW_PASSWORD)
  // Bars should hit Strong because length=16, all 4 classes (Sm, mk, 2, ##)
  await page.waitForTimeout(400)
  await page.locator('button[type="submit"]:visible').first().click()

  // Auto-signin lands on /user.
  await expectUrl(page, (u) => u.includes('/user') && !u.includes('reset-password'), '/user after reset', 20_000)
  record('3. Forgot → reset → auto-signin → /user', true, `token=${resetToken.slice(0, 8)}…`)
}

async function step4_lockoutWireup(page) {
  // Live 5-fail burst. The dev server is started with ARCJET_KEY=""
  // (fail-open) for this smoke run so we can exercise the actual
  // failedLoginAttempts increment + lockedUntil write in src/lib/auth.ts
  // rather than seeding it. Production-mode arcjet would interleave 429s.
  await resetSession(page)
  await prisma.user.update({
    where: { email: TEST_EMAIL.toLowerCase() },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  for (let i = 1; i <= 5; i++) {
    await page.locator('input[name="email"]:visible').first().fill(TEST_EMAIL)
    await page.locator('input[name="password"]:visible').first().fill(`wrong-${i}`)
    const credP = page.waitForResponse(
      (r) => r.url().includes('/api/auth/callback/credentials'),
      { timeout: 15_000 }
    )
    await page.locator('button[type="submit"]:visible').first().click()
    await credP
    // Wait for the form to settle (inline error or redirect) before
    // pumping the next attempt.
    await page.waitForTimeout(500)
  }
  await expectUrl(
    page,
    (u) => u.includes('/account-locked') && u.includes('until='),
    '/account-locked?until=… after 5 failures',
    15_000
  )
  const lockedUser = await prisma.user.findUnique({
    where: { email: TEST_EMAIL.toLowerCase() },
    select: { lockedUntil: true, failedLoginAttempts: true },
  })
  if (!lockedUser?.lockedUntil || lockedUser.lockedUntil <= new Date()) {
    throw new Error('user.lockedUntil not set after 5 failed attempts')
  }

  // Verify the unlock affordance fires after countdown expires by
  // clearing lockedUntil + visiting with a past `until`.
  await prisma.user.update({
    where: { email: TEST_EMAIL.toLowerCase() },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  })
  const pastUntil = new Date(Date.now() - 30_000).toISOString()
  await page.goto(`${BASE_URL}/account-locked?until=${encodeURIComponent(pastUntil)}`, {
    waitUntil: 'domcontentloaded',
  })
  const signInNow = await page
    .getByRole('link', { name: /sign in now/i })
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false)
  if (!signInNow) throw new Error('unlocked affordance "Sign in now" not visible')
  await page.getByRole('link', { name: /sign in now/i }).click()
  await expectUrl(page, (u) => u.endsWith('/login') || u.includes('/login?'), '/login from unlocked CTA', 8000)

  // Final assertion: the new password from step 3 still works.
  await page.locator('input[name="email"]:visible').first().fill(TEST_EMAIL)
  await page.locator('input[name="password"]:visible').first().fill(NEW_PASSWORD)
  await page.locator('button[type="submit"]:visible').first().click()
  await expectUrl(page, (u) => u.includes('/user') && !u.includes('locked'), '/user after unlock', 15_000)
  record(
    '4. Fail 5x → /account-locked → unlocked → sign in → /user',
    true,
    'live 5-fail burst (dev server run with ARCJET_KEY="" — fail-open)'
  )
}

async function step5_googleOauthButton(page) {
  // We don't drive a real Google round-trip from a headless browser.
  // Verify the "Continue with Google" button kicks off the expected
  // signIn redirect chain. Stop once we leave the app.
  await resetSession(page)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  // Give the client-side hydration time to mount the button — without
  // this the button selector races the React render.
  await page.waitForLoadState('load')

  // The mobile + desktop variants both render a GoogleButton, so the
  // role-based locator matches twice. Scope to the visible one.
  const button = page.getByRole('button', { name: /continue with google/i }).first()
  await button.waitFor({ timeout: 8000 }).catch(() => {})
  if ((await button.count()) === 0) {
    console.error('  ! step5 fail debug — url:', page.url())
    throw new Error('"Continue with Google" button not rendered')
  }
  // Pre-arm a request promise. The button calls signIn('google') which
  // POSTs to /api/auth/signin/google then 302s to accounts.google.com.
  const reqP = page.waitForRequest((req) =>
    req.url().includes('/api/auth/signin/google') || req.url().includes('accounts.google.com'),
    { timeout: 8000 }
  )
  await button.click().catch(() => {})
  await reqP
  record(
    '5. Google OAuth (signIn() kicked off)',
    true,
    'interactive Google flow not driven from CI; signIn(provider) request observed'
  )
}

async function step6_callbackUrl(page) {
  await resetSession(page)
  await page.goto(`${BASE_URL}/login?callbackUrl=/user/practice`, {
    waitUntil: 'domcontentloaded',
  })
  await page.locator('input[name="email"]:visible').first().fill(TEST_EMAIL)
  await page.locator('input[name="password"]:visible').first().fill(NEW_PASSWORD)
  const credP = page.waitForResponse(
    (r) => r.url().includes('/api/auth/callback/credentials'),
    { timeout: 15_000 }
  )
  await page.locator('button[type="submit"]:visible').first().click()
  const cred = await credP
  if (!cred.ok()) throw new Error(`credentials POST ${cred.status()} during callbackUrl step`)
  // Match the PATHNAME, not a substring — /login?callbackUrl=%2Fuser%2Fpractice
  // would otherwise satisfy `u.includes('/user/practice')` falsely.
  await expectUrl(
    page,
    (u) => new URL(u).pathname === '/user/practice',
    '/user/practice (pathname match)',
    20_000
  )
  record('6. callbackUrl=/user/practice preserved', true, `landed=${new URL(page.url()).pathname}`)
}

async function main() {
  console.log(`smoke run ${RUN_ID} — ${TEST_EMAIL}`)
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    ...DEVICE,
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
  // Skip the first-time onboarding gate (/user → /onboarding redirect)
  // so /user is reachable directly. The gate is documented in
  // src/app/(dashboard)/user/page.tsx and is out of scope for the auth
  // funnel smoke. This is a session cookie; clearCookies() between steps
  // wipes it so we re-add via addCookies before sign-in flows.
  await ctx.addCookies([
    {
      name: 'mindset_onboarded',
      value: '1',
      url: BASE_URL,
      sameSite: 'Lax',
    },
  ])
  const page = await ctx.newPage()

  try {
    const verifyTok = await step1_signup(page)
    await step2_verifyAndSignIn(page, verifyTok)
    await step3_forgotReset(page)
    await step4_lockoutWireup(page)
    await step5_googleOauthButton(page)
    await step6_callbackUrl(page)
  } catch (err) {
    console.error('SMOKE FAILED:', err.message)
    record('runtime-error', false, err.message)
  } finally {
    await ctx.close()
    await browser.close()
    // Always clean up the test user, even on failure.
    await cleanupTestUser().catch((e) =>
      console.error('cleanup failed:', e.message)
    )
    await prisma.$disconnect()
  }

  console.log('\n=== RESULTS ===')
  for (const r of results) {
    console.log(`  ${r.passed ? '✓' : '✗'}  ${r.step}${r.notes ? ` — ${r.notes}` : ''}`)
  }
  const failed = results.filter((r) => !r.passed)
  process.exit(failed.length === 0 ? 0 : 1)
}

main()
