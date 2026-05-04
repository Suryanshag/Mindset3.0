import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login as the empty user (no sessions, no data)
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'emptyuser@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/user**', { timeout: 15000 });
  console.log('Logged in as empty user, URL:', page.url());
  await page.waitForTimeout(2500);

  // Capture the empty/new-user state
  await page.screenshot({ path: `${DIR}/03-empty-state.png`, fullPage: true });
  console.log('✓ 03-empty-state.png');

  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
