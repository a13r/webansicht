const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Resource Administration', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('displays resource admin table', async ({ page }) => {
    await page.goto('/resourceAdmin');
    await expect(page.locator('th', { hasText: 'TETRA' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'Fahrzeug' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Kennung' })).toBeVisible();
  });

  test('creates new resource via UI', async ({ page }) => {
    const callSign = `E2E-NEW-${Math.random().toString(36).slice(2, 8)}`;
    await page.goto('/resourceAdmin');
    await page.getByRole('button', { name: 'Neue Ressource' }).click();
    await expect(page.locator('.card-header', { hasText: 'Neue Ressource' })).toBeVisible();

    await page.getByLabel('Kennung').fill(callSign);
    await page.getByLabel('Typ').fill('RTW');
    await page.getByLabel('Tetra').fill('55001');
    await page.getByLabel('Reihung').fill('10');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('td', { hasText: callSign })).toBeVisible({ timeout: 10_000 });

    // Clean up via API
    const resources = await api.getResources();
    const created = resources.find(r => r.callSign === callSign);
    if (created) {
      api._createdResources.push(created._id);
    }
  });

  test('edits existing resource', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'EDIT-1',
      type: 'KTW',
      tetra: '55002',
    });

    await page.goto('/resourceAdmin');
    await page.locator('tr', { hasText: 'EDIT-1' }).click();
    await expect(page.getByText('Ressource bearbeiten')).toBeVisible();

    await page.getByLabel('Kennung').fill('EDIT-UPDATED');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('td', { hasText: 'EDIT-UPDATED' })).toBeVisible({ timeout: 10_000 });
  });

  test('deletes resource (admin only)', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'DEL-1',
      type: 'RTW',
      tetra: '55003',
    });

    await page.goto('/resourceAdmin');
    await page.locator('tr', { hasText: 'DEL-1' }).click();
    await page.getByRole('button', { name: 'Löschen' }).click();

    // Confirm deletion by typing the callSign
    await expect(page.locator('.modal-title', { hasText: 'DEL-1' })).toBeVisible();
    await page.locator('.modal').getByLabel('Kennung zur Bestätigung wiederholen').fill('DEL-1');
    await page.locator('.modal').getByRole('button', { name: 'löschen' }).click();

    await expect(page.locator('td', { hasText: 'DEL-1' })).not.toBeVisible({ timeout: 10_000 });

    // Remove from cleanup list since already deleted
    api._createdResources = api._createdResources.filter(id => id !== resource._id);
  });

  test('"ausblenden" checkbox saves immediately without pressing Speichern', async ({ page }) => {
    const callSign = `HIDE-${Math.random().toString(36).slice(2, 8)}`;
    const resource = await api.createResource({ callSign, type: 'KTW', tetra: '55005', hidden: false });
    const hiddenOf = async () => (await api.getResources()).find(r => r._id === resource._id).hidden;

    await page.goto('/resourceAdmin');
    const row = page.locator('tr', { hasText: callSign });
    await row.click();
    await expect(page.getByText('Ressource bearbeiten')).toBeVisible();
    await expect(row.locator('.fa-eye-slash')).toHaveCount(0);

    await page.getByLabel('ausblenden').check();
    await expect.poll(hiddenOf).toBe(true);
    await expect(row.locator('.fa-eye-slash')).toBeVisible();

    await page.getByLabel('ausblenden').uncheck();
    await expect.poll(hiddenOf).toBe(false);
    await expect(row.locator('.fa-eye-slash')).toHaveCount(0);
  });

  test('Speichern is disabled while the form is invalid', async ({ page }) => {
    const save = page.getByRole('button', { name: 'Speichern' });

    await page.goto('/resourceAdmin');
    await page.getByRole('button', { name: 'Neue Ressource' }).click();
    await expect(save).toBeDisabled();

    // Kennung and Typ are both required
    await page.getByLabel('Kennung').fill('INVALID-1');
    await expect(save).toBeDisabled();
    await page.getByLabel('Typ').fill('RTW');
    await expect(save).toBeEnabled();

    await page.getByLabel('Kennung').fill('');
    await expect(save).toBeDisabled();
    await page.getByLabel('Kennung').fill('INVALID-1');
    await expect(save).toBeEnabled();

    // Reihung is required too
    await page.getByLabel('Reihung').fill('');
    await expect(save).toBeDisabled();
  });

  test('Speichern is disabled when a required field of an existing resource is cleared', async ({ page }) => {
    const callSign = `REQ-${Math.random().toString(36).slice(2, 8)}`;
    await api.createResource({ callSign, type: 'KTW', tetra: '55006' });

    await page.goto('/resourceAdmin');
    await page.locator('tr', { hasText: callSign }).click();
    const save = page.getByRole('button', { name: 'Speichern' });
    await expect(save).toBeEnabled();

    await page.getByLabel('Typ').fill('');
    await expect(save).toBeDisabled();
    await page.getByLabel('Typ').fill('RTW');
    await expect(save).toBeEnabled();
  });

  // Not covered: the error toast when creating/saving fails. The server accepts every payload the
  // form can produce (no unique constraints, validation mirrors the client), so there is no
  // realistic way to provoke a server error from the UI. The unit test from #107 covers it.

  test('hides delete button for non-admin dispo user', async ({ browser }) => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const username = `dispoonly-${suffix}`;
    const api2 = new ApiHelper();
    await api2.authenticate();
    const user = await api2.createUser({
      username,
      name: 'Dispo Only',
      password: 'dispo123',
      initials: 'DO',
      roles: ['dispo'],
    });
    const resource = await api.createResource({
      callSign: `NODELETE-${suffix}`,
      type: 'RTW',
      tetra: '55004',
    });

    try {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByLabel('Benutzername').fill(username);
      await page.getByLabel('Passwort').fill('dispo123');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await expect(page.getByText('Dispo Only')).toBeVisible({ timeout: 15_000 });

      await page.goto('/resourceAdmin');
      await page.locator('tr', { hasText: `NODELETE-${suffix}` }).click();
      await expect(page.getByText('Ressource bearbeiten')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Löschen' })).not.toBeVisible();

      await context.close();
    } finally {
      await api2.cleanup();
    }
  });
});
