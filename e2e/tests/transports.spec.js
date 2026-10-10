const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { loginAs, expectXlsxDownload, trackTransportsByRequester } = require('../helpers/transports');

test.describe('Transports', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  const dialog = page => page.getByRole('dialog');
  const row = (page, requester) => page.locator('tbody tr', { hasText: requester });
  const toast = (page, text) => page.locator('.Toastify__toast', { hasText: text });

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
    await trackTransportsByRequester(api, 'UI Test Station');
  });

  test('does not save a transport without priority and type', async ({ page }) => {
    await page.goto('/transports');
    await page.getByRole('button', { name: 'Abtransport anfordern' }).click();
    await page.getByLabel('Anfordernde Stelle').fill('E2E Invalid Station');
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(dialog(page)).toBeVisible();
    await expect(toast(page, 'Transportanforderung erstellt')).toHaveCount(0);
    await expect(row(page, 'E2E Invalid Station')).toHaveCount(0);
    const all = await api._request('GET', '/transports');
    expect(all.filter(t => t.requester === 'E2E Invalid Station')).toHaveLength(0);
  });

  test('exports transports as a non-empty xlsx file', async ({ page }) => {
    await api.createTransport({ requester: 'E2E Export Station' });
    await page.goto('/transports');
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 10_000 });
    await expectXlsxDownload(page, /^Transporte_.*\.xlsx$/);
  });

  test('edits a transport as admin', async ({ page }) => {
    const transport = await api.createTransport({
      requester: 'E2E Edit Station',
      priority: 0,
      type: 0,
      diagnose: 'E2E diagnosis before',
      destination: { hospital: 'E2E Hospital', station: 'Ward A' },
      state: 0,
    });
    await page.goto('/transports');
    await row(page, 'E2E Edit Station').click();

    await expect(dialog(page).getByText('Patientenabtransport')).toBeVisible();
    // the dispo form shows all fields, prefilled with the transport
    await expect(dialog(page).getByLabel('Anfordernde Stelle')).toHaveValue('E2E Edit Station');
    await expect(dialog(page).getByLabel('Verdachtsdiagnose')).toHaveValue('E2E diagnosis before');
    await expect(dialog(page).getByLabel('Zielkrankenhaus')).toHaveValue('E2E Hospital');
    await expect(dialog(page).getByLabel('Status')).toHaveValue('0');

    await dialog(page).getByLabel('Verdachtsdiagnose').fill('E2E diagnosis after');
    await dialog(page).getByLabel('Status').selectOption({ label: 'in Durchführung' });
    await dialog(page).getByLabel('Dringlichkeit').selectOption({ index: 3 }); // sofort
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(toast(page, 'Transportanforderung aktualisiert')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    const edited = row(page, 'E2E Edit Station');
    await expect(edited).toContainText('E2E diagnosis after');
    await expect(edited).toContainText('in Durchführung');
    await expect(edited).toContainText('sofort');
    await expect(page.locator('td', { hasText: 'E2E diagnosis before' })).toHaveCount(0);

    const stored = await api._request('GET', `/transports/${transport._id}`);
    expect(stored).toMatchObject({ diagnose: 'E2E diagnosis after', state: 2, priority: 2 });
  });

  test('colours rows by priority and state', async ({ page }) => {
    await api.createTransport({ requester: 'E2E Colour new sofort', priority: 2, state: 0 });
    await api.createTransport({ requester: 'E2E Colour accepted dringend', priority: 1, state: 1 });
    await api.createTransport({ requester: 'E2E Colour running normal', priority: 0, state: 2 });
    await api.createTransport({ requester: 'E2E Colour done sofort', priority: 2, state: 3 });
    await api.createTransport({ requester: 'E2E Colour cancelled dringend', priority: 1, state: 4 });
    await page.goto('/transports');
    await expect(row(page, 'E2E Colour cancelled dringend')).toBeVisible();

    const state = r => r.locator('td').nth(2);

    const open = row(page, 'E2E Colour new sofort');
    await expect(open).toHaveClass(/bg-danger/);
    await expect(state(open)).toHaveText('neu');
    await expect(state(open)).toHaveClass(/bg-danger/);

    const accepted = row(page, 'E2E Colour accepted dringend');
    await expect(accepted).toHaveClass(/bg-warning/);
    await expect(state(accepted)).toHaveText('angenommen');
    await expect(state(accepted)).toHaveClass(/bg-warning/);

    const running = row(page, 'E2E Colour running normal');
    await expect(running).not.toHaveClass(/bg-(danger|warning)/);
    await expect(state(running)).toHaveText('in Durchführung');
    await expect(state(running)).toHaveClass(/bg-warning/);

    // finished transports lose the priority highlight
    const done = row(page, 'E2E Colour done sofort');
    await expect(done).not.toHaveClass(/bg-(danger|warning)/);
    await expect(state(done)).toHaveText('abgeschlossen');
    await expect(state(done)).toHaveClass(/bg-success/);

    const cancelled = row(page, 'E2E Colour cancelled dringend');
    await expect(cancelled).not.toHaveClass(/bg-(danger|warning)/);
    await expect(state(cancelled)).toHaveText('storniert');
    await expect(state(cancelled)).toHaveClass(/bg-success/);
  });

  test.describe('as dispo user', () => {
    test('accepts a new transport from the navbar dropdown', async ({ browser }) => {
      const dispo = await api.createUser({ roles: ['dispo'], name: 'E2E Dispo Accept' });
      const transport = await api.createTransport({
        requester: 'E2E Accept Station',
        diagnose: 'E2E accept diagnosis',
        state: 0,
      });
      const { context, page } = await loginAs(browser, dispo);
      try {
        await page.goto('/transports');
        await expect(row(page, 'E2E Accept Station')).toContainText('neu');

        await page.locator('.new-transport-warning').click();
        await page.locator('.dropdown-menu.show').getByText('E2E Accept Station').click();

        // the transport is accepted and its form opens
        await expect(dialog(page).getByText('Patientenabtransport')).toBeVisible();
        await expect(dialog(page).getByLabel('Anfordernde Stelle')).toHaveValue('E2E Accept Station');
        await expect(dialog(page).getByLabel('Status')).toHaveValue('1');
        await expect(row(page, 'E2E Accept Station')).toContainText('angenommen');
        expect((await api._request('GET', `/transports/${transport._id}`)).state).toBe(1);

        await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
        await expect(dialog(page)).toBeHidden();
        // nothing new is left, so the warning disappears
        await expect(page.locator('.new-transport-warning')).toHaveCount(0);
      } finally {
        await context.close();
      }
    });

    test('shows the full form and may edit foreign transports', async ({ browser }) => {
      const dispo = await api.createUser({ roles: ['dispo'], name: 'E2E Dispo Full' });
      await api.createResource({ callSign: 'E2E-FORM-1', type: 'RTW' });
      await api.createTransport({ requester: 'E2E Foreign Station', diagnose: 'E2E foreign', state: 0 });
      const { context, page } = await loginAs(browser, dispo);
      try {
        await page.goto('/transports');
        await row(page, 'E2E Foreign Station').click();
        for (const label of ['Status', 'Anfordernde Stelle', 'Dringlichkeit', 'Transportart', 'Verdachtsdiagnose',
          'Zielabteilung', 'Zielkrankenhaus', 'Ressource']) {
          await expect(dialog(page).getByLabel(label)).toBeVisible();
        }
        await dialog(page).getByLabel('Ressource').selectOption({ label: 'RTW E2E-FORM-1' });
        await dialog(page).getByLabel('Verdachtsdiagnose').fill('E2E edited by dispo');
        await dialog(page).getByRole('button', { name: 'Speichern' }).click();

        await expect(toast(page, 'Transportanforderung aktualisiert')).toBeVisible();
        await expect(row(page, 'E2E Foreign Station')).toContainText('E2E edited by dispo');
        await expect(row(page, 'E2E Foreign Station')).toContainText('RTW E2E-FORM-1');
      } finally {
        await context.close();
      }
    });

    for (const [priority, label, toastClass] of [
      [0, 'normal', 'info'],
      [1, 'dringend', 'warning'],
      [2, 'sofort', 'error'],
    ]) {
      test(`shows a ${toastClass} toast for a new "${label}" transport`, async ({ browser }) => {
        const dispo = await api.createUser({ roles: ['dispo'], name: `E2E Dispo Toast ${label}` });
        const { context, page } = await loginAs(browser, dispo);
        try {
          await api.createTransport({
            requester: `E2E Toast Station ${label}`,
            priority,
            diagnose: `E2E toast diagnosis ${label}`,
            state: 0,
          });
          const t = toast(page, 'Neue Transportanforderung');
          await expect(t).toBeVisible();
          await expect(t).toContainText(`Dringlichkeit: ${label}, Verdachtsdiagnose: E2E toast diagnosis ${label}`);
          await expect(t).toHaveClass(new RegExp(`Toastify__toast--${toastClass}`));
        } finally {
          await context.close();
        }
      });
    }
  });

  test.describe('as user with only the transports role', () => {
    test('sees the transports page and no new-transport toast', async ({ browser }) => {
      const user = await api.createUser({ roles: ['transports'], name: 'E2E Transports Toast' });
      const { context, page } = await loginAs(browser, user);
      try {
        await expect(page.getByRole('link', { name: /Abtransporte/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /ETB/ })).toHaveCount(0);
        await page.getByRole('link', { name: /Abtransporte/ }).click();
        await expect(page.getByRole('button', { name: 'Abtransport anfordern' })).toBeVisible();

        await api.createTransport({ requester: 'E2E NoToast Station', priority: 2, state: 0 });
        // once the row is shown the created event has been handled
        await expect(row(page, 'E2E NoToast Station')).toBeVisible();
        await expect(page.locator('.Toastify__toast')).toHaveCount(0);
        // and there is no accept dropdown for non-dispo users
        await expect(page.locator('.new-transport-warning')).toHaveCount(0);
      } finally {
        await context.close();
      }
    });

    test('cannot edit a foreign transport', async ({ browser }) => {
      const user = await api.createUser({ roles: ['transports'], name: 'E2E Transports Foreign' });
      await api.createTransport({ requester: 'E2E Foreign Owner', diagnose: 'E2E not yours', state: 0 });
      const { context, page } = await loginAs(browser, user);
      try {
        await page.goto('/transports');
        const foreign = row(page, 'E2E Foreign Owner');
        await expect(foreign).toBeVisible();
        await expect(foreign).toHaveCSS('cursor', 'not-allowed');
        await foreign.click();

        await expect(toast(page, 'Fremder Transport')).toBeVisible();
        await expect(toast(page, 'Dieser Transport kann nicht bearbeitet werden')).toBeVisible();
        await expect(dialog(page)).toHaveCount(0);
      } finally {
        await context.close();
      }
    });

    test('creates and edits own transport with the reduced form', async ({ browser }) => {
      const user = await api.createUser({ roles: ['transports'], name: 'E2E Transports Own' });
      const { context, page } = await loginAs(browser, user);
      try {
        await page.goto('/transports');
        await page.getByRole('button', { name: 'Abtransport anfordern' }).click();

        // dispo-only fields are not offered
        for (const label of ['Dringlichkeit', 'Transportart', 'Verdachtsdiagnose', 'Zielabteilung']) {
          await expect(dialog(page).getByLabel(label)).toBeVisible();
        }
        for (const label of ['Status', 'Anfordernde Stelle', 'Zielkrankenhaus', 'Ressource']) {
          await expect(dialog(page).getByLabel(label)).toHaveCount(0);
        }

        // priority and type must be chosen
        await dialog(page).getByLabel('Verdachtsdiagnose').fill('E2E own diagnosis');
        await dialog(page).getByRole('button', { name: 'Speichern' }).click();
        await expect(dialog(page)).toBeVisible();
        await expect(toast(page, 'Transportanforderung erstellt')).toHaveCount(0);

        await dialog(page).getByLabel('Dringlichkeit').selectOption({ index: 2 }); // dringend
        await dialog(page).getByLabel('Transportart').selectOption({ index: 2 }); // sitzend
        await dialog(page).getByLabel('Zielabteilung').fill('Ward Own');
        await dialog(page).getByRole('button', { name: 'Speichern' }).click();

        await expect(toast(page, 'Transportanforderung erstellt')).toBeVisible();
        // the requester is the logged in user
        const own = row(page, user.name);
        await expect(own).toBeVisible();
        await expect(own).toContainText('neu');
        await expect(own).toContainText('dringend');
        await expect(own).toContainText('sitzend');
        await expect(own).toContainText('E2E own diagnosis');
        await expect(own).toContainText('Ward Own');
        await trackTransportsByRequester(api, user.name);

        // own transports can be edited
        await expect(own).toHaveCSS('cursor', 'pointer');
        await own.click();
        await expect(dialog(page).getByLabel('Verdachtsdiagnose')).toHaveValue('E2E own diagnosis');
        await dialog(page).getByLabel('Verdachtsdiagnose').fill('E2E own diagnosis changed');
        await dialog(page).getByRole('button', { name: 'Speichern' }).click();
        await expect(toast(page, 'Transportanforderung aktualisiert')).toBeVisible();
        await expect(own).toContainText('E2E own diagnosis changed');
      } finally {
        await context.close();
      }
    });

    test('can export transports', async ({ browser }) => {
      const user = await api.createUser({ roles: ['transports'], name: 'E2E Transports Export' });
      await api.createTransport({ requester: 'E2E Export Row' });
      const { context, page } = await loginAs(browser, user);
      try {
        await page.goto('/transports');
        await expect(row(page, 'E2E Export Row')).toBeVisible();
        await expectXlsxDownload(page, /^Transporte_.*\.xlsx$/);
      } finally {
        await context.close();
      }
    });
  });
});
