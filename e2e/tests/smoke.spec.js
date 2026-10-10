const { test, expect } = require('@playwright/test');
const { collectErrors } = require('../helpers/misc');

// Every top-level page must render a landmark without console or page errors.
const pages = [
  { path: '/', ready: (page) => page.locator('table').first() },
  { path: '/journal', ready: (page) => page.locator('th', { hasText: 'Eintrag' }) },
  { path: '/log', ready: (page) => page.locator('table').first() },
  { path: '/messages', ready: (page) => page.locator('th', { hasText: 'Nachricht' }) },
  { path: '/resourceAdmin', ready: (page) => page.locator('th', { hasText: 'Kennung' }) },
  { path: '/stations', ready: (page) => page.getByRole('button', { name: 'hinzufügen' }) },
  { path: '/transports', ready: (page) => page.getByRole('button', { name: 'Abtransport anfordern' }) },
  { path: '/map', ready: (page) => page.locator('.openlayers-map canvas').first() },
  { path: '/settings', ready: (page) => page.getByRole('button', { name: 'Datenbank exportieren' }) },
];

for (const { path, ready } of pages) {
  test(`${path} loads without console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    await expect(ready(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Administrator' })).toBeVisible();
    // let late socket/store updates settle before checking
    await page.waitForLoadState('networkidle');
    expect(errors()).toEqual([]);
  });
}
