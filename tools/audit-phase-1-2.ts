/**
 * Pre-launch audit — Phase 1 (public marketing) + Phase 2 (signup/auth).
 * Incognito. Captures screenshots + per-route findings to a JSON log.
 *
 * Run:
 *   AUDIT_OUT=docs/audit-screenshots/<ts> npx tsx tools/audit-phase-1-2.ts
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'https://mindset-ten.vercel.app'
const OUT_DIR = process.env.AUDIT_OUT || `docs/audit-screenshots/${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .slice(0, 19)}`

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

async function captureRoute(
  page: Page,
  phase: string,
  step: string,
  routeOrUrl: string,
  options: { fullName?: string; skipScreenshot?: boolean; waitMs?: number } = {},
): Promise<Finding> {
  const fullName = options.fullName ?? step
  const url = routeOrUrl.startsWith('http') ? routeOrUrl : BASE_URL + routeOrUrl
  console.log(`\n[${phase}] ${step} -> ${url}`)

  const consoleErrors: string[] = []
  const networkErrors: string[] = []

  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 220))
  }
  const onResponse = (r: import('playwright').Response) => {
    const s = r.status()
    if (s >= 400 && !r.url().includes('favicon')) {
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

    if (!options.skipScreenshot) {
      const file = `${fullName}.png`
      await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true })
      f.screenshot = file
    }

    const title = await page.title()
    f.notes.push(`title: ${title}`)
  } catch (err) {
    f.notes.push(`navigation error: ${(err as Error).message.slice(0, 200)}`)
    f.verdict = 'broken'
  }

  page.off('console', onConsole)
  page.off('response', onResponse)
  findings.push(f)
  return f
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

  // ─── Phase 1 — public marketing site ────────────────────────────────────
  const publicRoutes: { route: string; slug: string }[] = [
    { route: '/', slug: 'p1-home' },
    { route: '/about', slug: 'p1-about' },
    { route: '/doctors', slug: 'p1-doctors' },
    { route: '/products', slug: 'p1-products' },
    { route: '/study-materials', slug: 'p1-study-materials' },
    { route: '/workshops', slug: 'p1-workshops' },
    { route: '/ngo-visits', slug: 'p1-ngo-visits' },
    { route: '/ngo-visits/join', slug: 'p1-ngo-join-redirect' },
    { route: '/team', slug: 'p1-team' },
    { route: '/privacy-policy', slug: 'p1-privacy-policy' },
    { route: '/terms-of-use', slug: 'p1-terms-of-use' },
    { route: '/cookies', slug: 'p1-cookies' },
    { route: '/refund-policy', slug: 'p1-refund-policy' },
    { route: '/contact', slug: 'p1-contact' },
    { route: '/login', slug: 'p1-login' },
    { route: '/register', slug: 'p1-register' },
    { route: '/robots.txt', slug: 'p1-robots' },
    { route: '/sitemap.xml', slug: 'p1-sitemap' },
  ]
  for (const r of publicRoutes) {
    await captureRoute(page, 'Phase 1', `route ${r.route}`, r.route, { fullName: r.slug })
  }

  // ─── Phase 1.b — CTA click-tests on /ngo-visits ─────────────────────────
  console.log('\n[Phase 1] CTA tests — /ngo-visits')
  await page.goto(BASE_URL + '/ngo-visits', { waitUntil: 'networkidle', timeout: 30000 })
  const ngoBtn = page.getByRole('link', { name: /join now/i }).first()
  if (await ngoBtn.count()) {
    const ngoHref = await ngoBtn.getAttribute('href')
    findings.push({
      phase: 'Phase 1',
      step: '/ngo-visits "Join Now" CTA href (logged out)',
      consoleErrors: [],
      networkErrors: [],
      notes: [`href: ${ngoHref}`],
      verdict: ngoHref?.includes('/login') ? 'ok' : 'warn',
    })
  } else {
    findings.push({
      phase: 'Phase 1',
      step: '/ngo-visits Join Now CTA',
      consoleErrors: [],
      networkErrors: [],
      notes: ['Join Now link not found on /ngo-visits'],
      verdict: 'broken',
    })
  }

  // ─── Phase 1.c — workshop card → detail probe ───────────────────────────
  console.log('\n[Phase 1] /workshops card click probe')
  await page.goto(BASE_URL + '/workshops', { waitUntil: 'networkidle', timeout: 30000 })
  const workshopCards = page.locator('[class*="card"], [class*="workshop"]')
  const cardCount = await workshopCards.count()
  findings.push({
    phase: 'Phase 1',
    step: '/workshops card count',
    consoleErrors: [],
    networkErrors: [],
    notes: [`cards found: ${cardCount}`],
    verdict: cardCount > 0 ? 'ok' : 'warn',
  })

  // Look for any "Register Interest" or "Join" button text
  const registerBtn = page.getByRole('button', { name: /register|interest|join/i }).first()
  const regBtnCount = await registerBtn.count()
  if (regBtnCount) {
    const btnText = await registerBtn.textContent()
    findings.push({
      phase: 'Phase 1',
      step: '/workshops register/join button',
      consoleErrors: [],
      networkErrors: [],
      notes: [`button text: ${btnText?.trim()}`],
    })
  } else {
    findings.push({
      phase: 'Phase 1',
      step: '/workshops register/join button',
      consoleErrors: [],
      networkErrors: [],
      notes: ['no register/join button found on /workshops'],
      verdict: 'note',
    })
  }

  // ─── Phase 1.d — Cookie banner on first visit ──────────────────────────
  console.log('\n[Phase 1] Cookie banner test (fresh context)')
  const cookieCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const cookiePage = await cookieCtx.newPage()
  await cookiePage.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 })
  await cookiePage.waitForTimeout(800) // let CookieBanner mount
  await cookiePage.screenshot({
    path: path.join(OUT_DIR, 'p1-cookie-banner-fresh.png'),
    fullPage: false,
  })
  const bannerVisible = await cookiePage.getByText(/we use cookies/i).count()
  findings.push({
    phase: 'Phase 1',
    step: 'cookie banner appears on first visit',
    consoleErrors: [],
    networkErrors: [],
    notes: [`banner visible: ${bannerVisible > 0}`],
    screenshot: 'p1-cookie-banner-fresh.png',
    verdict: bannerVisible > 0 ? 'ok' : 'broken',
  })

  if (bannerVisible > 0) {
    await cookiePage.getByRole('button', { name: /customize/i }).first().click()
    await cookiePage.waitForTimeout(400)
    const modalVisible = await cookiePage.getByText(/cookie preferences/i).count()
    await cookiePage.screenshot({
      path: path.join(OUT_DIR, 'p1-cookie-customize-modal.png'),
      fullPage: false,
    })
    findings.push({
      phase: 'Phase 1',
      step: 'cookie Customize opens modal',
      consoleErrors: [],
      networkErrors: [],
      notes: [`modal visible: ${modalVisible > 0}`],
      screenshot: 'p1-cookie-customize-modal.png',
      verdict: modalVisible > 0 ? 'ok' : 'broken',
    })
  }
  await cookieCtx.close()

  // ─── Phase 2 — auth flows (incognito) ──────────────────────────────────
  console.log('\n[Phase 2] auth flows')

  // 2.a wrong password
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  await page.fill('#email', 'choudharysuryansh1111@gmail.com')
  await page.fill('#password', 'definitely-not-the-password-xyz')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(OUT_DIR, 'p2-wrong-password.png'), fullPage: false })
  const errBox = await page.locator('text=/invalid|incorrect|wrong|locked/i').first().textContent().catch(() => null)
  findings.push({
    phase: 'Phase 2',
    step: 'wrong password — error shown',
    consoleErrors: [],
    networkErrors: [],
    notes: [`error message: ${errBox?.slice(0, 200) ?? '(none captured)'}`],
    screenshot: 'p2-wrong-password.png',
    verdict: errBox ? 'ok' : 'warn',
  })

  // 2.b invalid email format
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  await page.fill('#email', 'not-an-email')
  await page.fill('#password', 'something')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT_DIR, 'p2-invalid-email.png'), fullPage: false })
  const emailErr = await page.locator('text=/invalid|valid email/i').first().textContent().catch(() => null)
  findings.push({
    phase: 'Phase 2',
    step: 'invalid email — error shown',
    consoleErrors: [],
    networkErrors: [],
    notes: [`error message: ${emailErr?.slice(0, 200) ?? '(none captured)'}`],
    screenshot: 'p2-invalid-email.png',
    verdict: emailErr ? 'ok' : 'warn',
  })

  // 2.c /register page (just verify it loads — skip actual signup to avoid creating a user)
  await page.goto(BASE_URL + '/register', { waitUntil: 'networkidle', timeout: 30000 })
  await page.screenshot({ path: path.join(OUT_DIR, 'p2-register-page.png'), fullPage: true })
  const regHasForm = await page.locator('form').count()
  findings.push({
    phase: 'Phase 2',
    step: '/register page loads with form',
    consoleErrors: [],
    networkErrors: [],
    notes: [`form count: ${regHasForm}`],
    screenshot: 'p2-register-page.png',
    verdict: regHasForm > 0 ? 'ok' : 'broken',
  })

  // 2.d forgot password page (if exists)
  await captureRoute(page, 'Phase 2', '/forgot-password', '/forgot-password', {
    fullName: 'p2-forgot-password',
  })

  await fs.writeFile(
    path.join(OUT_DIR, '_findings-phase-1-2.json'),
    JSON.stringify(findings, null, 2),
  )
  console.log(`\n=== DONE — ${findings.length} findings written ===`)
  await browser.close()
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
