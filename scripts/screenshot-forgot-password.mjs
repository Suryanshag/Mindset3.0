#!/usr/bin/env node
// Capture /forgot-password's input + sent stages at iPhone 14 viewport.
// Uses route interception so we don't depend on the real backend (the
// submitted-state cooldown clock needs a successful POST to start).
//
// Usage: node scripts/screenshot-forgot-password.mjs

import { chromium, devices } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE_NAME = process.env.DEVICE ?? 'iPhone 14'

async function main() {
  const device = devices[DEVICE_NAME]
  if (!device) {
    console.error(`Unknown device: ${DEVICE_NAME}`)
    process.exit(2)
  }
  console.log(`device: ${DEVICE_NAME} (${device.viewport.width}×${device.viewport.height})`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...device,
    serviceWorkers: 'block',
  })

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

  // Intercept the forgot-password POST so the screenshot pass doesn't
  // depend on a live DB / Resend setup. Returns the enumeration-safe
  // success shape the real API returns.
  await context.route('**/api/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  const page = await context.newPage()

  try {
    // Input stage
    const inputPath = resolve(
      ROOT,
      `screenshots/phase-1/4-auth/forgot-password-input${DEVICE_NAME === 'iPhone SE' ? '-iphone-se' : ''}.png`
    )
    console.log(`→ /forgot-password (input)  →  ${inputPath}`)
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    // Click outside the email input to drop autofocus so the focus ring
    // doesn't dominate the capture.
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.waitForTimeout(150)
    await page.screenshot({ path: inputPath, fullPage: true })

    // Sent stage — submit the form, wait for cooldown to tick a few seconds
    // so the countdown is visibly mid-tick (handoff design intent).
    const sentPath = resolve(
      ROOT,
      `screenshots/phase-1/4-auth/forgot-password-sent${DEVICE_NAME === 'iPhone SE' ? '-iphone-se' : ''}.png`
    )
    console.log(`→ /forgot-password (sent, cooldown mid-tick)  →  ${sentPath}`)
    await page.fill('input[type="email"]', 'someone@example.com')
    await page.locator('button[type="submit"]').click()
    // Give the cooldown 3 seconds to tick down a touch so the screenshot
    // shows "Resend in 0:57" rather than 1:00 (more visually informative).
    await page.waitForTimeout(3200)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.waitForTimeout(150)
    await page.screenshot({ path: sentPath, fullPage: true })
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-forgot-password] FAILED:', err)
  process.exit(1)
})
