const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { setShowDeleted, uniqueSuffix, createStationUser, loginInFreshContext } = require('../helpers/stations');

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
    const stationName = `E2E SanHiSt ${uniqueSuffix()}`;
    await api.createStation({
      name: stationName,
      currentPatients: 5,
      maxPatients: 20,
      ordering: 1,
    });

    await page.goto('/stations');
    await expect(page.getByText(stationName)).toBeVisible({ timeout: 10_000 });
  });

  test('updates station patient count', async ({ page }) => {
    const stationName = `Update SanHiSt ${uniqueSuffix()}`;
    const station = await api.createStation({
      name: stationName,
      currentPatients: 3,
      maxPatients: 15,
      ordering: 2,
    });

    await page.goto('/stations');
    const card = page.locator('.card', { hasText: stationName });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByLabel('Patienten aktuell')).toHaveValue('3');
    await expect(card.getByRole('progressbar')).toHaveText('3/15');

    // Update current patients via API: the card is updated live via the socket event
    await api.patchStation(station._id, { currentPatients: 10 });
    await expect(card.getByLabel('Patienten aktuell')).toHaveValue('10');
    await expect(card.getByRole('progressbar')).toHaveText('10/15');

    // ...and the persisted value is shown after a reload as well
    await page.reload();
    await expect(card.getByLabel('Patienten aktuell')).toHaveValue('10');
    await expect(card.getByRole('progressbar')).toHaveText('10/15');
  });

  test('new station card is highlighted before saving', async ({ page }) => {
    await page.goto('/stations');
    const addButton = page.getByRole('button', { name: 'hinzufügen' });
    await expect(addButton).toBeVisible({ timeout: 10_000 });

    await addButton.click();

    const newCard = page.locator('.card', { hasText: 'Neue SanHiSt' });
    await expect(newCard).toBeVisible({ timeout: 10_000 });
    await expect(newCard).toHaveClass(/bg-warning-subtle/);

    // Clean up by clicking "abbrechen"
    await newCard.getByRole('button', { name: 'abbrechen' }).click();
    await expect(newCard).toHaveCount(0);
  });

  test('new station survives a find() that resolves while it is unsaved', async ({ page }) => {
    // Regression: find() used to replace the list and drop the station that was
    // added in the UI but not yet saved. Toggling "ausgeblendete anzeigen" triggers
    // a find(); the hidden station only appears once that find() has resolved.
    const hiddenName = `Hidden SanHiSt ${uniqueSuffix()}`;
    const shownName = `Shown SanHiSt ${uniqueSuffix()}`;
    await api.createStation({ name: hiddenName, deleted: true });
    await api.createStation({ name: shownName });

    await page.goto('/stations');
    const addButton = page.getByRole('button', { name: 'hinzufügen' });
    // the initial find() has resolved once the visible station is shown
    await expect(page.locator('.card-header', { hasText: shownName })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.card-header', { hasText: hiddenName })).toHaveCount(0);

    await addButton.click();
    await expect(page.locator('.card-header', { hasText: 'Neue SanHiSt' })).toHaveCount(1);

    await setShowDeleted(page, true);
    await expect(page.locator('.card-header', { hasText: hiddenName })).toBeVisible();

    // The unsaved station is still there, exactly once
    const newCard = page.locator('.card', { hasText: 'Neue SanHiSt' });
    await expect(newCard).toHaveCount(1);
    await expect(newCard).toHaveClass(/bg-warning-subtle/);
  });

  test('station card is not highlighted after saving changes', async ({ page }) => {
    const stationName = `Highlight Test ${uniqueSuffix()}`;
    await api.createStation({
      name: stationName,
      currentPatients: 0,
      maxPatients: 10,
      ordering: 1,
    });

    await page.goto('/stations');

    const card = page.locator('.card', { hasText: stationName });
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Change a field so the card becomes highlighted
    await card.getByLabel('Patienten maximal').fill('20');
    await expect(card).toHaveClass(/bg-warning-subtle/);

    // Save
    await card.getByRole('button', { name: 'speichern' }).click();

    // After saving, the card should no longer be highlighted
    await expect(card).not.toHaveClass(/bg-warning-subtle/, { timeout: 10_000 });
  });

  test('creating a station via UI shows exactly one entry', async ({ page }) => {
    const stationName = `UI Station ${uniqueSuffix()}`;
    await page.goto('/stations');
    await expect(page.getByRole('button', { name: 'hinzufügen' })).toBeVisible({ timeout: 10_000 });

    // Click "hinzufügen" to add a new station
    await page.getByRole('button', { name: 'hinzufügen' }).click();

    // Fill in the name field for the new station
    const newCard = page.locator('.card', { hasText: 'Neue SanHiSt' });
    await expect(newCard).toBeVisible();
    await newCard.getByLabel('Name').fill(stationName);

    // After typing the name, the card header updates dynamically — re-locate by new name
    const namedCard = page.locator('.card', { hasText: stationName });

    // Click "speichern" to save
    await namedCard.getByRole('button', { name: 'speichern' }).click();

    // Wait for the station to be persisted (card header updates to the station name)
    await expect(page.locator('.card-header', { hasText: stationName })).toBeVisible({ timeout: 10_000 });

    // Socket events arrive in order: once a station created afterwards via the API
    // is shown, the 'created' event of the UI station has been processed as well.
    const sentinelName = `Sentinel ${stationName}`;
    await api.createStation({ name: sentinelName, ordering: 99 });
    await expect(page.locator('.card-header', { hasText: sentinelName })).toBeVisible();

    // Bug: after saving, there should be exactly ONE card with this station name, not two
    await expect(page.locator('.card-header', { hasText: stationName })).toHaveCount(2); // own + sentinel
    await expect(page.locator('.card-header', { hasText: new RegExp(`^${stationName}$`) })).toHaveCount(1);

    // After saving a new station, the card should no longer be highlighted
    const savedCard = page.locator('.card', { has: page.locator('.card-header', { hasText: new RegExp(`^${stationName}$`) }) });
    await expect(savedCard).not.toHaveClass(/bg-warning-subtle/, { timeout: 10_000 });

    // Clean up the created station via API
    const stations = await api._request('GET', `/stations?name=${encodeURIComponent(stationName)}`);
    for (const s of stations.data || stations) {
      await api._request('DELETE', `/stations/${s._id}`).catch(() => {});
    }
  });

  test('show-deleted toggle reveals and hides deleted stations', async ({ page }) => {
    const suffix = uniqueSuffix();
    const visibleName = `Visible SanHiSt ${suffix}`;
    const hiddenName = `Deleted SanHiSt ${suffix}`;
    await api.createStation({ name: visibleName, ordering: 1 });
    await api.createStation({ name: hiddenName, ordering: 2, deleted: true });

    await page.goto('/stations');
    const toggle = page.getByLabel('ausgeblendete anzeigen');
    await expect(page.locator('.card-header', { hasText: visibleName })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.card-header', { hasText: hiddenName })).toHaveCount(0);
    await expect(toggle).not.toBeChecked();

    await setShowDeleted(page, true);
    await expect(page.locator('.card-header', { hasText: hiddenName })).toBeVisible();
    await expect(page.locator('.card-header', { hasText: visibleName })).toBeVisible();
    const hiddenCard = page.locator('.card', { hasText: hiddenName });
    await expect(hiddenCard.getByLabel('ausgeblendet')).toBeChecked();

    await setShowDeleted(page, false);
    await expect(page.locator('.card-header', { hasText: hiddenName })).toHaveCount(0);
    await expect(page.locator('.card-header', { hasText: visibleName })).toBeVisible();
  });

  test('marking a station as hidden removes it from the list', async ({ page }) => {
    const stationName = `Hide Me SanHiSt ${uniqueSuffix()}`;
    await api.createStation({ name: stationName });

    await page.goto('/stations');
    const card = page.locator('.card', { hasText: stationName });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByLabel('ausgeblendet').check();
    await card.getByRole('button', { name: 'speichern' }).click();
    await expect(page.locator('.card-header', { hasText: stationName })).toHaveCount(0);
  });

  test('station with maxPatients = 0 is displayed and can be saved', async ({ page }) => {
    const stationName = `Zero Max SanHiSt ${uniqueSuffix()}`;
    const station = await api.createStation({ name: stationName, currentPatients: 0, maxPatients: 0 });

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error));

    await page.goto('/stations');
    const card = page.locator('.card', { hasText: stationName });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByLabel('Patienten maximal')).toHaveValue('0');
    await expect(card.getByRole('progressbar')).toHaveText('0/0');

    // patients with no capacity: the bar is capped at 100 %
    await card.getByLabel('Patienten aktuell').fill('4');
    await expect(card.getByRole('progressbar')).toHaveText('4/0');
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await card.getByRole('button', { name: 'speichern' }).click();
    await expect(card).not.toHaveClass(/bg-warning-subtle/);

    // persisted
    await page.reload();
    await expect(card.getByLabel('Patienten aktuell')).toHaveValue('4');
    await expect(card.getByLabel('Patienten maximal')).toHaveValue('0');
    const persisted = await api._request('GET', `/stations/${station._id}`);
    expect(persisted.maxPatients).toBe(0);
    expect(persisted.currentPatients).toBe(4);
    expect(pageErrors).toEqual([]);
  });

  test('station accessible for station-role user', async ({ browser }) => {
    const user = await createStationUser(api);
    const stationName = `Role Test SanHiSt ${uniqueSuffix()}`;
    await api.createStation({
      name: stationName,
      currentPatients: 2,
      maxPatients: 10,
      ordering: 3,
    });

    const { context, page } = await loginInFreshContext(browser, user);
    try {
      await page.goto('/stations');
      await expect(page.getByText(stationName)).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('station-role user can only edit the assigned station', async ({ browser }) => {
    const suffix = uniqueSuffix();
    const ownName = `Own SanHiSt ${suffix}`;
    const otherName = `Other SanHiSt ${suffix}`;
    const own = await api.createStation({ name: ownName, currentPatients: 1, maxPatients: 10, ordering: 1 });
    await api.createStation({ name: otherName, currentPatients: 2, maxPatients: 10, ordering: 2 });
    const user = await createStationUser(api, { stationId: own._id });

    const { context, page } = await loginInFreshContext(browser, user);
    try {
      await page.goto('/stations');
      const ownCard = page.locator('.card', { hasText: ownName });
      const otherCard = page.locator('.card', { hasText: otherName });
      await expect(ownCard).toBeVisible({ timeout: 10_000 });
      await expect(otherCard).toBeVisible();

      // admin-only controls are not available to the station role
      await expect(page.getByRole('button', { name: 'hinzufügen' })).toHaveCount(0);
      await expect(ownCard.getByLabel('Name')).toHaveCount(0);

      await expect(otherCard.getByLabel('Patienten aktuell')).toBeDisabled();
      await expect(otherCard.getByLabel('Patienten maximal')).toBeDisabled();
      await expect(otherCard.getByRole('button', { name: 'speichern' })).toBeDisabled();

      await expect(ownCard.getByLabel('Patienten aktuell')).toBeEnabled();
      await expect(ownCard.getByLabel('Patienten maximal')).toBeEnabled();
      await ownCard.getByLabel('Patienten aktuell').fill('7');
      await ownCard.getByRole('button', { name: 'speichern' }).click();
      await expect(ownCard).not.toHaveClass(/bg-warning-subtle/);
      await expect(ownCard.getByRole('progressbar')).toHaveText('7/10');

      const persisted = await api._request('GET', `/stations/${own._id}`);
      expect(persisted.currentPatients).toBe(7);
    } finally {
      await context.close();
    }
  });

  test('station-role user without stationId sees all stations read-only', async ({ browser }) => {
    const stationName = `ReadOnly SanHiSt ${uniqueSuffix()}`;
    await api.createStation({ name: stationName, currentPatients: 2, maxPatients: 10 });
    const user = await createStationUser(api);

    const { context, page } = await loginInFreshContext(browser, user);
    try {
      await page.goto('/stations');
      const card = page.locator('.card', { hasText: stationName });
      await expect(card).toBeVisible({ timeout: 10_000 });
      await expect(card.getByLabel('Patienten aktuell')).toBeDisabled();
      await expect(card.getByLabel('Patienten maximal')).toBeDisabled();
      await expect(card.getByRole('button', { name: 'speichern' })).toBeDisabled();
      await expect(card.getByRole('button', { name: 'abbrechen' })).toBeDisabled();
    } finally {
      await context.close();
    }
  });
});
