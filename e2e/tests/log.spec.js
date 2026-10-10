const { test, expect } = require('@playwright/test');
const { OverviewHelper, uniqueSuffix } = require('../helpers/overview');

test.describe('Status History (Log)', () => {
  let api;
  let RUN;

  test.beforeEach(async () => {
    RUN = uniqueSuffix();
    api = new OverviewHelper();
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
      callSign: `LOG-E2E-${RUN}`,
      type: 'RTW',
      tetra: '66001',
      state: 0,
    });

    // Simulate LARDIS status change
    await api.patchResource(resource._id, { state: 1 });

    await page.goto('/log');
    await expect(page.locator('td', { hasText: `LOG-E2E-${RUN}` }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td', { hasText: 'Einsatzbereit' }).first()).toBeVisible();
  });

  test('shows log with correct state colors', async ({ page }) => {
    const resource = await api.createResource({
      callSign: `LOGCOLOR-${RUN}`,
      type: 'RTW',
      tetra: '66002',
      state: 0,
    });

    await api.patchResource(resource._id, { state: 3 });

    await page.goto('/log');
    const row = page.locator('tr', { hasText: `LOGCOLOR-${RUN}` }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.locator('td', { hasText: 'am Berufungsort' })).toBeVisible();
    await expect(row).toHaveCSS('background-color', 'rgb(255, 173, 91)');
  });

  test('resource filter applies to live entries and survives sort toggle', async ({ page }) => {
    const filtered = await api.createResource({
      callSign: `LOGFLT-A-${RUN}`,
      type: 'RTW',
      tetra: '66003',
      state: 0,
    });
    const other = await api.createResource({
      callSign: `LOGFLT-B-${RUN}`,
      type: 'RTW',
      tetra: '66004',
      state: 0,
    });

    await page.goto('/log');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    await page.locator('select').selectOption({ label: `LOGFLT-A-${RUN}` });

    // Live entry for the filtered resource appears, the other one does not
    await api.patchResource(other._id, { state: 1 });
    await api.patchResource(filtered._id, { state: 3 });
    await expect(page.locator('tr', { hasText: `LOGFLT-A-${RUN}` }).locator('td', { hasText: 'am Berufungsort' })).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator('td', { hasText: `LOGFLT-B-${RUN}` })).toHaveCount(0);

    // Toggling the sort order keeps the filter
    await page.locator('i.fa-sort-desc').click();
    await expect(page.locator('i.fa-sort-asc')).toBeVisible();
    await expect(page.locator('td', { hasText: `LOGFLT-A-${RUN}` })).not.toHaveCount(0);
    await expect(page.locator('td', { hasText: `LOGFLT-B-${RUN}` })).toHaveCount(0);

    // Live entries keep being filtered after the toggle
    await api.patchResource(other._id, { state: 3 });
    await api.patchResource(filtered._id, { state: 1 });
    await expect(page.locator('tr', { hasText: `LOGFLT-A-${RUN}` }).locator('td', { hasText: 'Einsatzbereit' })).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator('td', { hasText: `LOGFLT-B-${RUN}` })).toHaveCount(0);
  });
  test('sort toggle reverses the order of the entries', async ({ page }) => {
    const resource = await api.createResource({
      callSign: `LOGSORT-${RUN}`,
      type: 'RTW',
      tetra: '66005',
      state: 0,
    });
    await api.patchResource(resource._id, { state: 1 });
    await api.patchResource(resource._id, { state: 3 });

    await page.goto('/log');
    const rows = page.locator('tr.logRow', { hasText: `LOGSORT-${RUN}` });
    // newest first by default
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('am Berufungsort');
    await expect(rows.nth(1)).toContainText('Einsatzbereit');
    await expect(rows.nth(2)).toContainText('Außer Dienst');

    await page.locator('i.fa-sort-desc').click();
    await expect(page.locator('i.fa-sort-asc')).toBeVisible();
    await expect(rows.nth(0)).toContainText('Außer Dienst');
    await expect(rows.nth(1)).toContainText('Einsatzbereit');
    await expect(rows.nth(2)).toContainText('am Berufungsort');

    // new live entries are appended at the end in ascending order ...
    await api.patchResource(resource._id, { state: 5 });
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(3)).toContainText('am Zielort');

    // ... and toggling back restores newest first
    await page.locator('i.fa-sort-asc').click();
    await expect(page.locator('i.fa-sort-desc')).toBeVisible();
    await expect(rows.nth(0)).toContainText('am Zielort');
    await expect(rows.nth(3)).toContainText('Außer Dienst');
  });

  test('resource filter lists only the entries of the selected resource and can be reset', async ({ page }) => {
    const a = await api.createResource({ callSign: `LOGSEL-A-${RUN}`, type: 'RTW', tetra: '66006', state: 0 });
    const b = await api.createResource({ callSign: `LOGSEL-B-${RUN}`, type: 'RTW', tetra: '66007', state: 0 });
    await api.patchResource(a._id, { state: 1 });
    await api.patchResource(b._id, { state: 1 });

    await page.goto('/log');
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-A-${RUN}` })).toHaveCount(2);
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-B-${RUN}` })).toHaveCount(2);

    await page.locator('select').selectOption({ label: `LOGSEL-B-${RUN}` });
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-A-${RUN}` })).toHaveCount(0);
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-B-${RUN}` })).toHaveCount(2);

    await page.locator('select').selectOption({ label: '(alle)' });
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-A-${RUN}` })).toHaveCount(2);
    await expect(page.locator('tr.logRow', { hasText: `LOGSEL-B-${RUN}` })).toHaveCount(2);
  });

  test('history button in the resource editor opens the log filtered by that resource', async ({ page }) => {
    const a = await api.createResource({ callSign: `LOGHIST-A-${RUN}`, type: 'RTW', tetra: '66008', state: 0 });
    const b = await api.createResource({ callSign: `LOGHIST-B-${RUN}`, type: 'RTW', tetra: '66009', state: 0 });
    await api.patchResource(a._id, { state: 1 });
    await api.patchResource(b._id, { state: 1 });

    await page.goto('/');
    await page.locator('tr', { hasText: `LOGHIST-B-${RUN}` }).click();
    await expect(page.getByLabel('Ressource', { exact: true })).toHaveValue(b._id);
    await page.locator('button:has(.fa-history)').click();

    await expect(page).toHaveURL(/\/log$/);
    await expect(page.locator('select')).toHaveValue(b._id);
    await expect(page.locator('tr.logRow', { hasText: `LOGHIST-B-${RUN}` })).toHaveCount(2);
    await expect(page.locator('tr.logRow', { hasText: `LOGHIST-A-${RUN}` })).toHaveCount(0);

    // the filter belongs to the log store: going back to the overview and
    // choosing another resource shows that resource's history instead
    await page.getByRole('link', { name: /Übersicht/ }).click();
    await page.locator('tr', { hasText: `LOGHIST-A-${RUN}` }).click();
    await expect(page.getByLabel('Ressource', { exact: true })).toHaveValue(a._id);
    await page.locator('button:has(.fa-history)').click();
    await expect(page.locator('select')).toHaveValue(a._id);
    await expect(page.locator('tr.logRow', { hasText: `LOGHIST-A-${RUN}` })).toHaveCount(2);
    await expect(page.locator('tr.logRow', { hasText: `LOGHIST-B-${RUN}` })).toHaveCount(0);
  });

  test('status changes made in the UI are logged with the initials of the dispo user', async ({ browser }) => {
    await api.createResource({ callSign: `LOGUSER-${RUN}`, type: 'RTW', tetra: '66010', state: 0 });
    const { user, page } = await api.loginAsNewUser(browser, ['dispo']);

    await page.locator('tr', { hasText: `LOGUSER-${RUN}` }).click();
    await page.getByLabel('Status', { exact: true }).selectOption('2');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await page.getByRole('link', { name: /Statusverlauf/ }).click();
    const rows = page.locator('tr.logRow', { hasText: `LOGUSER-${RUN}` });
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('zum Berufungsort');
    await expect(rows.first().locator('td').last()).toHaveText(user.initials);
    // the entry created together with the resource was made via the API as admin, not by the dispo user
    // (the admin may or may not have initials, so only assert that they are not the dispo user's)
    await expect(rows.last()).toContainText('Außer Dienst');
    await expect(rows.last().locator('td').last()).not.toHaveText(user.initials);
  });

  test('log is not available to users without the dispo role', async ({ browser }) => {
    await api.createResource({ callSign: `LOGDENY-${RUN}`, type: 'RTW', tetra: '66011', state: 0 });
    const { user, page } = await api.loginAsNewUser(browser, ['station']);

    await page.goto('/log');
    await expect(page.getByText(user.name)).toBeVisible();
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toHaveCount(0);
    await expect(page.locator('td', { hasText: `LOGDENY-${RUN}` })).toHaveCount(0);
  });
});
