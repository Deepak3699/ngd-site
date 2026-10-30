import { expect, test } from '@playwright/test';

test('homepage has the brand entity, clear purpose and working navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NGD Solutions \(NextGenDev Solutions\)/);
  await expect(page.locator('h1')).toContainText('Digital products');
  await expect(page.locator('.hero-intro')).toContainText('fast websites, apps and AI automations');
  const html = await page.content();
  expect(html).toContain('NGDSolutions');
  expect(html).toContain('NextGenDevSolutions');
  expect(html).toContain('application/ld+json');
});

test('pages do not overflow the mobile viewport', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only check');
  for (const path of ['/', '/solutions', '/students', '/services/web-development', '/services/ai-automation']) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    expect(widths.content, `${path} overflows`).toBeLessThanOrEqual(widths.viewport);
  }
});

test('mobile menu and student enquiry switch work', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only interaction');
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.menu-toggle').click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).toHaveCount(0);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.locator('.form-category button').nth(1).click();
  await expect(page.locator('select[name="studentNeed"]')).toBeVisible();
});

test('reduced motion uses a static 3D fallback and keeps content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.scene-fallback')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('#services h2')).toBeVisible();
});

test('enquiry API validates input and accepts a real submission', async ({ request }) => {
  const invalid = await request.post('/api/leads', { data: { category: 'client', name: 'x', email: 'bad', elapsedMs: 5000 } });
  expect(invalid.status()).toBe(422);
  const oversized = await request.post('/api/leads', { data: { message: 'x'.repeat(129 * 1024) } });
  expect(oversized.status()).toBe(413);
  const email = `playwright-${Date.now()}@example.com`;
  const valid = await request.post('/api/leads', { data: { category: 'client', name: 'Playwright Test', email, clientNeed: 'Website / Landing Page', elapsedMs: 5000 } });
  expect(valid.ok()).toBeTruthy();
  const data = await valid.json();
  expect(data.ref).toMatch(/^NGD-/);
});

test('admin is available only at its configured path', async ({ request }) => {
  const admin = await request.get('/ngd-control-8421');
  expect(admin.status()).toBe(200);
  expect(admin.headers()['x-robots-tag']).toContain('noindex');
  const publicAdmin = await request.get('/admin');
  expect(publicAdmin.status()).toBe(404);
  const session = await request.get('/api/admin/session');
  expect(session.ok()).toBeTruthy();
});
