#!/usr/bin/env node
// Capture /verify-email's six states at iPhone 14 or iPhone SE.
// Five states are pure client-side (token validation under controlled
// mocking); the "sent" state requires a real authenticated session, so
// the script registers a fresh user via the actual /register form once
// per viewport before capturing.
//
// Usage:
//   node scripts/screenshot-verify-email.mjs
//   DEVICE='iPhone SE' node scripts/screenshot-verify-email.mjs

import { chromium, devices } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE_NAME = process.env.DEVICE ?? 'iPhone 14'
const SUFFIX = DEVICE_NAME === 'iPhone SE' ? '-iphone-se' : ''

const outPath = (state) =>
  resolve(ROOT, `screenshots/phase-1/4-auth/verify-email-${state}${SUFFIX}.png`)

const CONSENT_COOKIE_INIT = () => {
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
}

async function newContext(browser, device, routes = []) {
  const ctx = await browser.newContext({ ...device, serviceWorkers: 'block' })
  await ctx.addInitScript(CONSENT_COOKIE_INIT)
  for (const r of routes) await ctx.route(r.pattern, r.handler)
  return ctx
}

// ─── Token-flow capture ───────────────────────────────────────────────
// Five token-flow states are reachable by varying the POST response.
// `verifying` uses a slow response; the others use specific bodies.
async function captureTokenState(browser, device, state, mockResponder, mockDelayMs = 0) {
  const ctx = await newContext(browser, device, [
    {
      pattern: '**/api/auth/email/verify',
      handler: async (route) => {
        if (mockDelayMs > 0) await new Promise((r) => setTimeout(r, mockDelayMs))
        await mockResponder(route)
      },
    },
  ])
  const page = await ctx.newPage()
  const path = outPath(state)
  console.log(`→ ${state}  →  ${path}`)
  await page.goto(`${BASE_URL}/verify-email?token=fake-${state}-token`, {
    waitUntil: 'domcontentloaded',
  })
  // For non-verifying states, wait for the POST to resolve & UI to settle.
  if (state === 'verifying') {
    // The handler delays for ~3s; grab the screenshot during that window.
    await page.waitForTimeout(600)
  } else {
    await page.waitForTimeout(900)
  }
  await page.screenshot({ path, fullPage: true })
  await ctx.close()
}

// ─── Sent-stage capture ───────────────────────────────────────────────
// Sent stage requires session.user.email. Register a fresh user through
// the actual /register form so the post-signup redirect lands us on
// /verify-email?sent=1 with a real session cookie. Email is timestamped
// to avoid clashing with prior runs.
async function captureSentState(browser, device) {
  const ctx = await newContext(browser, device)
  const page = await ctx.newPage()
  const path = outPath('sent')
  console.log(`→ sent  →  ${path}`)

  const uniq = Date.now()
  const email = `screenshot-${uniq}@mindset-test.local`
  const password = 'CaptureTest2026!'

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' })

  // Step 0 — Name
  await page.fill('input[name="name"]', 'Capture User')
  await page.click('button:has-text("Next")')
  await page.waitForTimeout(400)

  // Step 1 — Credentials. Skip phone (optional).
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.fill('input[name="confirmPassword"]', password)
  // T&C checkbox — find the only checkbox on step 1
  await page.locator('input[type="checkbox"]').check()
  await page.waitForTimeout(200)

  // Submit and wait for the post-signup redirect to /verify-email?sent=1
  // (~3-5s including DB insert + signIn round-trip).
  await page.click('button[type="submit"]')
  await page.waitForURL('**/verify-email?sent=1', { timeout: 30_000 })
  // Give the cooldown 2 seconds to tick visibly mid-state.
  await page.waitForTimeout(2400)
  // Click neutral area in case any field is focused.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.waitForTimeout(200)
  await page.screenshot({ path, fullPage: true })
  await ctx.close()
}

async function main() {
  const device = devices[DEVICE_NAME]
  if (!device) {
    console.error(`Unknown device: ${DEVICE_NAME}`)
    process.exit(2)
  }
  console.log(`device: ${DEVICE_NAME} (${device.viewport.width}×${device.viewport.height})`)

  const browser = await chromium.launch()

  try {
    // Five token-flow states
    await captureTokenState(
      browser,
      device,
      'verifying',
      async (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        }),
      3000 // delay the response so the verifying loader stays on screen
    )
    await captureTokenState(browser, device, 'success', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    )
    await captureTokenState(browser, device, 'expired', async (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'expired',
          message: 'This verification link has expired.',
        }),
      })
    )
    await captureTokenState(browser, device, 'invalid', async (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'invalid',
          message: 'This verification link is invalid.',
        }),
      })
    )
    await captureTokenState(browser, device, 'used', async (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'used',
          message: 'This link has already been used.',
        }),
      })
    )

    // Sent stage — register a fresh user end-to-end.
    await captureSentState(browser, device)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-verify-email] FAILED:', err)
  process.exit(1)
})
