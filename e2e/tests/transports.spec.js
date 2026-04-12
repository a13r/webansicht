const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Transports', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays transports page', async ({ page }) => {
    await page.goto('/transports');
    await expect(page.getByRole('button', { name: 'Abtransport anfordern' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Anfordernde Stelle' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Dringlichkeit' })).toBeVisible();
  });

  test('shows transport created via API', async ({ page }) => {
    await api.createTransport({
      requester: 'E2E Station',
      priority: 0,
      type: 0,
      diagnose: 'E2E test diagnosis',
      destination: { hospital: 'E2E Hospital', station: 'Ward A' },
      state: 0,
    });

    await page.goto('/transports');
    await expect(page.locator('td', { hasText: 'E2E Station' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: 'E2E test diagnosis' })).toBeVisible();
  });

  test('creates transport via UI', async ({ page }) => {
    await page.goto('/transports');
    await page.getByRole('button', { name: 'Abtransport anfordern' }).click();

    // Fill the transport form
    await page.getByLabel('Anfordernde Stelle').fill('UI Test Station');
    await page.getByLabel('Dringlichkeit').selectOption({ index: 1 }); // normal
    await page.getByLabel('Transportart').selectOption({ index: 1 }); // liegend
    await page.getByLabel('Verdachtsdiagnose').fill('UI test diagnosis');
    await page.getByLabel('Zielkrankenhaus').fill('UI Hospital');
    await page.getByLabel('Zielabteilung').fill('Ward B');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('td', { hasText: 'UI Test Station' })).toBeVisible({ timeout: 10_000 });

    // Clean up
    const transports = await api._request('GET', '/transports');
    const created = transports.find(t => t.requester === 'UI Test Station');
    if (created) {
      api._createdTransports.push(created._id);
    }
  });

  test('shows export button', async ({ page }) => {
    await page.goto('/transports');
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 10_000 });
  });
});
