import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login as the engaged user
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/user**', { timeout: 15000 });
  console.log('Logged in, URL:', page.url());
  await page.waitForTimeout(2000);

  // 1. /user landing — verify spelled numbers in prose
  await page.goto(`${BASE}/user`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/8.6-01-landing-spelled-numbers.png`, fullPage: true });
  console.log('✓ 8.6-01 landing with spelled numbers');

  // 2. Rich chapter view — verify word-boundary truncation
  await page.goto(`${BASE}/user/sessions/cmoge8kvb0000se27smr7aiuv`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/8.6-02-chapter-truncation.png`, fullPage: true });
  console.log('✓ 8.6-02 chapter with word-boundary truncation');

  // 3. Upcoming session — verify pre-session work section
  await page.goto(`${BASE}/user/sessions/cmoge8l6s0005se274c646y5k`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/8.6-03-upcoming-presession.png`, fullPage: true });
  console.log('✓ 8.6-03 upcoming chapter with pre-session work');

  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
