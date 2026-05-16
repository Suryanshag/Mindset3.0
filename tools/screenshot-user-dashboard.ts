/**
 * UI audit: full-page screenshots of every desktop /user/* route.
 *
 * Run with:
 *   AUDIT_PASSWORD='<password>' npx tsx tools/screenshot-user-dashboard.ts
 *
 * Output: docs/ui-audit/<timestamp>/<slug>--<state>.png + INDEX.md
 */
import { chromium, Page } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'https://mindset-ten.vercel.app'

const ENGAGED_EMAIL = 'choudharysuryansh1111@gmail.com'
const EMPTY_EMAIL = 'audit-empty-1778946648892@mindset.test'
const PASSWORD = process.env.AUDIT_PASSWORD

if (!PASSWORD) {
  console.error('AUDIT_PASSWORD env required')
  process.exit(1)
}

// Seeded test data IDs
const IDS = {
  doctorId: 'cmmk305d40002tb3e378vjp5f',
  upcomingSessionId: 'cmp8iwkr500051327fic8ymu6',
  pastSessionId: 'cmp86o4b5000104l4w0vkj6dl',
  journalEntryId: 'cmp8iwk5q00001327w9r950q9',
  assignmentId: 'cmp8iwkd200021327xlw3tjkk',
  workshopId: 'cmp8iwkjx00041327ux4xgpy0',
  productId: 'cmmk306a0000ftb3es7otzjgn',
  orderId: 'cmp8jjry50001jv27j2brvoai',
}

type RouteSpec = { route: string; slug: string; state: 'engaged' | 'empty' }

const ENGAGED_ROUTES: RouteSpec[] = [
  // Home + reflection
  { route: '/user', slug: 'user-home', state: 'engaged' },
  { route: '/user/reflection/today', slug: 'user-reflection-today', state: 'engaged' },

  // Sessions
  { route: '/user/sessions', slug: 'user-sessions', state: 'engaged' },
  { route: `/user/sessions/${IDS.upcomingSessionId}`, slug: 'user-sessions-detail-upcoming', state: 'engaged' },
  { route: `/user/sessions/${IDS.pastSessionId}`, slug: 'user-sessions-detail-past', state: 'engaged' },
  { route: '/user/sessions/book', slug: 'user-sessions-book-list', state: 'engaged' },
  { route: `/user/sessions/book?doctorId=${IDS.doctorId}`, slug: 'user-sessions-book-doctor', state: 'engaged' },

  // Practice
  { route: '/user/practice', slug: 'user-practice', state: 'engaged' },
  { route: '/user/practice/journal', slug: 'user-practice-journal', state: 'engaged' },
  { route: '/user/practice/journal/new', slug: 'user-practice-journal-new', state: 'engaged' },
  { route: `/user/practice/journal/${IDS.journalEntryId}`, slug: 'user-practice-journal-detail', state: 'engaged' },
  { route: '/user/practice/assignments', slug: 'user-practice-assignments', state: 'engaged' },
  { route: `/user/practice/assignments/${IDS.assignmentId}`, slug: 'user-practice-assignments-detail', state: 'engaged' },
  { route: '/user/practice/mindfulness', slug: 'user-practice-mindfulness', state: 'engaged' },

  // Discover
  { route: '/user/discover', slug: 'user-discover', state: 'engaged' },
  { route: '/user/discover/workshops', slug: 'user-discover-workshops', state: 'engaged' },
  { route: `/user/discover/workshops/${IDS.workshopId}`, slug: 'user-discover-workshops-detail', state: 'engaged' },
  { route: '/user/library', slug: 'user-library', state: 'engaged' },

  // Shop / orders / cart
  { route: '/user/shop', slug: 'user-shop', state: 'engaged' },
  { route: `/user/shop/${IDS.productId}`, slug: 'user-shop-detail', state: 'engaged' },
  { route: '/user/cart', slug: 'user-cart-with-item', state: 'engaged' },
  { route: '/user/orders', slug: 'user-orders', state: 'engaged' },
  { route: `/user/orders/${IDS.orderId}`, slug: 'user-orders-detail', state: 'engaged' },

  // Profile + notifications
  { route: '/user/profile', slug: 'user-profile', state: 'engaged' },
  { route: '/user/notifications', slug: 'user-notifications', state: 'engaged' },
]

