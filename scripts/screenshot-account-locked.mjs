#!/usr/bin/env node
// Capture /account-locked's three states at iPhone 14 or iPhone SE:
//   account-locked-active.png     — countdown mid-tick (~14:23 remaining)
//   account-locked-unlocked.png   — countdown at 0:00 with "Sign in now" affordance
//   account-locked-malformed.png  — visible-state capture is impossible
//                                   because malformed/missing `until`
//                                   redirects server-side to /login. We
//                                   capture the resulting /login page
//                                   so the behavior is observable.
//
// Usage:
//   node scripts/screenshot-account-locked.mjs
//   DEVICE='iPhone SE' node scripts/screenshot-account-locked.mjs

import { chromium, devices } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE_NAME = process.env.DEVICE ?? 'iPhone 14'
const SUFFIX = DEVICE_NAME === 'iPhone SE' ? '-iphone-se' : ''

const outPath = (state) =>
  resolve(ROOT, `screenshots/phase-1/4-auth/account-locked-${state}${SUFFIX}.png`)

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

async function newContext(browser, device) {
  const ctx = await browser.newContext({ ...device, serviceWorkers: 'block' })
  await ctx.addInitScript(CONSENT_COOKIE_INIT)
  return ctx
}

async function captureActive(browser, device) {
  const ctx = await newContext(browser, device)
  const page = await ctx.newPage()
  const path = outPath('active')
  console.log(`→ active  →  ${path}`)
  // 14 minutes 28 seconds in the future. The first tick lands at ~14:27.
  const until = new Date(Date.now() + 14 * 60 * 1000 + 28 * 1000).toISOString()
  await page.goto(`${BASE_URL}/account-locked?until=${encodeURIComponent(until)}`, {
    waitUntil: 'domcontentloaded',
  })
  // Wait one full second so the countdown displays a non-initial value
  // (otherwise the screenshot catches 14:28 on render and immediately
  // moves to 14:27 — fine, but the brief asks for "mid-tick").
  await page.waitForTimeout(1100)
  await page.screenshot({ path, fullPage: true })
  await ctx.close()
}

async function captureUnlocked(browser, device) {
  const ctx = await newContext(browser, device)
  const page = await ctx.newPage()
  const path = outPath('unlocked')
  console.log(`→ unlocked  →  ${path}`)
  // 30 seconds in the past — guaranteed to render the unlocked state
  // immediately. Still within the 24h window so the server-side guard
  // doesn't redirect us to /login.
  const until = new Date(Date.now() - 30 * 1000).toISOString()
  await page.goto(`${BASE_URL}/account-locked?until=${encodeURIComponent(until)}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path, fullPage: true })
  await ctx.close()
}

async function captureMalformed(browser, device) {
  const ctx = await newContext(browser, device)
  const page = await ctx.newPage()
  const path = outPath('malformed')
  console.log(`→ malformed  →  ${path}`)
  // `until=not-a-date` — server-side guard parses to NaN and redirects
  // to /login. We capture the resulting /login page so the screenshot
  // shows what the user actually sees: the canonical sign-in page,
  // no error toast, no stranded UI.
  await page.goto(`${BASE_URL}/account-locked?until=not-a-date`, {
    waitUntil: 'networkidle',
  })
  // Confirm we landed on /login. If not, the test setup is wrong and
  // the screenshot won't represent the redirect behavior.
  if (!page.url().includes('/login')) {
    console.warn(`  ! expected redirect to /login, ended at ${page.url()}`)
  }
  await page.waitForTimeout(400)
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
    await captureActive(browser, device)
    await captureUnlocked(browser, device)
    await captureMalformed(browser, device)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-account-locked] FAILED:', err)
  process.exit(1)
})
