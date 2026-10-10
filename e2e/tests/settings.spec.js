const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { ApiHelper } = require('../helpers/api');
const { randomSuffix, loginInNewContext, getUserByUsername, trackUser } = require('../helpers/settings');

const panel = (page, title) => page.locator('.card', { has: page.locator('.card-header', { hasText: title }) });

test.describe('Settings: user management', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('creates a user and edits its roles', async ({ page, browser }) => {
    const suffix = randomSuffix();
    const username = `ui-user-${suffix}`;
    const name = `UI User ${suffix}`;

    await page.goto('/settings');
    const users = panel(page, 'Benutzer verwalten');
    await expect(users).toBeVisible({ timeout: 15_000 });

    await users.getByRole('button', { name: 'neu' }).click();
    await users.getByLabel('Benutzername').fill(username);
    await users.getByLabel('Name', { exact: true }).fill(name);
    await users.getByLabel('Neues Passwort', { exact: true }).fill('secret-pw-1');
    await users.getByLabel('Neues Passwort (wdh.)').fill('secret-pw-1');
    await users.getByLabel('SanHiSt', { exact: true }).check();
    await users.getByRole('button', { name: 'speichern' }).click();

    await expect(page.getByText(`${name} wurde erfolgreich erstellt.`)).toBeVisible();
    const created = await trackUser(api, username);
    expect(created.roles).toEqual(['station']);

    // The new user is selected in the list; change its roles
    await expect(users.getByLabel('Benutzer', { exact: true })).toHaveValue(created._id);
    await users.getByLabel('Transporte').check();
    await users.getByLabel('SanHiSt', { exact: true }).uncheck();
    await users.getByLabel('Disponent').check();
    await users.getByLabel('Kürzel').fill('UIU');
    await users.getByRole('button', { name: 'speichern' }).click();
    await expect(page.getByText(`${name} wurde geändert`)).toBeVisible();

    await expect.poll(async () => (await getUserByUsername(api, username)).roles.sort())
      .toEqual(['dispo', 'transports']);

    // The created user can really log in with the password set in the UI
    const { context, page: userPage } = await loginInNewContext(browser, username, 'secret-pw-1', name);
    await expect(userPage.getByRole('link', { name: 'ETB' })).toBeVisible();
    await context.close();
  });

  test('a user in the list can be selected and edited', async ({ page }) => {
    const user = await api.createUser({ name: `Select Me ${randomSuffix()}`, roles: ['station'] });

    await page.goto('/settings');
    const users = panel(page, 'Benutzer verwalten');
    await users.getByLabel('Benutzer', { exact: true }).selectOption({ label: user.name });
    await expect(users.getByLabel('Benutzername')).toHaveValue(user.username);
    await expect(users.getByLabel('SanHiSt', { exact: true })).toBeChecked();
    await expect(users.getByLabel('Administrator')).not.toBeChecked();

    await users.getByLabel('Administrator').check();
    await users.getByRole('button', { name: 'speichern' }).click();
    await expect(page.getByText(`${user.name} wurde geändert`)).toBeVisible();
    await expect.poll(async () => (await getUserByUsername(api, user.username)).roles.sort())
      .toEqual(['admin', 'station']);
  });

  test('non-admin does not see user management, export, import and delete data', async ({ browser }) => {
    const user = await api.createUser({ name: 'Plain Station', password: 'station-pw-1', roles: ['station'] });
    const { context, page } = await loginInNewContext(browser, user.username, 'station-pw-1', 'Plain Station');

    await page.goto('/settings');
    await expect(panel(page, 'Passwort ändern')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.card-header', { hasText: 'Benutzer verwalten' })).toHaveCount(0);
    await expect(page.locator('.card-header', { hasText: 'Export' })).toHaveCount(0);
    await expect(page.locator('.card-header', { hasText: 'Import' })).toHaveCount(0);
    await expect(page.locator('.card-header', { hasText: 'Daten löschen' })).toHaveCount(0);

    // The server enforces this as well
    const stationApi = new ApiHelper();
    await stationApi.authenticate(user.username, 'station-pw-1');
    const res = await fetch(`${stationApi.baseURL}/export.tar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stationApi.token}` },
    });
    expect(res.status).toBeGreaterThanOrEqual(401);
    expect(res.status).toBeLessThan(500);
    await context.close();
  });

  test('dispo without admin role does not see user management', async ({ browser }) => {
    const user = await api.createUser({ name: 'Plain Dispo', password: 'dispo-pw-12', roles: ['dispo'], initials: 'PD' });
    const { context, page } = await loginInNewContext(browser, user.username, 'dispo-pw-12', 'Plain Dispo');
    await page.goto('/settings');
    await expect(panel(page, 'Passwort ändern')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.card-header', { hasText: 'Benutzer verwalten' })).toHaveCount(0);
    await context.close();
  });
});

