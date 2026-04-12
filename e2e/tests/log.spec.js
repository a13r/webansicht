const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Status History (Log)', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays log page for dispo user', async ({ page }) => {
    await page.goto('/log');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'TETRA' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Kennung' })).toBeVisible();
  });

  test('shows log entries after state change', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'LOG-E2E',
      type: 'RTW',
      tetra: '66001',
      state: 0,
    });

    // Simulate LARDIS status change
    await api.patchResource(resource._id, { state: 1 });

    await page.goto('/log');
    await expect(page.locator('td', { hasText: 'LOG-E2E' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: 'Einsatzbereit' }).first()).toBeVisible();
  });

  test('shows log with correct state colors', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'LOGCOLOR',
      type: 'RTW',
      tetra: '66002',
      state: 0,
    });

    await api.patchResource(resource._id, { state: 3 });

    await page.goto('/log');
    const row = page.locator('tr', { hasText: 'LOGCOLOR' }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.locator('td', { hasText: 'am Berufungsort' })).toBeVisible();
    await expect(row).toHaveCSS('background-color', 'rgb(255, 173, 91)');
  });
});
