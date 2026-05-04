import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const browser = await chromium.launch();

  // ── Engaged user (playwright@test.com) ──────────────────────────
  for (const width of [1280, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();

    // Login
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'playwright@test.com');
    await page.fill('input[type="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/user**', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 1. Writing surface — mood dots (verify text glyphs, not emoji)
    await page.goto(`${BASE}/user/reflection/today`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${DIR}/10-01-today-${width}.png`, fullPage: true });
    console.log(`✓ 10-01 Today surface @ ${width}px`);

    // 2. Session chapter — doctor rail card
    // Navigate to the first session in the spine
    const sessionLink = page.locator('.spine a[href*="/user/sessions/"]').first();
    if (await sessionLink.count() > 0) {
      await sessionLink.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${DIR}/10-02-chapter-${width}.png`, fullPage: true });
      console.log(`✓ 10-02 Chapter view @ ${width}px`);
    } else {
      console.log(`⚠ No session links in spine @ ${width}px`);
    }

    await ctx.close();
  }

  // ── Empty user (Nisha) — reflection landing with first-steps ────
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/login`);
  await page2.fill('input[type="email"]', 'emptyuser@test.com');
  await page2.fill('input[type="password"]', 'Test@1234');
  await page2.click('button[type="submit"]');
  await page2.waitForURL('**/user**', { timeout: 15000 });
  await page2.waitForTimeout(2000);

  // Home page shows reflection landing for empty user
  await page2.goto(`${BASE}/user`);
  await page2.waitForTimeout(2500);
  await page2.screenshot({ path: `${DIR}/10-03-empty-user-landing.png`, fullPage: true });
  console.log('✓ 10-03 Empty user reflection landing');

  // Writing surface for empty user
  await page2.goto(`${BASE}/user/reflection/today`);
  await page2.waitForTimeout(2500);
  await page2.screenshot({ path: `${DIR}/10-04-empty-user-today.png`, fullPage: true });
  console.log('✓ 10-04 Empty user Today surface');

  await ctx2.close();

  // ── Mobile — journal compose (verify text glyphs replaced emoji) ──
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.fill('input[type="email"]', 'playwright@test.com');
  await mobilePage.fill('input[type="password"]', 'Test@1234');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/user**', { timeout: 15000 });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.goto(`${BASE}/user/practice/journal/new`);
  await mobilePage.waitForTimeout(2500);
  await mobilePage.screenshot({ path: `${DIR}/10-05-mobile-compose.png`, fullPage: true });
  console.log('✓ 10-05 Mobile journal compose (mood glyphs)');

  await mobileCtx.close();
  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
