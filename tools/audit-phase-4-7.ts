/**
 * Pre-launch audit — Phase 4-7. Uses :visible pseudo-class to avoid the
 * dual-shell DOM (mobile + desktop renders children twice; on 1440px the
 * mobile version is display:hidden but still in the DOM).
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'https://mindset-ten.vercel.app'
const EMAIL = 'choudharysuryansh1111@gmail.com'
const PASSWORD = process.env.AUDIT_PASSWORD!
const OUT_DIR = process.env.AUDIT_OUT!
const IDS = {
  doctorId: 'cmmk305d40002tb3e378vjp5f',
  workshopId: 'cmp9ouypv0000l027kuy7gnjf',
}

type Finding = {
  phase: string
  step: string
  consoleErrors: string[]
  networkErrors: string[]
  notes: string[]
  screenshot?: string
  verdict?: 'ok' | 'warn' | 'broken' | 'note'
}
const findings: Finding[] = []
const dbRowsCreated: string[] = []
const consoleErrorLog: string[] = []

async function login(page: Page) {
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('logged in')
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') {
      const t = m.text()
      if (t.includes('recaptcha')) return
      consoleErrorLog.push(t.slice(0, 220))
    }
  })

  await login(page)

  // ─── Phase 4 ───────────────────────────────────────────────────────────
  console.log('\n[Phase 4]')
  await page.goto(BASE_URL + '/user/profile/personal', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(2500)

  const langField = page.locator('input[placeholder="e.g. English, Hindi"]:visible').first()
  const phoneField = page.locator('input[placeholder="9876543210"]:visible').first()
  const saveBtn = page.locator('button:visible', { hasText: /save changes/i }).first()

  const sentinel = `audit-${Date.now()}`
  // 4.a — write, save, reload, read back
  const langCount = await langField.count()
  if (!langCount) {
    findings.push({
      phase: 'Phase 4',
      step: 'preferred-language field',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no visible preferred-language input'],
      verdict: 'broken',
    })
  } else {
    await langField.fill(sentinel)
    await saveBtn.click()
    await page.waitForTimeout(2500)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const after = await page
      .locator('input[placeholder="e.g. English, Hindi"]:visible')
      .first()
      .inputValue()
    findings.push({
      phase: 'Phase 4',
      step: 'preferred-language save persists',
      consoleErrors: [],
      networkErrors: [],
      notes: [`wrote: ${sentinel}`, `read back: ${after}`],
      verdict: after === sentinel ? 'ok' : 'broken',
    })

    // 4.b clear
    const langAgain = page.locator('input[placeholder="e.g. English, Hindi"]:visible').first()
    await langAgain.fill('')
    await page.locator('button:visible', { hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2500)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const cleared = await page
      .locator('input[placeholder="e.g. English, Hindi"]:visible')
      .first()
      .inputValue()
    findings.push({
      phase: 'Phase 4',
      step: 'preferred-language clear persists',
      consoleErrors: [],
      networkErrors: [],
      notes: [`read back: "${cleared}"`],
      verdict: cleared === '' ? 'ok' : 'broken',
    })
  }

  // 4.c blank phone — should error, not save
  const phoneVisible = await page
    .locator('input[placeholder="9876543210"]:visible')
    .first()
    .count()
  if (phoneVisible) {
    const phoneRef = page.locator('input[placeholder="9876543210"]:visible').first()
    const orig = await phoneRef.inputValue()
    await phoneRef.fill('')
    await page.locator('button:visible', { hasText: /save changes/i }).first().click()
    await page.waitForTimeout(1500)
    const errCount = await page.locator('text=/cannot be cleared/i').count()
    await page.screenshot({
      path: path.join(OUT_DIR, 'p4-phone-blank-error.png'),
      fullPage: false,
    })
    findings.push({
      phase: 'Phase 4',
      step: 'blanking phone surfaces sticky-required error',
      consoleErrors: [],
      networkErrors: [],
      notes: [`original phone: ${orig}`, `error message visible: ${errCount > 0}`],
      screenshot: 'p4-phone-blank-error.png',
      verdict: errCount > 0 ? 'ok' : 'broken',
    })
    // restore
    await page.locator('input[placeholder="9876543210"]:visible').first().fill(orig || '9718812356')
    await page.locator('button:visible', { hasText: /save changes/i }).first().click()
    await page.waitForTimeout(2000)
  }

  // 4.d journal new save
  await page.goto(BASE_URL + '/user/practice/journal/new', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(2500)
  const ta = page.locator('textarea:visible').first()
  if (await ta.count()) {
    const j = `Audit ${Date.now()}: persistence check.`
    await ta.fill(j)
    await page.waitForTimeout(500)
    const journalSaveBtn = page
      .locator('button:visible')
      .filter({ hasText: /save|publish|post/i })
      .first()
    if (await journalSaveBtn.count()) {
      const before = page.url()
      await journalSaveBtn.click().catch(() => {})
      await page.waitForTimeout(4000)
      const after = page.url()
      await page.screenshot({
        path: path.join(OUT_DIR, 'p4-journal-after-save.png'),
        fullPage: true,
      })
      findings.push({
        phase: 'Phase 4',
        step: 'journal new save navigates away (suggests persisted)',
        consoleErrors: [],
        networkErrors: [],
        notes: [`url before: ${before}`, `url after: ${after}`, `entry text: ${j}`],
        screenshot: 'p4-journal-after-save.png',
        verdict: after !== before ? 'ok' : 'warn',
      })
      if (after !== before) {
        dbRowsCreated.push(`JournalEntry — Suryansh, ${new Date().toISOString()}`)
      }
    } else {
      findings.push({
        phase: 'Phase 4',
        step: 'journal new save',
        consoleErrors: [],
        networkErrors: [],
        notes: ['no save button visible on journal new'],
        verdict: 'broken',
      })
    }
  } else {
    findings.push({
      phase: 'Phase 4',
      step: 'journal new editor',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no visible textarea on /user/practice/journal/new'],
      verdict: 'broken',
    })
  }

  // ─── Phase 5 ───────────────────────────────────────────────────────────
  console.log('\n[Phase 5]')
  await page.goto(BASE_URL + `/user/sessions/book?doctorId=${IDS.doctorId}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(3000)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p5-book-doctor.png'),
    fullPage: true,
  })
  const slot = page
    .locator('button:visible')
    .filter({ hasText: /\d{1,2}:\d{2}\s*(am|pm)?/i })
    .first()
  if (await slot.count()) {
    await slot.click().catch(() => {})
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(OUT_DIR, 'p5-book-slot.png'),
      fullPage: true,
    })
    const pay = page
      .locator('button:visible')
      .filter({ hasText: /pay|confirm|book|continue|proceed/i })
      .first()
    if (await pay.count()) {
      const t = await pay.textContent()
      await pay.click().catch(() => {})
      await page.waitForTimeout(7000)
      const rzp = await page.locator('iframe[src*="razorpay"]').count()
      await page.screenshot({
        path: path.join(OUT_DIR, 'p5-session-rzp.png'),
        fullPage: false,
      })
      findings.push({
        phase: 'Phase 5',
        step: 'session payment — Razorpay opens',
        consoleErrors: [],
        networkErrors: [],
        notes: [
          `pay button: ${t?.trim()}`,
          `razorpay iframe present: ${rzp > 0}`,
          'NOTE: not completed — Suryansh to finish manually',
        ],
        screenshot: 'p5-session-rzp.png',
        verdict: rzp > 0 ? 'ok' : 'warn',
      })
      if (rzp > 0) dbRowsCreated.push('Payment (PENDING) — session booking verify-first row')
    } else {
      findings.push({
        phase: 'Phase 5',
        step: 'session pay button',
        consoleErrors: [],
        networkErrors: [],
        notes: ['no pay/confirm button after slot picked'],
        verdict: 'broken',
      })
    }
  } else {
    findings.push({
      phase: 'Phase 5',
      step: 'session slot picker',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no time slot buttons visible'],
      verdict: 'broken',
    })
  }

  // 5.b workshop
  await page.goto(BASE_URL + `/user/discover/workshops/${IDS.workshopId}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p5-workshop-detail.png'),
    fullPage: true,
  })
  const ws = page
    .locator('button:visible')
    .filter({ hasText: /register|pay|join/i })
    .first()
  if (await ws.count()) {
    const t = await ws.textContent()
    await ws.click().catch(() => {})
    await page.waitForTimeout(7000)
    const rzp = await page.locator('iframe[src*="razorpay"]').count()
    await page.screenshot({
      path: path.join(OUT_DIR, 'p5-workshop-rzp.png'),
      fullPage: false,
    })
    findings.push({
      phase: 'Phase 5',
      step: 'workshop payment — Razorpay opens',
      consoleErrors: [],
      networkErrors: [],
      notes: [
        `button text: ${t?.trim()}`,
        `razorpay iframe present: ${rzp > 0}`,
        'NOTE: not completed — Suryansh to finish manually',
      ],
      screenshot: 'p5-workshop-rzp.png',
      verdict: rzp > 0 ? 'ok' : 'warn',
    })
    if (rzp > 0) dbRowsCreated.push('Payment (PENDING) — workshop registration verify-first row')
  } else {
    findings.push({
      phase: 'Phase 5',
      step: 'workshop register button',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no register/pay/join button on workshop detail (may be already registered or free)'],
      verdict: 'note',
    })
  }

  // ─── Phase 6 ───────────────────────────────────────────────────────────
  console.log('\n[Phase 6]')
  await page.goto(BASE_URL + '/user', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  const bell = page.locator('a[href*="/user/notifications"]:visible').first()
  const bellCount = await bell.count()
  const badge = await page
    .locator('a[href*="/user/notifications"]:visible span')
    .filter({ hasText: /^\d+$|^9\+$/ })
    .count()
  await page.screenshot({
    path: path.join(OUT_DIR, 'p6-bell.png'),
    fullPage: false,
  })
  findings.push({
    phase: 'Phase 6',
    step: 'spine bell present + badge state',
    consoleErrors: [],
    networkErrors: [],
    notes: [`bell visible: ${bellCount}`, `badge visible: ${badge > 0}`],
    screenshot: 'p6-bell.png',
    verdict: bellCount > 0 ? 'ok' : 'broken',
  })
  if (bellCount > 0) {
    await bell.click().catch(() => {})
    await page.waitForTimeout(2500)
    await page.screenshot({
      path: path.join(OUT_DIR, 'p6-notifications.png'),
      fullPage: true,
    })
    findings.push({
      phase: 'Phase 6',
      step: 'bell click lands on notifications',
      consoleErrors: [],
      networkErrors: [],
      notes: [`final url: ${page.url()}`],
      screenshot: 'p6-notifications.png',
      verdict: page.url().endsWith('/user/notifications') ? 'ok' : 'broken',
    })
    await page.goto(BASE_URL + '/user', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)
    const badgeAfter = await page
      .locator('a[href*="/user/notifications"]:visible span')
      .filter({ hasText: /^\d+$|^9\+$/ })
      .count()
    findings.push({
      phase: 'Phase 6',
      step: 'badge after mark-as-read',
      consoleErrors: [],
      networkErrors: [],
      notes: [`badge still visible: ${badgeAfter > 0}`],
      verdict: badgeAfter === 0 ? 'ok' : 'warn',
    })
  }

  // ─── Phase 7 ───────────────────────────────────────────────────────────
  console.log('\n[Phase 7]')
  const robotsResp = await page.goto(BASE_URL + '/robots.txt', {
    waitUntil: 'domcontentloaded',
  })
  const robots = (await robotsResp?.text()) ?? ''
  findings.push({
    phase: 'Phase 7',
    step: 'robots.txt',
    consoleErrors: [],
    networkErrors: [],
    notes: [
      `len: ${robots.length}`,
      `has Sitemap directive: ${robots.includes('Sitemap')}`,
      `disallow /user: ${robots.includes('/user')}`,
      `disallow /verify-email: ${robots.includes('/verify-email')}`,
      `host: ${(robots.match(/Host:[^\n]+/i) ?? ['(none)'])[0]?.trim()}`,
      `sitemap url: ${(robots.match(/Sitemap:[^\n]+/i) ?? ['(none)'])[0]?.trim()}`,
    ],
    verdict: robots.includes('Sitemap') && robots.includes('/user') ? 'ok' : 'warn',
  })
  const smResp = await page.goto(BASE_URL + '/sitemap.xml', {
    waitUntil: 'domcontentloaded',
  })
  const sm = (await smResp?.text()) ?? ''
  const urls = (sm.match(/<loc>([^<]+)<\/loc>/g) ?? []).map((m) =>
    m.replace(/<\/?loc>/g, ''),
  )
  findings.push({
    phase: 'Phase 7',
    step: 'sitemap.xml',
    consoleErrors: [],
    networkErrors: [],
    notes: [
      `url count: ${urls.length}`,
      `lists /refund-policy (404 in Phase 1): ${urls.some((u) => u.endsWith('/refund-policy'))}`,
      `lists /cookies: ${urls.some((u) => u.endsWith('/cookies'))}`,
      `lists /ngo-visits/join (deprecated redirect): ${urls.some((u) => u.endsWith('/ngo-visits/join'))}`,
    ],
    verdict: urls.some((u) => u.endsWith('/refund-policy')) ? 'broken' : 'ok',
  })
  const sessResp = await page.goto(BASE_URL + '/api/auth/session', {
    waitUntil: 'domcontentloaded',
  })
  const sess = (await sessResp?.text()) ?? ''
  findings.push({
    phase: 'Phase 7',
    step: '/api/auth/session shape',
    consoleErrors: [],
    networkErrors: [],
    notes: [
      `len: ${sess.length}`,
      `contains "role": ${sess.includes('"role"')}`,
      `body preview: ${sess.slice(0, 220)}`,
    ],
    verdict: sess.includes('"role"') ? 'ok' : 'warn',
  })

  await fs.writeFile(
    path.join(OUT_DIR, '_findings-phase-4-7.json'),
    JSON.stringify(
      {
        findings,
        dbRowsCreated,
        nonRecaptchaConsoleErrors: consoleErrorLog.slice(0, 40),
      },
      null,
      2,
    ),
  )
  console.log(`\n=== DONE — ${findings.length} findings ===`)
  console.log('DB rows created:', dbRowsCreated)
  await browser.close()
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
