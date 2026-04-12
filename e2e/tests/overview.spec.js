const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Overview Dashboard', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays overview page after login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'TETRA' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();
  });

  test('shows resource with correct state', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'OVW-1',
      type: 'RTW',
      tetra: '99001',
      state: 1,
    });

    await page.goto('/');
    await expect(page.locator('td', { hasText: 'OVW-1' })).toBeVisible({ timeout: 10_000 });
    const row = page.locator('tr', { hasText: 'OVW-1' });
    await expect(row.locator('td', { hasText: 'Einsatzbereit' })).toBeVisible();
  });

  test('shows resource editor for dispo users', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'OVW-2',
      type: 'KTW',
      tetra: '99002',
      state: 0,
    });

    await page.goto('/');
    await page.locator('tr', { hasText: 'OVW-2' }).click();
    await expect(page.getByText('Status ändern')).toBeVisible();
  });

  test('shows station load cards', async ({ page }) => {
    await api.createStation({
      name: 'SanHiSt Alpha',
      currentPatients: 3,
      maxPatients: 10,
      ordering: 1,
    });

    await page.goto('/');
    await expect(page.getByText('SanHiSt Alpha')).toBeVisible({ timeout: 10_000 });
  });
});
