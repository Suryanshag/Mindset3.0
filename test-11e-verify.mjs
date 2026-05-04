import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots/11e';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Create screenshot dir
  const { execSync } = await import('child_process');
  execSync(`mkdir -p ${SHOTS}`);

  // === Desktop ===
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

  // Clear cart
  console.log('2. Clearing cart...');
  await page.goto(`${BASE}/user/cart`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  let removed = true;
  while (removed) {
    removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trashBtn = btns.find(b => b.querySelector('svg') && b.className.includes('text-gray-400') && b.offsetParent !== null);
      if (trashBtn) { trashBtn.click(); return true; }
      return false;
    });
    if (removed) await page.waitForTimeout(1000);
  }

  // Verify /user/cart page renders (not redirect)
  console.log('3. Verifying /user/cart renders...');
  await page.goto(`${BASE}/user/cart`);
  await page.waitForLoadState('networkidle');
  const cartUrl = page.url();
  console.log('   URL:', cartUrl);
  const hasCartTitle = await page.locator('text=My Cart').count();
  console.log('   Has "My Cart" title:', hasCartTitle > 0);
  await page.screenshot({ path: `${SHOTS}/11e-01-cart-empty.png`, fullPage: true });

  // Verify /user/shop/cart redirects
  console.log('4. Verifying /user/shop/cart redirect...');
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  console.log('   Redirected to:', page.url());

  // Visit shop and check cart icon link
  console.log('5. Checking cart icon in shop...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11e-02-shop.png`, fullPage: true });

  // Click cart icon
  const cartIconHref = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const cartLink = links.find(a => a.querySelector('svg.lucide-shopping-cart') && a.offsetParent !== null);
    return cartLink?.href ?? 'NOT FOUND';
  });
  console.log('   Cart icon href:', cartIconHref);

  // Check "My orders" link
  const ordersHref = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const ordersLink = links.find(a => a.textContent?.includes('My orders') && a.offsetParent !== null);
    return ordersLink?.href ?? 'NOT FOUND';
  });
  console.log('   My orders href:', ordersHref);

  // Check spine sidebar cart link
  const spineCartHref = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const spineCart = links.find(a => a.textContent?.includes('Cart') && a.querySelector('svg') && a.className.includes('spine-item'));
    return spineCart?.href ?? 'NOT FOUND';
  });
  console.log('   Spine cart href:', spineCartHref);

  // Add digital product to cart
  console.log('6. Adding digital product...');
  await page.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11e-03-digital-pdp.png`, fullPage: true });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to Cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11e-04-added-to-cart.png`, fullPage: true });

  // Check "View Cart" link points to /user/cart
  const viewCartHref = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const vc = links.find(a => a.textContent?.includes('View Cart') && a.offsetParent !== null);
    return vc?.href ?? 'NOT FOUND';
  });
  console.log('   View Cart href:', viewCartHref);

  // Go to cart page
  console.log('7. Cart page...');
  await page.goto(`${BASE}/user/cart`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11e-05-cart-with-item.png`, fullPage: true });

  // Check button colors (should be sage #2D5A4F, not teal #0B9DA9)
  const checkoutBtnColor = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const checkoutLink = links.find(a => a.textContent?.includes('Proceed to Checkout') && a.offsetParent !== null);
    return checkoutLink ? getComputedStyle(checkoutLink).backgroundColor : 'NOT FOUND';
  });
  console.log('   Checkout btn bg:', checkoutBtnColor);

  // Go to checkout
  console.log('8. Checkout page...');
  await page.goto(`${BASE}/user/orders/checkout`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11e-06-checkout.png`, fullPage: true });

  // Check step indicator colors
  const stepColor = await page.evaluate(() => {
    const steps = Array.from(document.querySelectorAll('div'));
    const stepCircle = steps.find(d => d.className.includes('bg-primary') && d.className.includes('rounded-full') && d.className.includes('w-10'));
    return stepCircle ? getComputedStyle(stepCircle).backgroundColor : 'NOT FOUND';
  });
  console.log('   Step indicator bg:', stepColor);

  // Click Confirm & Pay
  console.log('9. Clicking Confirm & Pay...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Confirm & Pay'));
    if (payBtn) payBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11e-07-confirm-modal.png`, fullPage: true });

  // Check modal Confirm & Pay button color
  const modalBtnColor = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Confirm & Pay') && b.className.includes('bg-primary'));
    return confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : 'NOT FOUND';
  });
  console.log('   Modal Confirm btn bg:', modalBtnColor);

  // Click modal Confirm & Pay to test double-click fix
  console.log('10. Testing double-click fix (clicking modal Confirm & Pay)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const payBtns = btns.filter(b => b.offsetParent !== null && b.textContent?.includes('Confirm & Pay'));
    // Modal button should be the one with bg-primary class
    const modalBtn = payBtns.find(b => b.className.includes('bg-primary'));
    if (modalBtn) modalBtn.click();
  });

  // Wait for API response — modal should show "Processing..." then close
  console.log('   Waiting for order creation...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SHOTS}/11e-08-after-confirm.png`, fullPage: true });

  // Check if Razorpay opened automatically (iframe should appear)
  const iframeCount = await page.locator('iframe').count();
  console.log('   Iframe count after confirm:', iframeCount);

  const currentUrl = page.url();
  console.log('   Current URL:', currentUrl);

  // Check if Pay button is visible (fallback if autoOpen fails)
  const payBtnVisible = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Pay'));
    return payBtn ? payBtn.textContent : 'NOT FOUND';
  });
  console.log('   Pay button text:', payBtnVisible);

  // === Mobile ===
  console.log('\n=== MOBILE ===');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  });
  const mobilePage = await mobileCtx.newPage();

  // Login
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.fill('input[type="email"]', 'playwright@test.com');
  await mobilePage.fill('input[type="password"]', 'Test@1234');
  await mobilePage.click('button:has-text("Sign In")');
  await mobilePage.waitForURL(/\/user/, { timeout: 15000 });

  // Mobile cart
  console.log('Mobile: Cart...');
  await mobilePage.goto(`${BASE}/user/cart`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11e-mobile-01-cart.png`, fullPage: true });

  // Mobile shop
  console.log('Mobile: Shop...');
  await mobilePage.goto(`${BASE}/user/shop`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: `${SHOTS}/11e-mobile-02-shop.png`, fullPage: true });

  // Mobile checkout
  console.log('Mobile: Checkout...');
  await mobilePage.goto(`${BASE}/user/orders/checkout`);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: `${SHOTS}/11e-mobile-03-checkout.png`, fullPage: true });

  await mobileCtx.close();
  await ctx.close();
  await browser.close();
  console.log('\nDone. Screenshots in', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
