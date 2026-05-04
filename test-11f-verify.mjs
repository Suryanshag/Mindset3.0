import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots/11f';
execSync(`mkdir -p ${SHOTS}`);

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/user/, { timeout: 15000 });
}

async function clearCart(page) {
  await page.goto(`${BASE}/user/cart`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  let removed = true;
  while (removed) {
    removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trashBtn = btns.find(b => {
        const svg = b.querySelector('svg.lucide-trash-2');
        return svg && b.offsetParent !== null;
      });
      if (trashBtn) { trashBtn.click(); return true; }
      return false;
    });
    if (removed) await page.waitForTimeout(1000);
  }
}

async function addDigitalProduct(page) {
  await page.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to Cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(2000);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ==========================================
  // BUG 1: Mobile cart header icon
  // ==========================================
  console.log('=== BUG 1: Mobile Cart Header Icon ===\n');

  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  });
  const mp = await mobileCtx.newPage();
  await login(mp);

  // Clear cart first
  await clearCart(mp);

  // Screenshot: mobile dashboard with empty cart
  console.log('1a. Mobile dashboard, empty cart...');
  await mp.goto(`${BASE}/user`);
  await mp.waitForLoadState('networkidle');
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${SHOTS}/11f-mobile-header-empty.png`, fullPage: false });

  // Check cart icon exists in header
  const cartIconExists = await mp.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href="/user/cart"]'));
    const headerCart = links.find(a => {
      const svg = a.querySelector('svg.lucide-shopping-bag');
      return svg && a.offsetParent !== null;
    });
    return !!headerCart;
  });
  console.log('   Cart icon in header:', cartIconExists);

  // Check no badge when empty
  const hasBadgeEmpty = await mp.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href="/user/cart"]'));
    const headerCart = links.find(a => a.querySelector('svg.lucide-shopping-bag') && a.offsetParent !== null);
    if (!headerCart) return 'NO ICON';
    const badge = headerCart.querySelector('span');
    return badge ? badge.textContent : 'NO BADGE';
  });
  console.log('   Badge when empty:', hasBadgeEmpty);

  // Add item to cart
  await addDigitalProduct(mp);

  // Screenshot: mobile dashboard with cart badge
  console.log('1b. Mobile dashboard, 1 item in cart...');
  await mp.goto(`${BASE}/user`);
  await mp.waitForLoadState('networkidle');
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${SHOTS}/11f-mobile-header-badge.png`, fullPage: false });

  const badgeContent = await mp.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href="/user/cart"]'));
    const headerCart = links.find(a => a.querySelector('svg.lucide-shopping-bag') && a.offsetParent !== null);
    if (!headerCart) return 'NO ICON';
    const badge = headerCart.querySelector('span');
    return badge ? badge.textContent : 'NO BADGE';
  });
  console.log('   Badge content:', badgeContent);

  // Screenshot: tap cart icon → /user/cart
  console.log('1c. Tapping cart icon...');
  await mp.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href="/user/cart"]'));
    const headerCart = links.find(a => a.querySelector('svg.lucide-shopping-bag') && a.offsetParent !== null);
    if (headerCart) headerCart.click();
  });
  await mp.waitForLoadState('networkidle');
  await mp.waitForTimeout(1000);
  console.log('   Navigated to:', mp.url());
  await mp.screenshot({ path: `${SHOTS}/11f-mobile-cart-page.png`, fullPage: true });

  await clearCart(mp);
  await mobileCtx.close();

  // ==========================================
  // BUG 2: Pay button → Razorpay (no modal)
  // ==========================================
  console.log('\n=== BUG 2: Pay Button (Desktop) ===\n');

  const desktopResults = [];

  for (let run = 1; run <= 5; run++) {
    console.log(`Desktop run ${run}/5...`);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    await clearCart(page);
    await addDigitalProduct(page);

    // Go to checkout
    await page.goto(`${BASE}/user/orders/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (run === 1) {
      await page.screenshot({ path: `${SHOTS}/11f-desktop-checkout-pay.png`, fullPage: true });
    }

    // Verify no confirm modal — button should say "Pay ₹1,899"
    const btnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Pay'));
      return payBtn?.textContent ?? 'NOT FOUND';
    });
    console.log(`   Button text: "${btnText}"`);

    // Click Pay button ONCE
    const clickTime = Date.now();
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Pay') && !b.disabled);
      if (payBtn) payBtn.click();
    });

    // Wait for Razorpay iframe to appear
    let razorpayOpened = false;
    for (let i = 0; i < 100; i++) { // up to 10 seconds
      await page.waitForTimeout(100);
      const iframeCount = await page.locator('iframe').count();
      if (iframeCount > 0) {
        razorpayOpened = true;
        break;
      }
    }

    const elapsed = Date.now() - clickTime;
    const result = razorpayOpened ? 'Pass' : 'Fail';
    console.log(`   Razorpay opened: ${razorpayOpened} (${elapsed}ms)`);
    desktopResults.push({ run, clicks: 1, elapsed, result });

    if (run === 1 && razorpayOpened) {
      await page.screenshot({ path: `${SHOTS}/11f-desktop-razorpay-open.png`, fullPage: true });
    }

    await ctx.close();
  }

  // ==========================================
  // Mobile Pay button test
  // ==========================================
  console.log('\n=== BUG 2: Pay Button (Mobile) ===\n');

  const mobileResults = [];

  for (let run = 1; run <= 5; run++) {
    console.log(`Mobile run ${run}/5...`);
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    });
    const page = await ctx.newPage();
    await login(page);
    await clearCart(page);
    await addDigitalProduct(page);

    await page.goto(`${BASE}/user/orders/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (run === 1) {
      await page.screenshot({ path: `${SHOTS}/11f-mobile-checkout-pay.png`, fullPage: true });
    }

    // Click Pay button ONCE
    const clickTime = Date.now();
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Pay') && !b.disabled);
      if (payBtn) payBtn.click();
    });

    // Wait for Razorpay iframe
    let razorpayOpened = false;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(100);
      const iframeCount = await page.locator('iframe').count();
      if (iframeCount > 0) {
        razorpayOpened = true;
        break;
      }
    }

    const elapsed = Date.now() - clickTime;
    const result = razorpayOpened ? 'Pass' : 'Fail';
    console.log(`   Razorpay opened: ${razorpayOpened} (${elapsed}ms)`);
    mobileResults.push({ run, clicks: 1, elapsed, result });

    if (run === 1 && razorpayOpened) {
      await page.screenshot({ path: `${SHOTS}/11f-mobile-razorpay-open.png`, fullPage: true });
    }

    await ctx.close();
  }

  // ==========================================
  // Results summary
  // ==========================================
  console.log('\n=== RESULTS ===\n');
  console.log('Desktop (5 runs):');
  console.log('| Run | Click count | Time to open | Result |');
  console.log('|-----|-------------|--------------|--------|');
  for (const r of desktopResults) {
    console.log(`| ${r.run}   | ${r.clicks}           | ${r.elapsed}ms        | ${r.result}   |`);
  }

  console.log('\nMobile (5 runs):');
  console.log('| Run | Click count | Time to open | Result |');
  console.log('|-----|-------------|--------------|--------|');
  for (const r of mobileResults) {
    console.log(`| ${r.run}   | ${r.clicks}           | ${r.elapsed}ms        | ${r.result}   |`);
  }

  const allPassed = [...desktopResults, ...mobileResults].every(r => r.result === 'Pass');
  console.log(`\nOverall: ${allPassed ? 'ALL PASS' : 'SOME FAILURES'}`);

  await browser.close();
  console.log('\nScreenshots in', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