test.describe('Settings: change password', () => {
  test('changes the password and logs in with the new one', async ({ browser }) => {
    const api = new ApiHelper();
    await api.authenticate();
    try {
      const user = await api.createUser({ name: 'Pw Changer', password: 'old-password-1', roles: ['station'] });
      const { context, page } = await loginInNewContext(browser, user.username, 'old-password-1', 'Pw Changer');

      await page.goto('/settings');
      const pw = panel(page, 'Passwort ändern');
      const save = pw.getByRole('button', { name: 'speichern' });

      // Invalid input keeps the button disabled
      await expect(save).toBeDisabled();
      await pw.getByLabel('Altes Passwort').fill('old-password-1');
      await pw.getByLabel('Neues Passwort', { exact: true }).fill('new-password-2');
      await pw.getByLabel('Neues Passwort (wiederholen)').fill('something-else-3');
      await expect(save).toBeDisabled();
      await pw.getByLabel('Neues Passwort (wiederholen)').fill('new-password-2');
      await expect(save).toBeEnabled();

      await save.click();
      await expect(page.getByText('Das Passwort wurde geändert')).toBeVisible();
      await expect(pw.getByLabel('Altes Passwort')).toHaveValue('');

      // Log out and in again with the new password in the same tab
      await page.getByText('Pw Changer').click();
      await page.getByRole('button', { name: 'Abmelden' }).click();
      await page.getByLabel('Benutzername').fill(user.username);
      await page.getByLabel('Passwort').fill('old-password-1');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await expect(page.locator('.alert-danger')).toBeVisible();
      await page.getByLabel('Benutzername').fill(user.username);
      await page.getByLabel('Passwort').fill('new-password-2');
      await page.getByRole('button', { name: 'Anmelden' }).click();
      await expect(page.getByText('Pw Changer')).toBeVisible({ timeout: 15_000 });
      await context.close();
    } finally {
      await api.cleanup();
    }
  });

  test('a wrong old password is rejected and the password stays unchanged', async ({ browser }) => {
    const api = new ApiHelper();
    await api.authenticate();
    try {
      const user = await api.createUser({ name: 'Pw Keeper', password: 'keep-password-1', roles: ['station'] });
      const { context, page } = await loginInNewContext(browser, user.username, 'keep-password-1', 'Pw Keeper');

      await page.goto('/settings');
      const pw = panel(page, 'Passwort ändern');
      await pw.getByLabel('Altes Passwort').fill('not-the-old-one');
      await pw.getByLabel('Neues Passwort', { exact: true }).fill('new-password-2');
      await pw.getByLabel('Neues Passwort (wiederholen)').fill('new-password-2');
      await pw.getByRole('button', { name: 'speichern' }).click();
      await expect(page.getByText('Das Passwort wurde nicht geändert')).toBeVisible();

      // Still the old password
      const check = new ApiHelper();
      await check.authenticate(user.username, 'keep-password-1');
      await context.close();
    } finally {
      await api.cleanup();
    }
  });
});

