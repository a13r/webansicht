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

  test('resource filter applies to live entries and survives sort toggle', async ({ page }) => {
    const filtered = await api.createResource({
      callSign: 'LOGFLT-A',
      type: 'RTW',
      tetra: '66003',
      state: 0,
    });
    const other = await api.createResource({
      callSign: 'LOGFLT-B',
      type: 'RTW',
      tetra: '66004',
      state: 0,
    });

    await page.goto('/log');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    await page.locator('select').selectOption({ label: 'LOGFLT-A' });

    // Live entry for the filtered resource appears, the other one does not
    await api.patchResource(other._id, { state: 1 });
    await api.patchResource(filtered._id, { state: 3 });
    await expect(page.locator('tr', { hasText: 'LOGFLT-A' }).locator('td', { hasText: 'am Berufungsort' })).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator('td', { hasText: 'LOGFLT-B' })).toHaveCount(0);

    // Toggling the sort order keeps the filter
    await page.locator('i.fa-sort-desc').click();
    await expect(page.locator('i.fa-sort-asc')).toBeVisible();
    await expect(page.locator('td', { hasText: 'LOGFLT-A' })).not.toHaveCount(0);
    await expect(page.locator('td', { hasText: 'LOGFLT-B' })).toHaveCount(0);

    // Live entries keep being filtered after the toggle
    await api.patchResource(other._id, { state: 3 });
    await api.patchResource(filtered._id, { state: 1 });
    await expect(page.locator('tr', { hasText: 'LOGFLT-A' }).locator('td', { hasText: 'Einsatzbereit' })).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator('td', { hasText: 'LOGFLT-B' })).toHaveCount(0);
  });
});