const EMPTY_ROUTES: RouteSpec[] = [
  { route: '/user', slug: 'user-home', state: 'empty' },
  { route: '/user/practice', slug: 'user-practice', state: 'empty' },
  { route: '/user/practice/journal', slug: 'user-practice-journal', state: 'empty' },
  { route: '/user/practice/assignments', slug: 'user-practice-assignments', state: 'empty' },
  { route: '/user/library', slug: 'user-library', state: 'empty' },
  { route: '/user/orders', slug: 'user-orders', state: 'empty' },
  { route: '/user/cart', slug: 'user-cart', state: 'empty' },
  { route: '/user/discover/workshops', slug: 'user-discover-workshops', state: 'empty' },
]

type CaptureResult = {
  route: string
  slug: string
  state: string
  status: number
  filename: string | null
  error: string | null
}

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const OUT_DIR = path.join('docs/ui-audit', TIMESTAMP)

async function login(page: Page, email: string, password: string) {
  console.log(`  logging in as ${email}`)
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 60000 })
  // Wait for React hydration — without this, clicking submit triggers the
  // browser's default GET form submission instead of the react-hook-form
  // onSubmit handler.
  await page.waitForTimeout(1500)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('  logged in')
}

/**
 * Walks the page top→bottom to trigger lazy-loaded images and Intersection-
 * Observer-driven content, then waits for every <img> to finish loading
 * (or error) and for web fonts to be ready. Finally returns to the top so
 * the screenshot starts at the natural origin.
 */
/**
 * Walks the page top→bottom to trigger lazy-loaded images and IntersectionObservers,
 * waits for images and fonts, returns to top. All helpers inlined to avoid
 * tsx/esbuild's __name instrumentation of named functions inside page.evaluate.
 */
async function settlePage(page: Page) {
  // Stage 1: scroll to trigger lazy loads.
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

  // Stage 2: wait for all currently-rendered images to finish.
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

  // Stage 3: fonts.
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  })

  // Stage 4: back to top.
  await page.evaluate(async () => {
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 400))
  })
}

