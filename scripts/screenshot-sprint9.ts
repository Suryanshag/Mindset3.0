import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login as engaged user
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/user**', { timeout: 15000 });
  console.log('Logged in, URL:', page.url());
  await page.waitForTimeout(2000);

  // 1. Today writing surface — blank (engaged user with pending assignment)
  await page.goto(`${BASE}/user/reflection/today`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/9-01-today-blank.png`, fullPage: true });
  console.log('✓ 9-01 blank Today surface');

  // 2. Type some text and wait for autosave
  const titleInput = page.getByPlaceholder('Untitled').filter({ visible: true }).first();
  const bodyTextarea = page.getByPlaceholder("What's on your mind?").filter({ visible: true }).first();
  await titleInput.fill('Testing autosave');
  await bodyTextarea.fill('Today I tested the writing surface and it feels really good to type in this space.');
  await page.waitForTimeout(2000); // wait for autosave to fire
  await page.screenshot({ path: `${DIR}/9-02-today-with-draft.png`, fullPage: true });
  console.log('✓ 9-02 Today with draft');

  // 3. Refresh to verify persistence
  await page.reload();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/9-03-today-draft-persisted.png`, fullPage: true });
  console.log('✓ 9-03 Draft persisted after refresh');

  // 4. Mobile bridge — open /user/practice/journal/new at mobile viewport
  // The server should populate with the server draft from desktop
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });
  const mobilePage = await mobileCtx.newPage();
  // Login on mobile context
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.fill('input[type="email"]', 'playwright@test.com');
  await mobilePage.fill('input[type="password"]', 'Test@1234');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/user**', { timeout: 15000 });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.goto(`${BASE}/user/practice/journal/new`);
  await mobilePage.waitForTimeout(2500);
  await mobilePage.screenshot({ path: `${DIR}/9-04-mobile-bridge-draft.png`, fullPage: true });
  console.log('✓ 9-04 Mobile bridge with server draft');
  await mobileCtx.close();

  // 5. Login as empty user (Nisha)
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await context2.newPage();
  await page2.goto(`${BASE}/login`);
  await page2.fill('input[type="email"]', 'emptyuser@test.com');
  await page2.fill('input[type="password"]', 'Test@1234');
  await page2.click('button[type="submit"]');
  await page2.waitForURL('**/user**', { timeout: 15000 });
  console.log('Logged in as empty user');
  await page2.waitForTimeout(2000);

  await page2.goto(`${BASE}/user/reflection/today`);
  await page2.waitForTimeout(2500);
  await page2.screenshot({ path: `${DIR}/9-05-today-empty-user.png`, fullPage: true });
  console.log('✓ 9-05 Today surface for empty user');

  // 6. Clean up — discard the draft so it doesn't pollute future runs
  // Go back to today page and clear the text
  await page.goto(`${BASE}/user/reflection/today`);
  await page.waitForTimeout(2500);
  const titleAfter = page.getByPlaceholder('Untitled').filter({ visible: true }).first();
  const bodyAfter = page.getByPlaceholder("What's on your mind?").filter({ visible: true }).first();
  await titleAfter.fill('');
  await bodyAfter.fill('');
  await page.waitForTimeout(2000); // wait for discard to fire
  console.log('✓ Cleaned up test draft');

  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
