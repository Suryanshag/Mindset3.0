/**
 * Sprint UI-1.1 verification capture: targeted re-shoot of the 5 routes
 * touched by the contrast/region/heading fixes.
 *
 * Run:
 *   AUDIT_PASSWORD='<password>' npx tsx tools/screenshot-sprint-ui1-1-verification.ts
 */
import { chromium, Page } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'https://mindset-ten.vercel.app'
const ENGAGED_EMAIL = 'choudharysuryansh1111@gmail.com'
const PASSWORD = process.env.AUDIT_PASSWORD

if (!PASSWORD) {
  console.error('AUDIT_PASSWORD env required')
  process.exit(1)
}

// MN-2026-001 (engaged-user's only existing order; baseline audit ID).
const ORDER_ID = 'cmp8jjry50001jv27j2brvoai'

type RouteSpec = { route: string; filename: string }

const ROUTES: RouteSpec[] = [
  { route: '/user', filename: 'user.png' },
  { route: '/user/practice', filename: 'user__practice.png' },
  { route: '/user/cart', filename: 'user__cart.png' },
  { route: `/user/orders/${ORDER_ID}`, filename: `user__orders__${ORDER_ID}.png` },
  { route: '/user/profile', filename: 'user__profile.png' },
]

type CaptureResult = {
  route: string
  filename: string
  status: number
  error: string | null
}

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const OUT_DIR = path.join('docs/ui-audit', `sprint-ui1-1-verification-${TIMESTAMP}`)

async function login(page: Page, email: string, password: string) {
  console.log(`  logging in as ${email}`)
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('  logged in')
}

async function settlePage(page: Page) {
  await page.evaluate(async () => {
    const stepPx = Math.floor(window.innerHeight * 0.6)
    let y = 0
    const maxY = document.documentElement.scrollHeight
    while (y < maxY) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
      y += stepPx
    }
    window.scrollTo(0, maxY)
    await new Promise((r) => setTimeout(r, 300))
  })

  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'))
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve(undefined)
              return
            }
            img.addEventListener('load', () => resolve(undefined), { once: true })
            img.addEventListener('error', () => resolve(undefined), { once: true })
            setTimeout(() => resolve(undefined), 4000)
          })
      )
    )
  })

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  })

  await page.evaluate(async () => {
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 400))
  })
}

async function captureRoute(page: Page, spec: RouteSpec): Promise<CaptureResult> {
  const dest = path.join(OUT_DIR, spec.filename)
  try {
    const response = await page.goto(BASE_URL + spec.route, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    const status = response?.status() ?? 0
    if (status >= 500) {
      return { route: spec.route, filename: spec.filename, status, error: `HTTP ${status}` }
    }
    await settlePage(page)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: dest, fullPage: true })
    return { route: spec.route, filename: spec.filename, status, error: null }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { route: spec.route, filename: spec.filename, status: 0, error: msg }
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  console.log('Output dir:', OUT_DIR)

  const browser = await chromium.launch({ headless: true })
  const results: CaptureResult[] = []

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await login(page, ENGAGED_EMAIL, PASSWORD!)

    for (const spec of ROUTES) {
      const r = await captureRoute(page, spec)
      results.push(r)
      console.log(`  ${!r.error ? '✓' : '✗'} ${spec.filename} [HTTP ${r.status}]${r.error ? ` — ${r.error}` : ''}`)
    }

    await context.close()
  } finally {
    await browser.close()
  }

  const successes = results.filter((r) => !r.error)
  const failures = results.filter((r) => r.error)
  const non200 = successes.filter((r) => r.status !== 200)

  const lines: string[] = []
  lines.push(`# Sprint UI-1.1 — Verification capture — ${TIMESTAMP}`)
  lines.push('')
  lines.push(`Base URL: ${BASE_URL}`)
  lines.push(`Viewport: 1440 × 900 (chromium headless)`)
  lines.push(`Test account: ${ENGAGED_EMAIL}`)
  lines.push(`Order ID used for /user/orders/[id]: \`${ORDER_ID}\` (MN-2026-001)`)
  lines.push('')
  lines.push(`## Captures (${successes.length}/${ROUTES.length})`)
  lines.push('')
  for (const r of successes) {
    const tag = r.status !== 200 ? ` _[HTTP ${r.status}]_` : ''
    lines.push(`- \`${r.filename}\` — \`${BASE_URL}${r.route}\`${tag}`)
  }
  if (non200.length > 0) {
    lines.push('')
    lines.push(`## Non-200 statuses (${non200.length})`)
    lines.push('')
    for (const r of non200) {
      lines.push(`- \`${BASE_URL}${r.route}\` → HTTP ${r.status} → \`${r.filename}\``)
    }
  }
  if (failures.length > 0) {
    lines.push('')
    lines.push(`## Failed captures (${failures.length})`)
    lines.push('')
    for (const r of failures) {
      lines.push(`- \`${BASE_URL}${r.route}\`: ${r.error}${r.status ? ` [HTTP ${r.status}]` : ''}`)
    }
  }

  await fs.writeFile(path.join(OUT_DIR, 'INDEX.md'), lines.join('\n') + '\n')
  console.log(`\nWrote INDEX.md (${successes.length} captures, ${non200.length} non-200, ${failures.length} failures)`)
}

main().catch((err) => {
  console.error('Unhandled:', err)
  process.exit(1)
})
