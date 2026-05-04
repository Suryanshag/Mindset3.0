import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/user**', { timeout: 15000 });
  console.log('Logged in, URL:', page.url());
  await page.waitForTimeout(2000);

  // 1. /user landing (engaged state)
  await page.goto(`${BASE}/user`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/01-user-landing.png`, fullPage: true });
  console.log('✓ 01-user-landing.png');

  // 2. Rich chapter view (Feb 9 session — has notes + lots of orbital content)
  await page.goto(`${BASE}/user/sessions/cmoge8kvb0000se27smr7aiuv`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/02-chapter-rich.png`, fullPage: true });
  console.log('✓ 02-chapter-rich.png');

  // 3. Recent chapter (Apr 17 — notes + some content)
  await page.goto(`${BASE}/user/sessions/cmoge8l4i0004se27ihdv4h3p`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/03-chapter-recent.png`, fullPage: true });
  console.log('✓ 03-chapter-recent.png');

  // 4. Upcoming session (no orbital content — quiet empty state)
  await page.goto(`${BASE}/user/sessions/cmoge8l6s0005se274c646y5k`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/04-chapter-upcoming.png`, fullPage: true });
  console.log('✓ 04-chapter-upcoming.png');

  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
