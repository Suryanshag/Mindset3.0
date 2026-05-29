/**
 * Pre-launch audit — Phase 3 (dashboard) + 4 (persistence) + 5 (payment up to
 * Razorpay modal — Suryansh completes) + 6 (notifications) + 7 (cross-cutting).
 *
 * Run:
 *   AUDIT_PASSWORD='...' AUDIT_OUT=docs/audit-screenshots/<ts> npx tsx tools/audit-phase-3-7.ts
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'https://mindset-ten.vercel.app'
const EMAIL = 'choudharysuryansh1111@gmail.com'
const PASSWORD = process.env.AUDIT_PASSWORD
if (!PASSWORD) {
  console.error('AUDIT_PASSWORD env required')
  process.exit(1)
}
const OUT_DIR = process.env.AUDIT_OUT || `docs/audit-screenshots/${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .slice(0, 19)}`

// Seeded IDs from earlier work
const IDS = {
  doctorId: 'cmmk305d40002tb3e378vjp5f',
  workshopId: 'cmp9ouypv0000l027kuy7gnjf',
}

type Finding = {
  phase: string
  step: string
  url?: string
  finalUrl?: string
  status?: number
  consoleErrors: string[]
  networkErrors: string[]
  notes: string[]
  screenshot?: string
  verdict?: 'ok' | 'warn' | 'broken' | 'note'
}

const findings: Finding[] = []
const dbRowsCreated: string[] = []

async function captureRoute(
  page: Page,
  phase: string,
  step: string,
  routeOrUrl: string,
  options: { slug?: string; waitMs?: number; viewport?: boolean } = {},
): Promise<Finding> {
  const slug = options.slug ?? step.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)
  const url = routeOrUrl.startsWith('http') ? routeOrUrl : BASE_URL + routeOrUrl
  console.log(`[${phase}] ${step}`)

  const consoleErrors: string[] = []
  const networkErrors: string[] = []
  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === 'error') {
      const text = m.text()
      // Filter the known CSP/recaptcha noise we already documented
      if (text.includes('recaptcha/api.js')) return
      if (text.includes('Content Security Policy directive') && text.includes('recaptcha')) return
      consoleErrors.push(text.slice(0, 220))
    }
  }
  const onResponse = (r: import('playwright').Response) => {
    const s = r.status()
    if (s >= 400 && !r.url().includes('favicon') && !r.url().includes('recaptcha')) {
      networkErrors.push(`${s} ${r.url().slice(0, 140)}`)
    }
  }
  page.on('console', onConsole)
  page.on('response', onResponse)

  const f: Finding = {
    phase,
    step,
    url,
    consoleErrors,
    networkErrors,
    notes: [],
  }

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    f.status = resp?.status()
    if (options.waitMs) await page.waitForTimeout(options.waitMs)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      f.notes.push('did not reach networkidle in 15s')
    })
    f.finalUrl = page.url()
    const file = `${slug}.png`
    await page.screenshot({
      path: path.join(OUT_DIR, file),
      fullPage: !options.viewport,
    })
    f.screenshot = file
    const title = await page.title()
    f.notes.push(`title: ${title}`)
  } catch (err) {
    f.notes.push(`error: ${(err as Error).message.slice(0, 200)}`)
    f.verdict = 'broken'
  }

  page.off('console', onConsole)
  page.off('response', onResponse)
  findings.push(f)
  return f
}

async function login(page: Page) {
  console.log('[Phase 3] login')
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD!)
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('  logged in:', page.url())
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  console.log(`Output: ${OUT_DIR}`)
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  await login(page)

  // ─── Phase 3 — dashboard walkthrough ───────────────────────────────────
  const userRoutes: { route: string; slug: string }[] = [
    { route: '/user', slug: 'p3-user-home' },
    { route: '/user/sessions', slug: 'p3-sessions' },
    { route: '/user/sessions/book', slug: 'p3-sessions-book' },
    { route: `/user/sessions/book?doctorId=${IDS.doctorId}`, slug: 'p3-sessions-book-doctor' },
    { route: '/user/practice', slug: 'p3-practice' },
    { route: '/user/practice/journal', slug: 'p3-practice-journal' },
    { route: '/user/practice/journal/new', slug: 'p3-practice-journal-new' },
    { route: '/user/practice/assignments', slug: 'p3-practice-assignments' },
    { route: '/user/discover', slug: 'p3-discover' },
    { route: '/user/discover/workshops', slug: 'p3-discover-workshops' },
    { route: `/user/discover/workshops/${IDS.workshopId}`, slug: 'p3-discover-workshop-detail' },
    { route: '/user/discover/ngo-visits', slug: 'p3-discover-ngo-visits' },
    { route: '/user/library', slug: 'p3-library' },
    { route: '/user/shop', slug: 'p3-shop' },
    { route: '/user/cart', slug: 'p3-cart' },
    { route: '/user/orders', slug: 'p3-orders' },
    { route: '/user/notifications', slug: 'p3-notifications' },
    { route: '/user/profile', slug: 'p3-profile' },
    { route: '/user/profile/personal', slug: 'p3-profile-personal' },
    { route: '/user/reflection/today', slug: 'p3-reflection-today' },
  ]
  for (const r of userRoutes) {
    await captureRoute(page, 'Phase 3', `route ${r.route}`, r.route, { slug: r.slug })
  }

  // Find an existing session id (if any) to deep-link
  await page.goto(BASE_URL + '/user/sessions', { waitUntil: 'networkidle', timeout: 30000 })
  const firstSessionHref = await page
    .locator('a[href^="/user/sessions/"]')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (firstSessionHref && firstSessionHref !== '/user/sessions/book') {
    await captureRoute(page, 'Phase 3', `session detail ${firstSessionHref}`, firstSessionHref, {
      slug: 'p3-session-detail',
    })
  }

  // Find an existing journal entry id
  await page.goto(BASE_URL + '/user/practice/journal', { waitUntil: 'networkidle', timeout: 30000 })
  const firstJournalHref = await page
    .locator('a[href^="/user/practice/journal/"]')
    .filter({ hasNot: page.locator('a[href*="/new"]') })
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (firstJournalHref && firstJournalHref !== '/user/practice/journal/new') {
    await captureRoute(
      page,
      'Phase 3',
      `journal entry ${firstJournalHref}`,
      firstJournalHref,
      { slug: 'p3-journal-entry-detail' },
    )
  }

  // Find an existing order
  await page.goto(BASE_URL + '/user/orders', { waitUntil: 'networkidle', timeout: 30000 })
  const firstOrderHref = await page
    .locator('a[href^="/user/orders/"]')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (firstOrderHref) {
    await captureRoute(page, 'Phase 3', `order detail ${firstOrderHref}`, firstOrderHref, {
      slug: 'p3-order-detail',
    })
  }

  // ─── Phase 4 — save + persistence ──────────────────────────────────────
  console.log('\n[Phase 4] profile save persistence')
  // 4.a edit preferredLanguage to a sentinel, save, reload, verify
  await page.goto(BASE_URL + '/user/profile/personal', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(1500)
  const sentinel = `audit-${Date.now()}`
  const langInput = page.locator('input').filter({ hasText: '' }).nth(3)
  // The page renders Fields via a custom helper; easier to target by label nearby
  // Use Playwright accessibility: find an input following label "Preferred language"
  const langField = page
    .locator('label', { hasText: /preferred language/i })
    .locator('xpath=following-sibling::input[1] | xpath=..//input')
    .first()
  await langField.fill(sentinel).catch(async () => {
    // Fallback: just fill the 3rd text input on the page
    await langInput.fill(sentinel)
  })
  await page.click('button:has-text("Save changes")')
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p4-profile-after-save.png'),
    fullPage: false,
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const langValueAfter = await langField.inputValue().catch(() => '(could not read)')
  findings.push({
    phase: 'Phase 4',
    step: 'preferredLanguage save persists',
    consoleErrors: [],
    networkErrors: [],
    notes: [`wrote: ${sentinel}`, `read back: ${langValueAfter}`],
    screenshot: 'p4-profile-after-save.png',
    verdict: langValueAfter === sentinel ? 'ok' : 'broken',
  })

  // 4.b clear preferredLanguage, save, reload, verify it's cleared
  await langField.fill('').catch(() => {})
  await page.click('button:has-text("Save changes")')
  await page.waitForTimeout(2500)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const langCleared = await langField.inputValue().catch(() => '(could not read)')
  findings.push({
    phase: 'Phase 4',
    step: 'preferredLanguage clear persists',
    consoleErrors: [],
    networkErrors: [],
    notes: [`read back: "${langCleared}"`],
    verdict: langCleared === '' ? 'ok' : 'broken',
  })

  // 4.c blank phone attempt — should show error, not save
  const phoneField = page
    .locator('label', { hasText: /phone number/i })
    .locator('xpath=following-sibling::input[1] | xpath=..//input')
    .first()
  const originalPhone = await phoneField.inputValue()
  await phoneField.fill('')
  await page.click('button:has-text("Save changes")')
  await page.waitForTimeout(1500)
  const phoneErr = await page
    .locator('text=/phone.*cannot|cannot.*cleared/i')
    .first()
    .textContent()
    .catch(() => null)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p4-phone-blank-error.png'),
    fullPage: false,
  })
  findings.push({
    phase: 'Phase 4',
    step: 'blanking phone surfaces error (sticky-required)',
    consoleErrors: [],
    networkErrors: [],
    notes: [`original phone: ${originalPhone}`, `error: ${phoneErr?.slice(0, 200) ?? '(none)'}`],
    screenshot: 'p4-phone-blank-error.png',
    verdict: phoneErr ? 'ok' : 'broken',
  })
  // restore phone to be safe
  await phoneField.fill(originalPhone || '9718812356')
  await page.click('button:has-text("Save changes")')
  await page.waitForTimeout(1500)

  // 4.d journal new entry persists
  console.log('[Phase 4] journal entry save')
  await page.goto(BASE_URL + '/user/practice/journal/new', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(1500)
  const journalSentinel = `Audit entry ${Date.now()}`
  const ta = page.locator('textarea').first()
  if (await ta.count()) {
    await ta.fill(journalSentinel)
    await page.screenshot({
      path: path.join(OUT_DIR, 'p4-journal-typed.png'),
      fullPage: false,
    })
    // Click any save button
    const saveBtn = page.getByRole('button', { name: /save|publish/i }).first()
    if (await saveBtn.count()) {
      await saveBtn.click().catch(() => {})
      await page.waitForTimeout(3000)
      const urlAfterSave = page.url()
      findings.push({
        phase: 'Phase 4',
        step: 'journal new save',
        consoleErrors: [],
        networkErrors: [],
        notes: [`wrote: ${journalSentinel}`, `url after save: ${urlAfterSave}`],
        screenshot: 'p4-journal-typed.png',
        verdict: urlAfterSave.includes('/journal') ? 'ok' : 'warn',
      })
    } else {
      findings.push({
        phase: 'Phase 4',
        step: 'journal new save',
        consoleErrors: [],
        networkErrors: [],
        notes: ['no save/publish button found'],
        verdict: 'note',
      })
    }
  } else {
    findings.push({
      phase: 'Phase 4',
      step: 'journal new editor',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no textarea found on /user/practice/journal/new'],
      verdict: 'broken',
    })
  }

  // ─── Phase 5 — payment flows up to Razorpay modal ──────────────────────
  console.log('\n[Phase 5] payment flows (stops at Razorpay modal)')
  // 5.a session booking
  await page.goto(BASE_URL + `/user/sessions/book?doctorId=${IDS.doctorId}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p5-book-doctor-loaded.png'),
    fullPage: true,
  })
  // Try clicking the first available slot
  const slotBtn = page.locator('button').filter({ hasText: /\d{1,2}:\d{2}/ }).first()
  const slotFound = await slotBtn.count()
  findings.push({
    phase: 'Phase 5',
    step: 'booking page slot picker',
    consoleErrors: [],
    networkErrors: [],
    notes: [`slot buttons found: ${slotFound}`],
    verdict: slotFound > 0 ? 'ok' : 'warn',
  })
  if (slotFound > 0) {
    await slotBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: path.join(OUT_DIR, 'p5-book-slot-selected.png'),
      fullPage: true,
    })
    // Click the proceed/pay button
    const payBtn = page.getByRole('button', { name: /pay|continue|proceed|book/i }).first()
    if (await payBtn.count()) {
      const payText = await payBtn.textContent()
      console.log('  clicking pay button:', payText)
      await payBtn.click().catch(() => {})
      // Wait for Razorpay modal iframe or close button
      await page.waitForTimeout(6000)
      const rzpIframe = await page.locator('iframe[src*="razorpay"]').count()
      await page.screenshot({
        path: path.join(OUT_DIR, 'p5-razorpay-modal-or-state.png'),
        fullPage: false,
      })
      findings.push({
        phase: 'Phase 5',
        step: 'session payment — Razorpay modal opened',
        consoleErrors: [],
        networkErrors: [],
        notes: [
          `pay button text: ${payText?.trim()}`,
          `razorpay iframe present: ${rzpIframe > 0}`,
          'NOTE: payment NOT completed — Suryansh to finish manually with test card',
        ],
        screenshot: 'p5-razorpay-modal-or-state.png',
        verdict: rzpIframe > 0 ? 'ok' : 'warn',
      })
      dbRowsCreated.push('Payment (PENDING) — session booking verify-first placeholder')
    }
  }

  // 5.b workshop registration — go to detail page
  await page.goto(BASE_URL + `/user/discover/workshops/${IDS.workshopId}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p5-workshop-detail-loaded.png'),
    fullPage: true,
  })
  const wsRegBtn = page.getByRole('button', { name: /register|pay/i }).first()
  if (await wsRegBtn.count()) {
    const wsText = await wsRegBtn.textContent()
    console.log('  workshop register button:', wsText)
    await wsRegBtn.click().catch(() => {})
    await page.waitForTimeout(6000)
    const rzpIframe = await page.locator('iframe[src*="razorpay"]').count()
    await page.screenshot({
      path: path.join(OUT_DIR, 'p5-workshop-after-register-click.png'),
      fullPage: false,
    })
    findings.push({
      phase: 'Phase 5',
      step: 'workshop payment — Razorpay modal opened',
      consoleErrors: [],
      networkErrors: [],
      notes: [
        `register button text: ${wsText?.trim()}`,
        `razorpay iframe present: ${rzpIframe > 0}`,
        'NOTE: payment NOT completed — Suryansh to finish manually with test card',
      ],
      screenshot: 'p5-workshop-after-register-click.png',
      verdict: rzpIframe > 0 ? 'ok' : 'warn',
    })
    if (rzpIframe > 0) {
      dbRowsCreated.push('Payment (PENDING) — workshop registration verify-first placeholder')
    }
  } else {
    findings.push({
      phase: 'Phase 5',
      step: 'workshop register button',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no register/pay button on workshop detail (may be already registered or free)'],
      verdict: 'note',
    })
  }

  // ─── Phase 6 — notifications + bell ────────────────────────────────────
  console.log('\n[Phase 6] notifications + bell')
  await page.goto(BASE_URL + '/user', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  // Check spine bell (desktop) — look in the navigation area
  const bellEl = page.locator('a[href*="/user/notifications"]').first()
  const bellHasBadge = await bellEl.locator('span').filter({ hasText: /^\d|9\+/ }).count()
  findings.push({
    phase: 'Phase 6',
    step: 'spine bell link present + badge',
    consoleErrors: [],
    networkErrors: [],
    notes: [`bell link count: ${await bellEl.count()}`, `badge present: ${bellHasBadge > 0}`],
    verdict: (await bellEl.count()) > 0 ? 'ok' : 'broken',
  })
  await bellEl.click().catch(() => {})
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: path.join(OUT_DIR, 'p6-notifications-after-click.png'),
    fullPage: true,
  })
  findings.push({
    phase: 'Phase 6',
    step: 'bell click lands on /user/notifications',
    consoleErrors: [],
    networkErrors: [],
    notes: [`final url: ${page.url()}`],
    screenshot: 'p6-notifications-after-click.png',
    verdict: page.url().endsWith('/user/notifications') ? 'ok' : 'broken',
  })
  // Reload — bell count should reflect mark-as-read
  await page.goto(BASE_URL + '/user', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  const bellBadgeAfter = await page
    .locator('a[href*="/user/notifications"] span')
    .filter({ hasText: /^\d|9\+/ })
    .count()
  findings.push({
    phase: 'Phase 6',
    step: 'bell badge after mark-as-read',
    consoleErrors: [],
    networkErrors: [],
    notes: [`badge present after reload: ${bellBadgeAfter > 0}`],
    verdict: 'note',
  })

  // ─── Phase 7 — cross-cutting ───────────────────────────────────────────
  console.log('\n[Phase 7] cross-cutting checks')
  // 7.a — read robots/sitemap content
  const robotsResp = await page.goto(BASE_URL + '/robots.txt', {
    waitUntil: 'domcontentloaded',
  })
  const robotsBody = await robotsResp?.text() ?? ''
  findings.push({
    phase: 'Phase 7',
    step: 'robots.txt content',
    consoleErrors: [],
    networkErrors: [],
    notes: [`body length: ${robotsBody.length}`, `first 200 chars: ${robotsBody.slice(0, 200)}`],
    verdict: robotsBody.includes('Sitemap') ? 'ok' : 'warn',
  })

  const sitemapResp = await page.goto(BASE_URL + '/sitemap.xml', {
    waitUntil: 'domcontentloaded',
  })
  const sitemapBody = await sitemapResp?.text() ?? ''
  const urlCount = (sitemapBody.match(/<url>/g) ?? []).length
  const hasRefund = sitemapBody.includes('/refund-policy')
  findings.push({
    phase: 'Phase 7',
    step: 'sitemap.xml content',
    consoleErrors: [],
    networkErrors: [],
    notes: [
      `<url> count: ${urlCount}`,
      `contains /refund-policy (broken — page is 404): ${hasRefund}`,
    ],
    verdict: hasRefund ? 'broken' : 'ok',
  })

  await fs.writeFile(
    path.join(OUT_DIR, '_findings-phase-3-7.json'),
    JSON.stringify({ findings, dbRowsCreated }, null, 2),
  )
  console.log(`\n=== DONE — ${findings.length} findings ===`)
  console.log('DB rows created:', dbRowsCreated)
  await browser.close()
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
