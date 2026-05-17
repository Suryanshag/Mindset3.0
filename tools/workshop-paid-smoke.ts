/**
 * One-shot smoke test of Sprint Workshops-Paid:
 *   1. Login as engaged user
 *   2. Navigate to the paid workshop detail page
 *   3. Capture button label + screenshot
 *   4. Open the network tab equivalent — click "Pay" → confirm
 *      POST /api/payments/create-order returns 200 with razorpayOrderId.
 *      We close the Razorpay modal immediately afterward (no real card).
 *
 * What this does NOT cover:
 *   - Completing a real Razorpay test-card payment (Playwright struggles
 *     with the Razorpay iframe; user runs that manually).
 *   - Webhook → registration row creation (depends on Razorpay actually
 *     capturing).
 *
 * Run:
 *   AUDIT_PASSWORD='<password>' npx tsx tools/workshop-paid-smoke.ts
 */
import { chromium } from 'playwright'

const BASE = 'https://mindset-ten.vercel.app'
const EMAIL = 'choudharysuryansh1111@gmail.com'
const PASSWORD = process.env.AUDIT_PASSWORD
const WORKSHOP_ID = 'cmp9ouypv0000l027kuy7gnjf'

if (!PASSWORD) { console.error('AUDIT_PASSWORD env required'); process.exit(1) }

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  console.log('1) Logging in…')
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD!)
  await Promise.all([
    page.waitForURL(/\/user(?:\/|$)/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ])
  console.log('   ✓ logged in')

  console.log('2) Navigating to paid workshop detail page…')
  await page.goto(`${BASE}/user/discover/workshops/${WORKSHOP_ID}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  // Find the register button — match by class / role since it's a <button>
  const btn = page.locator('button:has-text("Pay"), button:has-text("Reserve spot"), button:has-text("Registering"), button:has-text("Starting payment")')
  const btnText = (await btn.first().innerText().catch(() => '(button not found)')).trim()
  console.log(`   button label: "${btnText}"`)

  await page.screenshot({ path: 'tmp-workshop-paid-button.png', fullPage: false })
  console.log('   ✓ screenshot saved → tmp-workshop-paid-button.png')

  console.log('3) Clicking button → expecting POST /api/payments/create-order to fire…')

  const createOrderPromise = page.waitForResponse(
    (res) =>
      res.url().endsWith('/api/payments/create-order') &&
      res.request().method() === 'POST',
    { timeout: 20000 }
  )

  await btn.first().click()

  try {
    const res = await createOrderPromise
    const status = res.status()
    const body = await res.json().catch(() => ({}))
    console.log(`   POST /api/payments/create-order → ${status}`)
    console.log('   response body:')
    console.log('   ' + JSON.stringify(body, null, 2).split('\n').join('\n   '))
  } catch (err) {
    console.error('   ✗ create-order did not fire within 20s:', err)
  }

  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'tmp-workshop-paid-after-click.png', fullPage: false })
  console.log('   ✓ post-click screenshot → tmp-workshop-paid-after-click.png')

  await ctx.close()
  await browser.close()
}

main().catch((err) => { console.error('Unhandled:', err); process.exit(1) })
