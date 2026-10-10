const { test, expect } = require('@playwright/test');
const { OverviewHelper } = require('../helpers/overview');

// Keyboard shortcuts are bound in web/stores/index.js for users with the dispo role.
// Ctrl+E (new journal entry) is covered by journal.spec.js.
test.describe('Keyboard shortcuts', () => {
  let api;

  test.beforeEach(async () => {
    api = new OverviewHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  const navigation = [
    { key: 'F1', url: /\/$/, content: (page) => page.locator('th', { hasText: 'Letzter Standort' }) },
    { key: 'F2', url: /\/journal$/, content: (page) => page.locator('th', { hasText: 'Eintrag' }) },
    { key: 'F3', url: /\/log$/, content: (page) => page.locator('th', { hasText: 'Zeitpunkt' }) },
    { key: 'F4', url: /\/messages$/, content: (page) => page.locator('th', { hasText: 'Nachricht' }) },
    { key: 'F5', url: /\/resourceAdmin$/, content: (page) => page.getByRole('button', { name: /Neue Ressource/ }) },
    { key: 'F6', url: /\/stations$/, content: (page) => page.getByText('Shortcut Station') },
    { key: 'F7', url: /\/transports$/, content: (page) => page.getByRole('button', { name: 'Abtransport anfordern' }) },
    { key: 'F8', url: /\/map$/, content: (page) => page.locator('.openlayers-map') },
  ];

  test('F1-F8 navigate through the main pages of a dispo user', async ({ browser }) => {
    await api.createStation({ name: 'Shortcut Station' });
    const { page } = await api.loginAsNewUser(browser, ['dispo']);
    // start somewhere other than the overview, so F1 has something to do
    await page.getByRole('link', { name: /Statusverlauf/ }).click();
    await expect(page).toHaveURL(/\/log$/);

    for (const { key, url, content } of navigation) {
      await page.keyboard.press(key);
      await expect(page).toHaveURL(url);
      await expect(content(page).first()).toBeVisible();
    }
  });

  test('navigation shortcuts also work while typing in a form field', async ({ browser }) => {
    const { page } = await api.loginAsNewUser(browser, ['dispo']);
    await api.createResource({ callSign: 'KEY-FIELD', type: 'RTW', tetra: '55001', state: 1 });

    await page.locator('tr', { hasText: 'KEY-FIELD' }).click();
    await page.getByLabel('Info', { exact: true }).fill('half typed');
    await expect(page.getByLabel('Info', { exact: true })).toBeFocused();

    await page.keyboard.press('F3');
    await expect(page).toHaveURL(/\/log$/);
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible();

    await page.keyboard.press('F1');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Shift+F6 opens the form for a new transport with the requester prefilled', async ({ browser }) => {
    const { user, page } = await api.loginAsNewUser(browser, ['dispo']);

    // works from any page, and does not navigate
    await page.getByRole('link', { name: /Statusverlauf/ }).click();
    await expect(page).toHaveURL(/\/log$/);
    await page.keyboard.press('Shift+F6');

    await expect(page.getByText('Patientenabtransport')).toBeVisible();
    await expect(page).toHaveURL(/\/log$/);
    await expect(page.getByLabel('Anfordernde Stelle')).toHaveValue(user.name);

    // the form can be dismissed again
    await page.locator('.modal .btn-close').click();
    await expect(page.getByText('Patientenabtransport')).toHaveCount(0);

    // plain F6 still navigates to the stations
    await page.keyboard.press('F6');
    await expect(page).toHaveURL(/\/stations$/);
  });

  test('shortcuts are not bound for users without the dispo role', async ({ browser }) => {
    const { page } = await api.loginAsNewUser(browser, ['station']);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('th', { hasText: 'Letzter Standort' })).toBeVisible();

    for (const key of ['F2', 'F3', 'F4', 'F5', 'F7', 'F8', 'Shift+F6']) {
      await page.keyboard.press(key);
    }
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Patientenabtransport')).toHaveCount(0);
  });

  test('shortcuts stop working after logout', async ({ browser }) => {
    const { user, page } = await api.loginAsNewUser(browser, ['dispo']);
    await page.getByText(user.name).click();
    await page.getByText('Abmelden').click();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();

    await page.keyboard.press('F3');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toHaveCount(0);
  });
});
