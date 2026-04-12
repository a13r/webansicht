const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('LARDIS Status Simulation', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('simulates status change via API and reflects in UI', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'STATUS-1',
      type: 'RTW',
      tetra: '88001',
      state: 0,
    });

    await page.goto('/');
    await expect(page.locator('td', { hasText: 'STATUS-1' })).toBeVisible({ timeout: 10_000 });

    // Simulate LARDIS status change: set to state 1 (Einsatzbereit)
    await api.patchResource(resource._id, { state: 1 });

    // Verify real-time update via Socket.IO (no page refresh)
    const row = page.locator('tr', { hasText: 'STATUS-1' });
    await expect(row.locator('td', { hasText: 'Einsatzbereit' })).toBeVisible({ timeout: 10_000 });
  });

  test('creates log entry on state change', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'LOG-1',
      type: 'RTW',
      tetra: '88002',
      state: 0,
    });

    // Change state via API (simulating LARDIS)
    await api.patchResource(resource._id, { state: 1 });

    // Verify log entry was created
    await page.goto('/log');
    await expect(page.locator('td', { hasText: 'LOG-1' }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('real-time update without page refresh', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'RT-1',
      type: 'RTW',
      tetra: '88003',
      state: 0,
    });

    await page.goto('/');
    const row = page.locator('tr', { hasText: 'RT-1' });
    await expect(row.locator('td', { hasText: 'Außer Dienst' })).toBeVisible({ timeout: 10_000 });

    // Change state via API without refreshing the page
    await api.patchResource(resource._id, { state: 2 });

    // Should update via Socket.IO
    await expect(row.locator('td', { hasText: 'zum Berufungsort' })).toBeVisible({ timeout: 10_000 });
  });
});
