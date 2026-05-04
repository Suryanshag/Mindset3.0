import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots/11d';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Login
  console.log('1. Logging in...');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/user/, { timeout: 15000 });
  console.log('   Logged in');

  // 1. Shop list — verify badge color (bg-primary, not bg-accent)
  console.log('2. Shop list...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  // Add an item first to see the badge
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/cosmetic-01-shop-badge.png`, fullPage: true });
  console.log('   Screenshot: shop with cart badge');

  // 2. Product detail — verify Add to Cart button is sage (not teal)
  console.log('3. Product detail...');
  await page.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/cosmetic-02-pdp-button.png`, fullPage: true });
  console.log('   Screenshot: PDP button color');

  // 3. Cart page — verify trash icon has no double border
  console.log('4. Cart page...');
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/cosmetic-03-cart-trash.png`, fullPage: true });
  console.log('   Screenshot: cart page trash button');

  // 4. Shop list — verify "In cart" badge is sage (not green)
  console.log('5. In-cart badge...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/cosmetic-04-in-cart-badge.png`, fullPage: true });
  console.log('   Screenshot: in-cart badge color');

  // 5. Empty cart redirect — clear cart, then go to checkout
  console.log('6. Empty cart redirect...');
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  // Clear all items
  let removed = true;
  while (removed) {
    removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trashBtn = btns.find(b => b.querySelector('svg.lucide-trash-2') && b.offsetParent !== null);
      if (trashBtn) { trashBtn.click(); return true; }
      return false;
    });
    if (removed) await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(500);
  // Now go to checkout with empty cart
  await page.goto(`${BASE}/user/orders/checkout`);
  await page.waitForTimeout(3000);
  const redirectUrl = page.url();
  console.log('   Redirected to:', redirectUrl);
  await page.screenshot({ path: `${SHOTS}/cosmetic-05-empty-redirect.png`, fullPage: true });
  console.log('   Screenshot: empty cart redirect');

  await browser.close();
  console.log('\nDone. Screenshots in', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
