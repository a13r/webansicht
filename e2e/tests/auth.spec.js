const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Authentication', () => {
  test('shows login form when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
    await expect(page.getByLabel('Benutzername')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await context.close();
  });

  test('login with valid credentials', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('Benutzername').fill('admin');
    await page.getByLabel('Passwort').fill('changeme');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test('shows error on invalid credentials', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('Benutzername').fill('admin');
    await page.getByLabel('Passwort').fill('wrongpassword');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 5_000 });
    await context.close();
  });

  test('logout successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => document.getElementById('user').click());
    await page.evaluate(() => document.querySelector('.dropdown-item:last-child').click());
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows dispo nav items for admin/dispo user', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'ETB' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Statusverlauf' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nachrichen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ressourcen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'SanHiSts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abtransporte' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Karte' })).toBeVisible();
  });

  test('hides dispo nav items for station-only user', async ({ browser }) => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const username = `stationuser-${suffix}`;
    const api = new ApiHelper();
    await api.authenticate();
    const user = await api.createUser({
      username,
      name: 'Station User',
      password: 'station123',
      initials: 'SU',
      roles: ['station'],
    });

    try {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByLabel('Benutzername').fill(username);
      await page.getByLabel('Passwort').fill('station123');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await expect(page.getByText('Station User')).toBeVisible({ timeout: 15_000 });

      await expect(page.getByRole('link', { name: 'ETB' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Statusverlauf' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Nachrichen' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Ressourcen' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'SanHiSts' })).toBeVisible();

      await context.close();
    } finally {
      await api.cleanup();
    }
  });
});
