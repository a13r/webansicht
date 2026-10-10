const { expect } = require('@playwright/test');

function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Creates a user (default role: station) via the given ApiHelper and returns
 * its credentials. The user is removed by api.cleanup().
 */
async function createStationUser(api, data = {}) {
  const suffix = uniqueSuffix();
  const credentials = {
    username: `stationuser-${suffix}`,
    name: `Station User ${suffix}`,
    password: 'station123',
    initials: suffix.toUpperCase().slice(0, 4),
    roles: ['station'],
    ...data,
  };
  const user = await api.createUser(credentials);
  return { ...credentials, _id: user._id };
}

/**
 * Opens a fresh browser context without the admin storage state, logs in as
 * the given user and returns { context, page }.
 */
async function loginInFreshContext(browser, { username, password, name }) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel('Benutzername').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
  return { context, page };
}

/**
 * Toggles the "ausgeblendete anzeigen" checkbox via keyboard. At the default
 * viewport the checkbox sits partly below the fixed navbar (which wraps to two
 * lines) and under the toast container, so a pointer click is intercepted.
 */
async function setShowDeleted(page, checked) {
  const toggle = page.getByLabel('ausgeblendete anzeigen');
  if ((await toggle.isChecked()) !== checked) {
    await toggle.press('Space');
  }
  if (checked) {
    await expect(toggle).toBeChecked();
  } else {
    await expect(toggle).not.toBeChecked();
  }
}

module.exports = { setShowDeleted, uniqueSuffix, createStationUser, loginInFreshContext };
