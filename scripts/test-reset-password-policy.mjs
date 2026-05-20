#!/usr/bin/env node
// Automated verification of the password-policy single-source-of-truth
// contract on /reset-password. Runs three input cases per the owner's
// kickoff (sub-phase 1.4 route 4) and a bypass case.
//
// Pass criteria:
//   1. Each row's strength-bar label matches expected
//   2. Each row's submit button disabled state matches meetsPolicy
//   3. The bypass case — typing a fails-policy password and forcibly
//      enabling submit — gets rejected by the server's passwordSchema
//      with the same reasoning the client would have used
//
// Usage: node scripts/test-reset-password-policy.mjs
// Requires: dev server running on http://localhost:3000

import { chromium, devices } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

const CASES = [
  {
    name: 'row 1',
    password: 'MyDog2026!',
    length: 10,
    classes: 'upper, lower, digit, symbol (4)',
    expectedLabel: 'Strong',
    expectedMeetsPolicy: true,
  },
  {
    name: 'row 2',
    password: 'mydog2026',
    length: 9,
    classes: 'lower, digit (2)',
    expectedLabel: 'Too short',
    expectedMeetsPolicy: false,
  },
  {
    name: 'row 3',
    password: 'mydog202612',
    length: 11,
    classes: 'lower, digit (2)',
    expectedLabel: 'Weak',
    expectedMeetsPolicy: false,
  },
]

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    serviceWorkers: 'block',
  })

  // Pre-dismiss cookie banner
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

  // Mock GET to return valid token so the form renders
  await context.route('**/api/auth/reset-password?token=*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString() }),
    })
  })

  const page = await context.newPage()

  const results = []
  let allPass = true

  for (const c of CASES) {
    await page.goto(`${BASE_URL}/reset-password?token=fake-token-for-test`, { waitUntil: 'networkidle' })
    await page.waitForSelector('input[autocomplete="new-password"]', { timeout: 5000 })

    const newPwd = page.locator('input[autocomplete="new-password"]').first()
    const confirmPwd = page.locator('input[autocomplete="new-password"]').nth(1)

    await newPwd.fill(c.password)
    await confirmPwd.fill(c.password)
    await page.waitForTimeout(150)

    // Read the strength label from the PasswordStrengthBars [role=status] element
    const labelEl = page.locator('[role="status"]').first()
    const actualLabel = c.password.length === 0 ? '(none)' : (await labelEl.textContent())?.trim() ?? '(none)'

    // Submit button disabled state
    const submit = page.locator('button[type="submit"]').first()
    const actualDisabled = await submit.isDisabled()
    const actualEnabled = !actualDisabled

    const labelOk = actualLabel === c.expectedLabel
    const enabledOk = actualEnabled === c.expectedMeetsPolicy

    const pass = labelOk && enabledOk
    if (!pass) allPass = false

    results.push({ ...c, actualLabel, actualEnabled, pass })

    const tick = pass ? '✓' : '✗'
    console.log(
      `${tick} ${c.name}  pwd=${JSON.stringify(c.password)} (${c.length}/${c.classes})`
    )
    console.log(`    expected: label=${c.expectedLabel}, submit enabled=${c.expectedMeetsPolicy}`)
    console.log(`    actual:   label=${actualLabel}, submit enabled=${actualEnabled}`)
    if (!pass) {
      if (!labelOk) console.log(`    MISMATCH label`)
      if (!enabledOk) console.log(`    MISMATCH submit state`)
    }
    console.log()
  }

  // ─── Bypass test ────────────────────────────────────────────────────
  // Direct POST to the API with a fails-policy password, bypassing the
  // client-side scorePassword() gate entirely (simulating a determined
  // attacker / curl user). The client gate already proved itself in row
  // 3 above (submit disabled, no fetch fires); this test isolates the
  // SERVER-side passwordSchema check.
  //
  // Token is intentionally fake — the server validates the password
  // FIRST via zod schema (registerSchema parses before token lookup),
  // so we should see the password-policy error message, not a token-
  // not-found error.
  console.log('─── Bypass test (direct POST) ───')
  console.log('POSTing fails-policy password directly to the API, expecting passwordSchema rejection…')

  const bypassResp = await page.evaluate(async () => {
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'fake-token-for-test', password: 'mydog202612' }),
    })
    const body = await r.json()
    return { status: r.status, body }
  })

  console.log(`  HTTP ${bypassResp.status}`)
  console.log(`  body: ${JSON.stringify(bypassResp.body)}`)

  // Acceptance: server must reject (status 400 + success: false) AND the
  // error must reference the policy ("at least 10 characters" or "3 of:
  // uppercase, lowercase, number, special character"). If the error
  // instead says "Invalid or expired reset link", the schema isn't
  // running before the token check on the server.
  const rejected = bypassResp.status === 400 && bypassResp.body?.success === false
  const errMsg = String(bypassResp.body?.error ?? '')
  const mentionsPolicy =
    errMsg.toLowerCase().includes('10 characters') ||
    errMsg.toLowerCase().includes('3 of')

  const bypassPass = rejected && mentionsPolicy
  if (!bypassPass) allPass = false

  console.log(
    `  ${bypassPass ? '✓' : '✗'} server rejected with passwordSchema reasoning (status=400, error mentions policy)`
  )
  if (!bypassPass) {
    if (!rejected) console.log('    server didn\'t return 400+success:false')
    if (!mentionsPolicy) console.log('    error didn\'t mention policy (got:', errMsg, ')')
  }
  console.log()

  await browser.close()

  console.log(allPass ? '✓ ALL PASS' : '✗ FAILURES — see above')
  process.exit(allPass ? 0 : 1)
}

main().catch((err) => {
  console.error('[test-reset-password-policy] FAILED:', err)
  process.exit(1)
})