test.describe('Settings: database export/import', () => {
  test('export downloads a tar archive', async ({ page }) => {
    await page.goto('/settings');
    const exportPanel = panel(page, 'Export');
    await expect(exportPanel).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download');
    await exportPanel.getByRole('button', { name: 'Datenbank exportieren' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.tar$/);
    const file = await download.path();
    const head = fs.readFileSync(file).subarray(0, 512);
    // POSIX tar header: "ustar" magic at offset 257
    expect(head.subarray(257, 262).toString()).toBe('ustar');
  });

  // A successful import replaces the data of every collection and makes the server reload all
  // connected clients ~2s later. The suite runs fully parallel against one database, so doing
  // that here would wipe or reload other specs mid-test. Only the paths that don't change
  // server state are covered: client-side file type validation and the server rejecting an
  // invalid archive.
  test('rejects a file that is not a tar archive on the client', async ({ page }) => {
    await page.goto('/settings');
    const importPanel = panel(page, 'Import');
    const button = importPanel.getByRole('button', { name: 'Datenbank importieren' });
    await expect(button).toBeDisabled();

    await importPanel.getByLabel('Datei (tar)').setInputFiles({
      name: 'backup.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a tar'),
    });
    await expect(importPanel.getByText('Datei ist keine tar-Datei')).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('shows the server error for an invalid tar archive and leaves data untouched', async ({ page }) => {
    const api = new ApiHelper();
    await api.authenticate();
    try {
      const resource = await api.createResource({ callSign: `IMPORT-KEEP-${randomSuffix()}` });

      await page.goto('/settings');
      const importPanel = panel(page, 'Import');
      await importPanel.getByLabel('Datei (tar)').setInputFiles({
        name: 'broken.tar',
        mimeType: 'application/x-tar',
        buffer: Buffer.from('this is definitely not a tar archive'),
      });
      const button = importPanel.getByRole('button', { name: 'Datenbank importieren' });
      await expect(button).toBeEnabled();
      await button.click();

      await expect(page.getByText(/Invalid backup/)).toBeVisible();
      await expect(page.getByText('Datenbank wurde importiert')).toHaveCount(0);

      const resources = await api.getResources();
      expect(resources.some(r => r._id === resource._id)).toBe(true);
    } finally {
      await api.cleanup();
    }
  });
});

test.describe('Settings: delete data', () => {
  // Deleting data would remove resources, journal entries, ... that other specs create and rely on
  // while running in parallel, so the actual deletion is not exercised here. The confirmation
  // flow and cancelling are.
  test('requires the confirmation text and cancelling deletes nothing', async ({ page }) => {
    const api = new ApiHelper();
    await api.authenticate();
    try {
      const resource = await api.createResource({ callSign: `DELDATA-KEEP-${randomSuffix()}` });

      await page.goto('/settings');
      const del = panel(page, 'Daten löschen');
      await expect(del).toBeVisible({ timeout: 15_000 });
      const open = del.getByRole('button', { name: 'Löschen' });
      await expect(open).toBeDisabled();

      await del.getByLabel('Ressourcen').check();
      await expect(open).toBeEnabled();
      await open.click();

      const modal = page.locator('.modal');
      await expect(modal.locator('.modal-title')).toHaveText('Daten löschen');
      await expect(modal.getByText('Folgende Daten werden gelöscht:')).toBeVisible();
      await expect(modal.getByRole('listitem')).toHaveText(['Ressourcen']);

      // Without (or with a wrong) confirmation the delete button stays disabled
      const confirmDelete = modal.getByRole('button', { name: 'Löschen' });
      await expect(confirmDelete).toBeDisabled();
      await modal.getByLabel('Bitte "ja, wirklich" eingeben:').fill('ja');
      await expect(confirmDelete).toBeDisabled();

      // Leaving the field shows the validation message, which moves the buttons down. Wait for it
      // before clicking, otherwise the click can land between mousedown and mouseup on a shifted layout.
      await modal.getByLabel('Bitte "ja, wirklich" eingeben:').blur();
      await expect(modal.getByText('Wert ist nicht "ja, wirklich"')).toBeVisible();

      await modal.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(modal).toHaveCount(0);

      // The selection is reset and nothing was removed
      await expect(del.getByLabel('Ressourcen')).not.toBeChecked();
      await expect(open).toBeDisabled();
      const resources = await api.getResources();
      expect(resources.some(r => r._id === resource._id)).toBe(true);
    } finally {
      await api.cleanup();
    }
  });
});
