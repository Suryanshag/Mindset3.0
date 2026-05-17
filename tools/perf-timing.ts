/**
 * One-shot perf timing run against production.
 *
 * Captures:
 *   - cold + warm login flow (POST /api/auth/callback/credentials, then /user GET)
 *   - 3 navigations between dashboard pages (/user → sessions → practice → discover)
 *
 * Run:
 *   AUDIT_PASSWORD='<password>' npx tsx tools/perf-timing.ts
 */
import { chromium, type Page, type Request, type Response } from 'playwright'

const BASE_URL = 'https://mindset-ten.vercel.app'
const ENGAGED_EMAIL = 'choudharysuryansh1111@gmail.com'
const PASSWORD = process.env.AUDIT_PASSWORD
if (!PASSWORD) {
  console.error('AUDIT_PASSWORD env required')
  process.exit(1)
}

type Sample = { url: string; method: string; status: number; durationMs: number }

function attach(page: Page, samples: Sample[]) {
  const starts = new Map<Request, number>()
  page.on('request', (req) => starts.set(req, Date.now()))
  page.on('response', async (res: Response) => {
    const req = res.request()
    const t = starts.get(req)
    if (!t) return
    starts.delete(req)
    const url = res.url()
    // Only record top-level navigations + auth + cron-y API endpoints; ignore
    // static asset noise.
    if (
      url.includes('/api/auth/') ||
      url.includes('/api/user/') ||
      (url.startsWith(BASE_URL) && !/\.(?:js|css|png|svg|ico|woff2?|jpg|webp|map)(?:\?|$)/.test(url))
    ) {
      samples.push({
        url: url.replace(BASE_URL, ''),
        method: req.method(),
        status: res.status(),
        durationMs: Date.now() - t,
      })
    }
  })
}

async function timeLogin(page: Page) {
  const t0 = Date.now()
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 60000 })
  const tLoginPageLoaded = Date.now()
  await page.waitForTimeout(1200)
  await page.fill('#email', ENGAGED_EMAIL)
  await page.fill('#password', PASSWORD!)
  const tClick = Date.now()
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  const tUrlChanged = Date.now()
  // Wait for the dashboard to actually finish rendering (networkidle).
  await page.waitForLoadState('networkidle', { timeout: 60000 })
  const tDashboardReady = Date.now()

  return {
    loginPageLoad: tLoginPageLoaded - t0,
    submitToUrlChange: tUrlChanged - tClick,
    submitToDashboardReady: tDashboardReady - tClick,
    total: tDashboardReady - tClick,
  }
}

async function timeNavigation(page: Page, route: string) {
  const t0 = Date.now()
  await page.goto(BASE_URL + route, { waitUntil: 'commit', timeout: 60000 })
  const tCommit = Date.now()
  await page.waitForLoadState('networkidle', { timeout: 60000 })
  return {
    route,
    domContent: tCommit - t0,
    networkidle: Date.now() - t0,
  }
}

function summarize(samples: Sample[], filterPrefix?: string) {
  const filtered = filterPrefix
    ? samples.filter((s) => s.url.startsWith(filterPrefix))
    : samples
  return filtered.map((s) => `    ${s.method} ${s.url} → ${s.status} in ${s.durationMs}ms`).join('\n')
}

async function main() {
  console.log('=== Perf timing run vs ' + BASE_URL + ' ===\n')

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const samples: Sample[] = []
  attach(page, samples)

  try {
    console.log('--- 1) Cold login flow ---')
    const cold = await timeLogin(page)
    console.log(`  loginPageLoad        ${cold.loginPageLoad}ms`)
    console.log(`  submit → urlChange   ${cold.submitToUrlChange}ms  (server auth + 302)`)
    console.log(`  submit → networkidle ${cold.submitToDashboardReady}ms  (full /user render)`)
    console.log(`  total perceived      ${cold.total}ms`)
    console.log('  network samples (login flow):')
    console.log(summarize(samples))

    // Reset cookies so the second login is also cold-ish (well, function is
    // warm now but tokens are fresh).
    await ctx.clearCookies()
    samples.length = 0

    console.log('\n--- 2) Warm login flow (cookies cleared, function warm) ---')
    const warm = await timeLogin(page)
    console.log(`  loginPageLoad        ${warm.loginPageLoad}ms`)
    console.log(`  submit → urlChange   ${warm.submitToUrlChange}ms`)
    console.log(`  submit → networkidle ${warm.submitToDashboardReady}ms`)
    console.log(`  total perceived      ${warm.total}ms`)
    console.log('  network samples (warm login):')
    console.log(summarize(samples))

    samples.length = 0
    console.log('\n--- 3) Dashboard navigations (warm function) ---')
    const navRoutes = ['/user/sessions', '/user/practice', '/user/discover', '/user/library', '/user/orders']
    for (const r of navRoutes) {
      const nav = await timeNavigation(page, r)
      console.log(`  ${r.padEnd(20)}  domContent ${String(nav.domContent).padStart(5)}ms   networkidle ${String(nav.networkidle).padStart(5)}ms`)
    }

    console.log('\n  navigation network samples (top-level docs):')
    console.log(summarize(samples.filter((s) => s.url.startsWith('/user'))))

    samples.length = 0
    console.log('\n--- 4) Repeat /user/sessions (already-warm route) ---')
    const repeat = await timeNavigation(page, '/user/sessions')
    console.log(`  /user/sessions       domContent ${repeat.domContent}ms   networkidle ${repeat.networkidle}ms`)
  } finally {
    await ctx.close()
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Unhandled:', err)
  process.exit(1)
})