async function captureRoute(page: Page, spec: RouteSpec): Promise<CaptureResult> {
  const filename = `${spec.slug}--${spec.state}.png`
  const dest = path.join(OUT_DIR, filename)
  try {
    const response = await page.goto(BASE_URL + spec.route, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    const status = response?.status() ?? 0
    if (status >= 500) {
      return { route: spec.route, slug: spec.slug, state: spec.state, status, filename: null, error: `HTTP ${status}` }
    }
    // Trigger lazy loads, wait for images + fonts, then settle.
    await settlePage(page)
    // Extra grace for any client-side data fetches that fired after networkidle.
    await page.waitForTimeout(2000)
    await page.screenshot({ path: dest, fullPage: true })
    return { route: spec.route, slug: spec.slug, state: spec.state, status, filename, error: null }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { route: spec.route, slug: spec.slug, state: spec.state, status: 0, filename: null, error: msg }
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  console.log('Output dir:', OUT_DIR)

  const browser = await chromium.launch({ headless: true })
  const results: CaptureResult[] = []

  try {
    // ─── Pass 1: Engaged user ──────────────────────────────────────────
    console.log('\n[1/2] Engaged user pass')
    let context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    let page = await context.newPage()
    await login(page, ENGAGED_EMAIL, PASSWORD!)
    for (const spec of ENGAGED_ROUTES) {
      const r = await captureRoute(page, spec)
      results.push(r)
      console.log(`  ${r.filename ? '✓' : '✗'} ${spec.slug} [HTTP ${r.status}]${r.error ? ` — ${r.error}` : ''}`)
    }
    await context.close()

    // ─── Pass 2: Empty user ────────────────────────────────────────────
    console.log('\n[2/2] Empty user pass')
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    page = await context.newPage()
    await login(page, EMPTY_EMAIL, PASSWORD!)
    for (const spec of EMPTY_ROUTES) {
      const r = await captureRoute(page, spec)
      results.push(r)
      console.log(`  ${r.filename ? '✓' : '✗'} ${spec.slug} [HTTP ${r.status}]${r.error ? ` — ${r.error}` : ''}`)
    }
    await context.close()
  } finally {
    await browser.close()
  }

  // ─── Write INDEX.md ──────────────────────────────────────────────────
  const successes = results.filter((r) => r.filename)
  const failures = results.filter((r) => !r.filename)
  const non200 = successes.filter((r) => r.status !== 200)

  const lines: string[] = []
  lines.push(`# UI Audit — ${TIMESTAMP}`)
  lines.push('')
  lines.push(`Base URL: ${BASE_URL}`)
  lines.push(`Viewport: 1440 × 900 (chromium headless)`)
  lines.push(`Test account (engaged): ${ENGAGED_EMAIL}`)
  lines.push(`Test account (empty): ${EMPTY_EMAIL}`)
  lines.push('')
  lines.push(`Seeded data on engaged account:`)
  lines.push(`- Upcoming session (${IDS.upcomingSessionId}): CONFIRMED, ~3 days out, Dr. Ananya Sharma`)
  lines.push(`- Past session (${IDS.pastSessionId}): existing pre-seed`)
  lines.push(`- 2 journal entries (one detailed, one short)`)
  lines.push(`- 2 assignments (1 pending, 1 completed)`)
  lines.push(`- 1 published workshop + registration`)
  lines.push(`- 1 cart item (Mindset Gratitude Journal)`)
  lines.push(`- 1 delivered order (${IDS.orderId})`)
  lines.push('')
  lines.push(`## Engaged-user captures (${successes.filter((s) => s.state === 'engaged').length})`)
  lines.push('')
  for (const r of successes.filter((s) => s.state === 'engaged')) {
    const note = r.status !== 200 ? ` _[HTTP ${r.status}]_` : ''
    lines.push(`- \`${r.filename}\` — \`${r.route}\`${note}`)
  }
  lines.push('')
  lines.push(`## Empty-user captures (${successes.filter((s) => s.state === 'empty').length})`)
  lines.push('')
  for (const r of successes.filter((s) => s.state === 'empty')) {
    const note = r.status !== 200 ? ` _[HTTP ${r.status}]_` : ''
    lines.push(`- \`${r.filename}\` — \`${r.route}\`${note}`)
  }
  if (non200.length > 0) {
    lines.push('')
    lines.push(`## Non-200 statuses (${non200.length})`)
    lines.push('')
    lines.push('These routes loaded but returned a non-200 HTTP status. The screenshot captured whatever the browser rendered (typically a 404 page).')
    lines.push('')
    for (const r of non200) {
      lines.push(`- \`${r.route}\` (${r.state}) → HTTP ${r.status} → \`${r.filename}\``)
    }
  }
  if (failures.length > 0) {
    lines.push('')
    lines.push(`## Failed captures (${failures.length})`)
    lines.push('')
    for (const r of failures) {
      lines.push(`- \`${r.route}\` (${r.state}): ${r.error}${r.status ? ` [HTTP ${r.status}]` : ''}`)
    }
  }

  await fs.writeFile(path.join(OUT_DIR, 'INDEX.md'), lines.join('\n') + '\n')
  console.log(`\nWrote INDEX.md (${successes.length} captures, ${non200.length} non-200, ${failures.length} failures)`)
}

main().catch((err) => {
  console.error('Unhandled:', err)
  process.exit(1)
})
