#!/usr/bin/env node
// Capture iPhone 14 viewport screenshots of one or more URLs and write them
// to a destination directory.
//
// Usage:
//   node scripts/screenshot-mobile.mjs <url> <output.png>
//   node scripts/screenshot-mobile.mjs <url> <output.png> <url> <output.png> ...
//
// Server must already be running on http://localhost:3000 (or change
// BASE_URL via env). Uses Playwright at the device specified by env var
// DEVICE (defaults to 'iPhone 14', 390×844). Set DEVICE='iPhone SE' for
// the narrower 375×667 verification pass.

import { chromium, devices } from 'playwright'
import { resolve } from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const DEVICE_NAME = process.env.DEVICE ?? 'iPhone 14'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.length % 2 !== 0) {
    console.error('Usage: screenshot-mobile.mjs <url> <output.png> [<url> <output.png> ...]')
    process.exit(2)
  }

  const device = devices[DEVICE_NAME]
  if (!device) {
    console.error(`Unknown device: ${DEVICE_NAME}. Try 'iPhone 14' or 'iPhone SE'.`)
    process.exit(2)
  }
  console.log(`device: ${DEVICE_NAME} (${device.viewport.width}×${device.viewport.height})`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...device,
    // Don't load real fonts / external scripts to speed up; same-origin only.
    serviceWorkers: 'block',
  })

  // Pre-dismiss the cookie banner so it doesn't overlay every screenshot.
  // Shape matches the ConsentRecord type in
  // src/components/legal/cookie-banner.tsx (version 1).
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
    for (let i = 0; i < args.length; i += 2) {
      const path = args[i].startsWith('http') ? args[i] : BASE_URL + args[i]
      const out = resolve(args[i + 1])
      console.log(`→ ${path}  →  ${out}`)
      await page.goto(path, { waitUntil: 'networkidle' })
      // Give CSS animations a beat to settle before capture so we don't
      // freeze on a mid-animation frame.
      await page.waitForTimeout(600)
      await page.screenshot({ path: out, fullPage: true })
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[screenshot-mobile] FAILED:', err)
  process.exit(1)
})
