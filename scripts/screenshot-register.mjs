#!/usr/bin/env node
// Dedicated capture script for /register since it has interactive state
// (2-step mobile flow). Generates two screenshots:
//   screenshots/phase-1/4-auth/register-step1.png  (Name step, fresh load)
//   screenshots/phase-1/4-auth/register-step2.png  (Creds step + a sample
//     password typed so the PasswordStrengthBars are visible)
//
// Usage: node scripts/screenshot-register.mjs

import { chromium, devices } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    serviceWorkers: 'block',
  })

  // Same cookie-banner pre-dismissal as scripts/screenshot-mobile.mjs.
  await context.addInitScript(() => {
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

  const page = await context.newPage()

  try {
    // Step 1 — Name
    const step1Path = resolve(ROOT, 'screenshots/phase-1/4-auth/register-step1.png')
    console.log(`→ /register (step 1)  →  ${step1Path}`)
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await page.screenshot({ path: step1Path, fullPage: true })

    // Step 2 — Creds. Fill name, tap Next, then type a sample password so
    // the strength bars render. Click somewhere neutral to remove focus
    // before capture so the focus ring doesn't dominate the shot.
    const step2Path = resolve(ROOT, 'screenshots/phase-1/4-auth/register-step2.png')
    console.log(`→ /register (step 2 + sample password)  →  ${step2Path}`)
    await page.fill('input[name="name"]', 'Aanya')
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(400)
    await page.fill('input[name="password"]', 'gentleSeed!2026')
    await page.waitForTimeout(300)
    // Move focus off the password input without touching email (mode:
    // 'onTouched' would otherwise mark the empty email as invalid and
    // pollute the screenshot with a false error state).
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.waitForTimeout(200)
    await page.screenshot({ path: step2Path, fullPage: true })
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-register] FAILED:', err)
  process.exit(1)
})
