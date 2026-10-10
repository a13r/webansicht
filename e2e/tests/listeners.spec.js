const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Socket listeners across logout and login', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('does not register listeners twice after logout and login in the same tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });

    // logout
    await page.evaluate(() => document.getElementById('user').click());
    await page.evaluate(() => document.querySelector('.dropdown-item:last-child').click());
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible({ timeout: 10_000 });

    // login again without reloading the page
    await page.getByLabel('Benutzername').fill('admin');
    await page.getByLabel('Passwort').fill('changeme');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Nachrichen' }).click();
    await expect(page.locator('th', { hasText: 'Nachricht' })).toBeVisible();

    await api.createMessage({ message: 'E2E duplicate check' });

    // both handlers (if registered twice) fire on the same event, so the duplicate row
    // is present as soon as the first one is
    await expect(page.locator('td', { hasText: 'E2E duplicate check' })).toHaveCount(1);
  });
});
