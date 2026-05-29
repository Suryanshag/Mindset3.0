// Consent-capture smoke. Drives /register through Playwright in both
// desktop and mobile-viewport variants, then queries Prisma directly to
// confirm DB rows match expectations. Each test uses a unique email so
// repeated runs don't collide.
//
// Usage:
//   set -a && source .env.local && set +a && npx tsx scripts/smoke-consent-register.ts
//
// Assumes `next dev` is already running on http://localhost:3000.

import { chromium, type BrowserContext, type Page } from 'playwright'
import { prisma } from '@/lib/prisma'

const BASE = 'http://localhost:3000'
const PASSWORD = 'Reflect-Lake-Bright-42'

const runStamp = Date.now()
const createdEmails: string[] = []
const results: Array<{ label: string; pass: boolean; note?: string }> = []

function emailFor(slug: string) {
  return `consent-smoke-${runStamp}-${slug}@example.com`
}

async function fillDesktop(page: Page, email: string) {
  await page.locator('input#name').fill('Smoke User')
  await page.locator('input#email').fill(email)
  await page.locator('input#phone').fill('9876543210')
  await page.locator('input#password').fill(PASSWORD)
  await page.locator('input#confirmPassword').fill(PASSWORD)
}

async function fillMobileStep0(page: Page) {
  // MobileField generates id="mobile-field-your-name"
  await page.locator('input#mobile-field-your-name').fill('Smoke User')
  await page.getByRole('button', { name: /^next$/i }).click()
}

async function fillMobileStep1(page: Page, email: string) {
  await page.locator('input#mobile-field-email').fill(email)
  await page.locator('input#mobile-field-password').fill(PASSWORD)
  await page.locator('input#mobile-field-confirm-password').fill(PASSWORD)
  // Mobile + desktop forms both render and share input[name="phone"]; the
  // mobile one carries this generated id (paren is literal in the id).
  await page.locator('input[id="mobile-field-phone-(optional)"]').fill('9876543210')
}

async function fetchUser(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      consentedAt: true,
      consentVersion: true,
      consentIpAddress: true,
      consentUserAgent: true,
      marketingConsent: true,
      marketingConsentAt: true,
    },
  })
}

async function fetchConsentEvent(userId: string) {
  return prisma.authEvent.findFirst({
    where: { userId, kind: 'CONSENT_GRANTED' },
    orderBy: { createdAt: 'desc' },
    select: { kind: true, ip: true, userAgent: true, metadata: true, createdAt: true },
  })
}

function record(label: string, pass: boolean, note?: string) {
  results.push({ label, pass, note })
  console.log(`  ${pass ? '✅' : '❌'}  ${label}${note ? ` — ${note}` : ''}`)
}

// Wait for either /api/auth/register completion OR a URL transition off
// /register. Returns the API status if seen, or null if only navigation.
async function clickSubmitAndWait(page: Page, buttonLabel: RegExp): Promise<number | null> {
  const apiResponse = page
    .waitForResponse((r) => r.url().endsWith('/api/auth/register'), { timeout: 8000 })
    .catch(() => null)
  await page.getByRole('button', { name: buttonLabel }).click()
  const r = await apiResponse
  return r ? r.status() : null
}

// ── DESKTOP TESTS ──────────────────────────────────────────────────────

async function desktopTest1Block(ctx: BrowserContext) {
  console.log('\n=== Test 1: Desktop — unchecked privacy should block ===')
  const email = emailFor('d1')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#name', { timeout: 15000 })
  await fillDesktop(page, email)

  // DON'T check either checkbox. Click submit.
  let apiCalled = false
  page.on('request', (r) => {
    if (r.url().endsWith('/api/auth/register')) apiCalled = true
  })
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForTimeout(800) // let RHF render the error

  const stillOnRegister = page.url().includes('/register')
  const errorText = await page
    .getByText(/you must accept the privacy policy and terms of use/i)
    .first()
    .textContent()
    .catch(() => null)

  // Check DB: no user with this email
  await page.waitForTimeout(500)
  const user = await fetchUser(email)

  const pass = !apiCalled && stillOnRegister && !!errorText && !user
  record('Desktop unchecked: blocked + coral error + no API + no DB row', pass, [
    !apiCalled ? null : 'API was called',
    stillOnRegister ? null : 'navigated away',
    errorText ? null : 'error message not shown',
    !user ? null : 'user got created (BAD)',
  ].filter(Boolean).join('; ') || undefined)
  await page.close()
}

