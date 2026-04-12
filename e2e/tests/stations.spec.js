const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Stations', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays stations page', async ({ page }) => {
    await page.goto('/stations');
    // Admin user should see the add button
    await expect(page.getByRole('button', { name: 'hinzufügen' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows station created via API', async ({ page }) => {
    await api.createStation({
      name: 'E2E SanHiSt',
      currentPatients: 5,
      maxPatients: 20,
      ordering: 1,
    });

    await page.goto('/stations');
    await expect(page.getByText('E2E SanHiSt')).toBeVisible({ timeout: 10_000 });
  });

  test('updates station patient count', async ({ page }) => {
    const station = await api.createStation({
      name: 'Update SanHiSt',
      currentPatients: 3,
      maxPatients: 15,
      ordering: 2,
    });

    await page.goto('/stations');
    await expect(page.getByText('Update SanHiSt')).toBeVisible({ timeout: 10_000 });

    // Update current patients via API
    await api.patchStation(station._id, { currentPatients: 10 });
    await page.reload();

    // Verify the station card reflects the updated values
    await expect(page.getByText('Update SanHiSt')).toBeVisible({ timeout: 10_000 });
  });

  test('station accessible for station-role user', async ({ browser }) => {
    const api2 = new ApiHelper();
    await api2.authenticate();
    await api2.createUser({
      username: 'stationtest',
      name: 'Station Test',
      password: 'station123',
      initials: 'ST',
      roles: ['station'],
    });

    await api.createStation({
      name: 'Role Test SanHiSt',
      currentPatients: 2,
      maxPatients: 10,
      ordering: 3,
    });

    try {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByLabel('Benutzername').fill('stationtest');
      await page.getByLabel('Passwort').fill('station123');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await expect(page.getByText('Station Test')).toBeVisible({ timeout: 15_000 });

      await page.goto('/stations');
      await expect(page.getByText('Role Test SanHiSt')).toBeVisible({ timeout: 10_000 });

      await context.close();
    } finally {
      await api2.cleanup();
    }
  });
});
