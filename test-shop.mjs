import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots';

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
  console.log('   Logged in at:', page.url());

  // 1. Navigate to /user/shop
  console.log('2. Navigating to /user/shop...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/01-shop-list.png`, fullPage: true });
  console.log('   Screenshot: shop list');

  // 2. Click a physical product
  console.log('3. Clicking first product link...');
  const productLinks = page.locator('a[href^="/user/shop/cmm"]');
  const count = await productLinks.count();
  console.log('   Found', count, 'product links');
  if (count > 0) {
    // Dual shell renders links twice (mobile+desktop). Get href and navigate directly.
    const href = await productLinks.first().getAttribute('href');
    console.log('   First product link:', href);
    await page.goto(`${BASE}${href}`);
    await page.waitForLoadState('networkidle');
    console.log('   Now at:', page.url());
    await page.screenshot({ path: `${SHOTS}/02-product-detail.png`, fullPage: true });
    console.log('   Screenshot: product detail');
  }

  // 3. Add to cart via the detail page button
  console.log('4. Adding to cart...');
  const addBtnCount = await page.locator('button:has-text("Add to Cart")').count();
  console.log('   Found', addBtnCount, 'Add to Cart buttons');
  if (addBtnCount > 0) {
    // Dual shell: use evaluate to find and click the visible one
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add to Cart') && b.offsetParent !== null);
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/03-added-to-cart.png`, fullPage: true });
    console.log('   Screenshot: after add to cart');
  } else {
    console.log('   No Add to Cart button found');
    await page.screenshot({ path: `${SHOTS}/03-no-add-btn.png`, fullPage: true });
  }

  // 4. Navigate to cart
  console.log('5. Going to cart page...');
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/04-cart-page.png`, fullPage: true });
  console.log('   Screenshot: cart page');

  // 5. Go back to shop and check the "Add to cart" button on a card
  console.log('6. Testing shop card add-to-cart...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  const cardAddBtns = page.locator('button:has-text("Add to cart")');
  const cardBtnCount = await cardAddBtns.count();
  console.log('   Found', cardBtnCount, 'card add-to-cart buttons');
  if (cardBtnCount > 0) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add to cart') && b.offsetParent !== null);
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/05-card-add-to-cart.png`, fullPage: true });
    console.log('   Screenshot: after card add to cart');
  }

  // 6. Check spine has Cart entry (desktop)
  console.log('7. Checking spine nav...');
  const spineCart = page.locator('.spine-item:has-text("Cart")');
  console.log('   Spine Cart entry count:', await spineCart.count());
  await page.screenshot({ path: `${SHOTS}/06-spine-nav.png`, fullPage: true });

  // 7. Check empty cart redirect
  console.log('8. Testing empty cart icon redirect...');
  // First clear cart
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  // Remove all items using JS to handle dual-shell visibility
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
  await page.screenshot({ path: `${SHOTS}/07-empty-cart.png`, fullPage: true });
  console.log('   Screenshot: empty cart');

  // 8. Digital product detail
  console.log('9. Checking digital product...');
  // Emotional Wellness Toolkit is cmmk306nf000jtb3e8fomdydw
  await page.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/08-digital-product.png`, fullPage: true });
  console.log('   Screenshot: digital product detail');
  console.log('   URL:', page.url());

  await browser.close();
  console.log('\nAll screenshots saved to', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
