import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = '/tmp/shop-screenshots/11d';

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
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

  // Clear cart first
  console.log('2. Clearing cart...');
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
  console.log('   Cart cleared');

  // 01. Shop list
  console.log('3. Shop list...');
  await page.goto(`${BASE}/user/shop`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11d-digital-01-shop.png`, fullPage: true });

  // 02. Digital PDP
  console.log('4. Digital PDP...');
  await page.goto(`${BASE}/user/shop/cmmk306nf000jtb3e8fomdydw`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11d-digital-02-pdp.png`, fullPage: true });

  // 03. Add to cart
  console.log('5. Add to cart...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add to Cart') && b.offsetParent !== null);
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11d-digital-03-added.png`, fullPage: true });

  // 04. Cart page
  console.log('6. Cart page...');
  await page.goto(`${BASE}/user/shop/cart`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/11d-digital-04-cart.png`, fullPage: true });

  // 05. Checkout — should skip to step 3
  console.log('7. Checkout...');
  await page.goto(`${BASE}/user/orders/checkout`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11d-digital-05-checkout.png`, fullPage: true });
  console.log('   URL:', page.url());

  // 06. Click first "Confirm & Pay" to open confirmation modal
  console.log('8. Opening confirmation modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const payBtn = btns.find(b => b.offsetParent !== null && b.textContent?.includes('Confirm & Pay'));
    if (payBtn) payBtn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/11d-digital-06-confirm-modal.png`, fullPage: true });

  // 07. Click "Confirm & Pay" in the modal to trigger Razorpay
  console.log('9. Clicking modal Confirm & Pay...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // The modal's Confirm & Pay is the second one visible
    const payBtns = btns.filter(b => b.offsetParent !== null && b.textContent?.includes('Confirm & Pay'));
    console.log('Found pay buttons:', payBtns.length);
    if (payBtns.length > 1) payBtns[1].click();
    else if (payBtns.length === 1) payBtns[0].click();
  });

  // Wait for Razorpay to load
  console.log('10. Waiting for Razorpay...');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${SHOTS}/11d-digital-07-razorpay.png`, fullPage: true });

  // Check for Razorpay iframe or modal
  const razorpayFrameCount = await page.locator('iframe').count();
  console.log('    iframe count:', razorpayFrameCount);

  // Check all iframes for Razorpay
  const iframeSrcs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => f.src || f.id || 'no-src');
  });
  console.log('    iframe sources:', iframeSrcs);

  if (razorpayFrameCount > 0) {
    // Try to interact with Razorpay
    const razorpayFrame = page.frameLocator('iframe').first();
    console.log('    Found Razorpay frame, attempting card entry...');

    try {
      // Wait for card number field
      await razorpayFrame.locator('input[name="card.number"], input[placeholder*="Card"], #card_number').first().waitFor({ timeout: 10000 });
      console.log('    Card field found');

      // Enter test card details
      await razorpayFrame.locator('input[name="card.number"], input[placeholder*="Card"], #card_number').first().fill('4111111111111111');
      await page.waitForTimeout(500);
      await razorpayFrame.locator('input[name="card.expiry"], input[placeholder*="Expiry"], #card_expiry').first().fill('12/30');
      await page.waitForTimeout(500);
      await razorpayFrame.locator('input[name="card.cvv"], input[placeholder*="CVV"], #card_cvv').first().fill('123');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOTS}/11d-digital-08-card-entry.png`, fullPage: true });

      // Click pay
      await razorpayFrame.locator('button[type="submit"], #pay-btn, button:has-text("Pay")').first().click();
      console.log('    Clicked pay in Razorpay');

      // Wait for OTP or success
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${SHOTS}/11d-digital-09-otp.png`, fullPage: true });

      // Try OTP
      try {
        await razorpayFrame.locator('input[name="otp"], input[placeholder*="OTP"], #otp').first().fill('1234');
        await page.waitForTimeout(500);
        await razorpayFrame.locator('button:has-text("Submit"), button[type="submit"]').first().click();
        console.log('    Submitted OTP');
      } catch {
        console.log('    No OTP field found (may auto-complete)');
      }

      // Wait for redirect to orders
      console.log('    Waiting for success redirect...');
      try {
        await page.waitForURL(/\/user\/orders/, { timeout: 30000 });
        console.log('    Success! Redirected to:', page.url());
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SHOTS}/11d-digital-10-success.png`, fullPage: true });

        // Orders list
        await page.goto(`${BASE}/user/orders`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SHOTS}/11d-digital-11-orders.png`, fullPage: true });

        // Library
        await page.goto(`${BASE}/user/library`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SHOTS}/11d-digital-12-library.png`, fullPage: true });
      } catch {
        console.log('    No redirect to orders page');
        await page.screenshot({ path: `${SHOTS}/11d-digital-10-no-redirect.png`, fullPage: true });
      }
    } catch (err) {
      console.log('    Razorpay interaction failed:', err.message);
      await page.screenshot({ path: `${SHOTS}/11d-digital-08-razorpay-error.png`, fullPage: true });
    }
  } else {
    console.log('    No Razorpay iframe. Payment may use popup.');
    // Check for new windows/tabs
    const pages = ctx.pages();
    console.log('    Total pages:', pages.length);
  }

  // Keep browser open for 10s for manual inspection
  console.log('\nKeeping browser open for 10s...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\nDone. Screenshots in', SHOTS);
}

run().catch(e => { console.error(e); process.exit(1); });
