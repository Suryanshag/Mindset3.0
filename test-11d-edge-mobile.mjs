import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots/11d';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // === EDGE CASES (desktop) ===
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Login
  console.log('=== EDGE CASES ===');
  console.log('1. Logging in...');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/user/, { timeout: 15000 });

  // 9a. Out-of-stock PDP — use a product we know (Anxiety Relief Fidget Kit)
  // We can't set stock=0 from here without DB access, but we can verify the UI shows stock count
  console.log('9a. Stock display on PDP...');
  await page.goto(`${BASE}/user/shop/cmmk306fd000gtb3eg9gmynar`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11d-edge-9a-stock-pdp.png`, fullPage: true });

  // 9d. Empty cart at checkout
  console.log('9d. Empty cart at checkout...');
  // Clear cart first
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
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
  await page.goto(`${BASE}/user/orders/checkout`);
  await page.waitForTimeout(3000);
  const redirectUrl = page.url();
  console.log('   Redirected to:', redirectUrl);
  await page.screenshot({ path: `${SHOTS}/11d-edge-9d-empty-redirect.png`, fullPage: true });

  // 9g. Cart persistence — add items, reload
  console.log('9g. Cart persistence across reload...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11d-edge-9g-before-reload.png`, fullPage: true });
  // Hard refresh
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/11d-edge-9g-after-reload.png`, fullPage: true });
  // Check cart page
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11d-edge-9g-cart-persisted.png`, fullPage: true });

  // 9e. Logged-out access
  console.log('9e. Logged-out access...');
  // Open incognito context (no session)
  const incognitoCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const incognitoPage = await incognitoCtx.newPage();
  await incognitoPage.goto(`${BASE}/user/shop/cart`);
  await incognitoPage.waitForLoadState('networkidle');
  await incognitoPage.waitForTimeout(2000);
  console.log('   /user/shop/cart → ', incognitoPage.url());
  await incognitoPage.screenshot({ path: `${SHOTS}/11d-edge-9e-logged-out.png`, fullPage: true });
  await incognitoCtx.close();

  // Clean up cart for next tests
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  removed = true;
  while (removed) {
    removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trashBtn = btns.find(b => b.querySelector('svg.lucide-trash-2') && b.offsetParent !== null);
      if (trashBtn) { trashBtn.click(); return true; }
      return false;
    });
    if (removed) await page.waitForTimeout(1000);
  }

  await ctx.close();

  // === MOBILE SCREENSHOTS ===
  console.log('\n=== MOBILE SCREENSHOTS ===');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileCtx.newPage();

  // Login on mobile
  console.log('Mobile: Logging in...');
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.fill('input[type="email"]', 'playwright@test.com');
  await mobilePage.fill('input[type="password"]', 'Test@1234');
  await mobilePage.click('button:has-text("Sign In")');
  await mobilePage.waitForURL(/\/user/, { timeout: 15000 });

  // Mobile shop list
  console.log('Mobile: Shop list...');
  await mobilePage.goto(`${BASE}/user/shop`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-01-shop.png`, fullPage: true });

  // Mobile digital PDP
  console.log('Mobile: Digital PDP...');
  await mobilePage.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-02-digital-pdp.png`, fullPage: true });

  // Mobile physical PDP
  console.log('Mobile: Physical PDP...');
  await mobilePage.goto(`${BASE}/user/shop/cmmk306fd000gtb3eg9gmynar`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-03-physical-pdp.png`, fullPage: true });

  // Add to cart on mobile
  console.log('Mobile: Add to cart...');
  await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to Cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await mobilePage.waitForTimeout(2000);

  // Mobile cart
  console.log('Mobile: Cart...');
  await mobilePage.goto(`${BASE}/user/shop/cart`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-04-cart.png`, fullPage: true });

  // Mobile checkout
  console.log('Mobile: Checkout...');
  await mobilePage.goto(`${BASE}/user/orders/checkout`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-05-checkout.png`, fullPage: true });

  // Mobile orders
  console.log('Mobile: Orders...');
  await mobilePage.goto(`${BASE}/user/orders`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-06-orders.png`, fullPage: true });

  // Mobile library
  console.log('Mobile: Library...');
  await mobilePage.goto(`${BASE}/user/library`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11d-mobile-07-library.png`, fullPage: true });

  // Clean up cart
  await mobilePage.goto(`${BASE}/user/shop/cart`);
  await mobilePage.waitForLoadState('networkidle');
  removed = true;
  while (removed) {
    removed = await mobilePage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trashBtn = btns.find(b => b.querySelector('svg.lucide-trash-2') && b.offsetParent !== null);
      if (trashBtn) { trashBtn.click(); return true; }
      return false;
    });
    if (removed) await mobilePage.waitForTimeout(1000);
  }

  await mobileCtx.close();
  await browser.close();
  console.log('\nDone. Screenshots in', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
