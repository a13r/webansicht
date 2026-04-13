const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('German locale formatting', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('log page displays dates in German format (DD.MM.YYYY HH:mm)', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'LOCALE-E2E',
      type: 'RTW',
      tetra: '66099',
      state: 0,
    });

    await api.patchResource(resource._id, { state: 1 });

    await page.goto('/log');

    const row = page.locator('tr', { hasText: 'LOCALE-E2E' }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });

    const timestampCell = row.locator('td').first();
    const timestampText = await timestampCell.textContent();

    // German 'L LT' format: DD.MM.YYYY HH:mm (e.g., 13.04.2026 14:30)
    // English 'L LT' format: MM/DD/YYYY h:mm AM/PM
    expect(timestampText).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    expect(timestampText).not.toContain('/');
    expect(timestampText).not.toContain('AM');
    expect(timestampText).not.toContain('PM');
  });
});