async function desktopTest2PrivacyOnly(ctx: BrowserContext) {
  console.log('\n=== Test 2: Desktop — privacy only, marketing=false ===')
  const email = emailFor('d2')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#name', { timeout: 15000 })
  await fillDesktop(page, email)
  await page.locator('input[type="checkbox"]').nth(0).check()

  const status = await clickSubmitAndWait(page, /create account/i)
  await page.waitForTimeout(1500)
  const user = await fetchUser(email)
  if (user) createdEmails.push(email)
  const event = user ? await fetchConsentEvent(user.id) : null

  const checks = {
    api201: status === 201,
    userExists: !!user,
    consentedAt: !!user?.consentedAt,
    versionOk: user?.consentVersion === '2026-05-30',
    ipPresent: !!user?.consentIpAddress,
    uaPresent: !!user?.consentUserAgent,
    marketingFalse: user?.marketingConsent === false,
    marketingAtNull: user?.marketingConsentAt === null,
    eventLogged: !!event,
    eventMeta:
      typeof event?.metadata === 'object' &&
      event?.metadata !== null &&
      (event.metadata as Record<string, unknown>).version === '2026-05-30' &&
      (event.metadata as Record<string, unknown>).marketingConsent === false,
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  record(
    'Desktop privacy-only: user + consent fields + event metadata',
    failed.length === 0,
    failed.length ? `failed: ${failed.join(', ')}` : `status=${status}`,
  )
  if (user) console.log('     User row:', JSON.stringify(user, null, 2))
  if (event) console.log('     CONSENT_GRANTED event:', JSON.stringify(event, null, 2))
  await page.close()
}

async function desktopTest3Both(ctx: BrowserContext) {
  console.log('\n=== Test 3: Desktop — both checked, marketing=true ===')
  const email = emailFor('d3')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#name', { timeout: 15000 })
  await fillDesktop(page, email)
  await page.locator('input[type="checkbox"]').nth(0).check()
  await page.locator('input[type="checkbox"]').nth(1).check()

  const status = await clickSubmitAndWait(page, /create account/i)
  await page.waitForTimeout(1500)
  const user = await fetchUser(email)
  if (user) createdEmails.push(email)
  const event = user ? await fetchConsentEvent(user.id) : null

  const checks = {
    api201: status === 201,
    userExists: !!user,
    marketingTrue: user?.marketingConsent === true,
    marketingAtSet: !!user?.marketingConsentAt,
    eventMeta:
      typeof event?.metadata === 'object' &&
      event?.metadata !== null &&
      (event.metadata as Record<string, unknown>).marketingConsent === true,
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  record(
    'Desktop both checked: user + marketingConsent=true + marketingConsentAt set',
    failed.length === 0,
    failed.length ? `failed: ${failed.join(', ')}` : `status=${status}`,
  )
  if (user) console.log('     User row:', JSON.stringify(user, null, 2))
  await page.close()
}

// ── MOBILE TESTS (iPhone 12 viewport) ─────────────────────────────────

async function mobileTest1Block(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  console.log('\n=== Test 4a: Mobile — unchecked privacy disables Create button ===')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const email = emailFor('m1')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#mobile-field-your-name', { timeout: 15000 })

  await fillMobileStep0(page)
  await fillMobileStep1(page, email)
  // Leave both checkboxes unchecked.

  const createBtn = page.getByRole('button', { name: /create account/i })
  await page.waitForTimeout(500) // let RHF settle
  const disabled = await createBtn.isDisabled()

  // Try to click anyway — should be no-op.
  let apiCalled = false
  page.on('request', (r) => {
    if (r.url().endsWith('/api/auth/register')) apiCalled = true
  })
  await createBtn.click({ force: true, trial: false }).catch(() => {})
  await page.waitForTimeout(800)

  const user = await fetchUser(email)
  const pass = disabled && !apiCalled && !user
  record('Mobile unchecked: button disabled + no API + no DB row', pass, [
    disabled ? null : 'button was enabled',
    !apiCalled ? null : 'API got called',
    !user ? null : 'user got created (BAD)',
  ].filter(Boolean).join('; ') || undefined)
  await page.close()
  await ctx.close()
}

async function mobileTest2PrivacyOnly(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  console.log('\n=== Test 4b: Mobile — privacy only, marketing=false ===')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const email = emailFor('m2')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#mobile-field-your-name', { timeout: 15000 })

  await fillMobileStep0(page)
  await fillMobileStep1(page, email)
  await page.locator('input[type="checkbox"]').nth(0).check()

  const status = await clickSubmitAndWait(page, /create account/i)
  await page.waitForTimeout(1500)
  const user = await fetchUser(email)
  if (user) createdEmails.push(email)
  const event = user ? await fetchConsentEvent(user.id) : null

  const checks = {
    api201: status === 201,
    userExists: !!user,
    marketingFalse: user?.marketingConsent === false,
    marketingAtNull: user?.marketingConsentAt === null,
    eventLogged: !!event,
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  record('Mobile privacy-only: user + marketingConsent=false + event', failed.length === 0,
    failed.length ? `failed: ${failed.join(', ')}` : `status=${status}`)
  await page.close()
  await ctx.close()
}

async function mobileTest3Both(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  console.log('\n=== Test 4c: Mobile — both checked, marketing=true ===')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const email = emailFor('m3')
  const page = await ctx.newPage()
  await page.goto(`${BASE}/register`)
  await page.waitForSelector('input#mobile-field-your-name', { timeout: 15000 })

  await fillMobileStep0(page)
  await fillMobileStep1(page, email)
  await page.locator('input[type="checkbox"]').nth(0).check()
  await page.locator('input[type="checkbox"]').nth(1).check()

  const status = await clickSubmitAndWait(page, /create account/i)
  await page.waitForTimeout(1500)
  const user = await fetchUser(email)
  if (user) createdEmails.push(email)

  const checks = {
    api201: status === 201,
    userExists: !!user,
    marketingTrue: user?.marketingConsent === true,
    marketingAtSet: !!user?.marketingConsentAt,
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  record('Mobile both checked: user + marketingConsent=true', failed.length === 0,
    failed.length ? `failed: ${failed.join(', ')}` : `status=${status}`)
  await page.close()
  await ctx.close()
}

async function main() {
  console.log(`Smoke run ${runStamp}`)
  console.log(`BASE=${BASE}\n`)

  const browser = await chromium.launch({ headless: true })

  try {
    // Each desktop test gets a fresh context (mimics fresh incognito).
    for (const t of [desktopTest1Block, desktopTest2PrivacyOnly, desktopTest3Both]) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      try { await t(ctx) } catch (err) {
        console.error(`  ❌ Exception in ${t.name}:`, err)
        record(t.name, false, `exception: ${(err as Error).message}`)
      } finally {
        await ctx.close()
      }
    }

    await mobileTest1Block(browser)
    await mobileTest2PrivacyOnly(browser)
    await mobileTest3Both(browser)
  } finally {
    await browser.close()
  }

  console.log('\n=== Summary ===')
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'}  ${r.label}${r.note ? `  (${r.note})` : ''}`)
  }
  const passes = results.filter((r) => r.pass).length
  console.log(`\n${passes}/${results.length} tests passed.`)
  console.log(`Created test users (for cleanup): ${createdEmails.join(', ') || '(none)'}`)

  await prisma.$disconnect()
  process.exit(passes === results.length ? 0 : 2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
