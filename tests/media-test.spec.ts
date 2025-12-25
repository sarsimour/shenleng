import { test, expect } from '@playwright/test';

test('investigate media creation loading issue', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3010/admin/login');
  await page.screenshot({ path: 'tests/login-page.png' });

  console.log('Attempting login...');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/admin');
  console.log('Logged in successfully');
  await page.screenshot({ path: 'tests/dashboard.png' });

  console.log('Navigating to Media collection...');
  await page.goto('http://localhost:3010/admin/collections/media');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/media-list.png' });

  console.log('Clicking Create New...');
  const createButton = page.locator('a:has-text("Create New"), button:has-text("Create New")').first();
  await createButton.click();

  console.log('Waiting for Create New page to load...');
  // Give it some time to see if it stays blank or loading
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'tests/media-create-page.png' });

  // Check if specific fields are rendered
  const fileInput = page.locator('input[type="file"]');
  const isFileInputVisible = await fileInput.isVisible();
  console.log(`Is file input visible? ${isFileInputVisible}`);

  if (!isFileInputVisible) {
    console.log('UI seems to be stuck or blank. Checking for error indicators...');
    const bodyText = await page.innerText('body');
    console.log(`Body text snippet: ${bodyText.substring(0, 200)}`);
  }
});
