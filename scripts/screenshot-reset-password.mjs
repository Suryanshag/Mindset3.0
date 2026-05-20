#!/usr/bin/env node
// Capture /reset-password's four states at the configured viewport:
//   reset-password-checking.png  — loader during GET validation
//   reset-password-invalid.png   — bad/expired token
//   reset-password-valid.png     — main form with password typed
//   reset-password-success.png   — post-submit success card
//
// Each state's render path requires mocking either the GET or POST API
// response so the screenshot pass doesn't depend on real DB tokens.
// Honours the DEVICE env var (default iPhone 14; set 'iPhone SE' for the
// 320×568 minimum-viewport check).

import { chromium, devices } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE_NAME = process.env.DEVICE ?? 'iPhone 14'
const SUFFIX = DEVICE_NAME === 'iPhone SE' ? '-iphone-se' : ''

function outPath(state) {
  return resolve(ROOT, `screenshots/phase-1/4-auth/reset-password-${state}${SUFFIX}.png`)
}

async function main() {
  const device = devices[DEVICE_NAME]
  if (!device) {
    console.error(`Unknown device: ${DEVICE_NAME}`)
    process.exit(2)
  }
  console.log(`device: ${DEVICE_NAME} (${device.viewport.width}×${device.viewport.height})`)

  const browser = await chromium.launch()

  async function newContext() {
    const ctx = await browser.newContext({
      ...device,
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
    return ctx
  }

  try {
    // ─── Checking state ─────────────────────────────────────────────────
    // Delay the GET response by 1.5s so the loader is visible during the
    // screenshot capture window.
    {
      const ctx = await newContext()
      await ctx.route('**/api/auth/reset-password?token=*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        await new Promise((r) => setTimeout(r, 1500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString() }),
        })
      })
      const page = await ctx.newPage()
      const path = outPath('checking')
      console.log(`→ ${path}`)
      // Don't wait for networkidle (the GET is artificially slow); we want
      // the loader on screen.
      await page.goto(`${BASE_URL}/reset-password?token=fake`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(600)
      await page.screenshot({ path, fullPage: true })
      await ctx.close()
    }

    // ─── Invalid token state ───────────────────────────────────────────
    {
      const ctx = await newContext()
      await ctx.route('**/api/auth/reset-password?token=*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Invalid or expired reset link.' }),
        })
      })
      const page = await ctx.newPage()
      const path = outPath('invalid')
      console.log(`→ ${path}`)
      await page.goto(`${BASE_URL}/reset-password?token=fake`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      await page.screenshot({ path, fullPage: true })
      await ctx.close()
    }

    // ─── Valid form state ───────────────────────────────────────────────
    // Render the form with both passwords typed so PasswordStrengthBars
    // shows Strong and the submit pill is enabled.
    {
      const ctx = await newContext()
      await ctx.route('**/api/auth/reset-password?token=*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString() }),
        })
      })
      const page = await ctx.newPage()
      const path = outPath('valid')
      console.log(`→ ${path}`)
      await page.goto(`${BASE_URL}/reset-password?token=fake`, { waitUntil: 'networkidle' })
      await page.waitForSelector('input[autocomplete="new-password"]')
      await page.locator('input[autocomplete="new-password"]').first().fill('MyDog2026!')
      await page.locator('input[autocomplete="new-password"]').nth(1).fill('MyDog2026!')
      await page.waitForTimeout(250)
      // Click neutral area to drop the focus ring so it doesn't dominate
      // the capture.
      await page.locator('body').click({ position: { x: 5, y: 5 } })
      await page.waitForTimeout(200)
      await page.screenshot({ path, fullPage: true })
      await ctx.close()
    }

    // ─── Success state ──────────────────────────────────────────────────
    // POST succeeds (returns email); signIn is intercepted so the success
    // card stays on screen during the visible signIn-in-flight window.
    {
      const ctx = await newContext()
      await ctx.route('**/api/auth/reset-password*', async (route) => {
        const req = route.request()
        if (req.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString() }),
          })
        } else if (req.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              email: 'reset-user@example.com',
              message: 'Password reset successfully.',
            }),
          })
        } else {
          await route.continue()
        }
      })
      // Slow-walk the NextAuth signin so the success card is held on
      // screen during capture. In production this completes in ~200ms.
      await ctx.route('**/api/auth/callback/credentials*', async (route) => {
        await new Promise((r) => setTimeout(r, 5000))
        await route.continue()
      })

      const page = await ctx.newPage()
      const path = outPath('success')
      console.log(`→ ${path}`)
      await page.goto(`${BASE_URL}/reset-password?token=fake`, { waitUntil: 'networkidle' })
      await page.waitForSelector('input[autocomplete="new-password"]')
      await page.locator('input[autocomplete="new-password"]').first().fill('MyDog2026!')
      await page.locator('input[autocomplete="new-password"]').nth(1).fill('MyDog2026!')
      await page.waitForTimeout(200)
      await page.locator('button[type="submit"]').first().click()
      // Wait for the success card to render — POST resolves immediately,
      // then setSuccess(true) flips the React tree.
      await page.waitForTimeout(900)
      await page.screenshot({ path, fullPage: true })
      await ctx.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-reset-password] FAILED:', err)
  process.exit(1)
})
