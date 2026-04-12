const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Journal (ETB)', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays journal page for dispo user', async ({ page }) => {
    await page.goto('/journal');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'Eintrag' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Melder' })).toBeVisible();
  });

  test('shows journal entry created via API', async ({ page }) => {
    await api.createJournalEntry({
      text: 'E2E test journal entry',
      reporter: 'E2E Tester',
      state: 'offen',
    });

    await page.goto('/journal');
    await expect(page.locator('td', { hasText: 'E2E test journal entry' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows export button', async ({ page }) => {
    await page.goto('/journal');
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 10_000 });
  });
});
