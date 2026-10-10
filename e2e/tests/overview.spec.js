const { test, expect } = require('@playwright/test');
const { OverviewHelper, uniqueSuffix } = require('../helpers/overview');

test.describe('Overview Dashboard', () => {
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

  test('displays overview page after login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'TETRA' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();
  });

  test('shows resource with correct state', async ({ page }) => {
    await api.createResource({
      callSign: `OVW-1-${RUN}`,
      type: 'RTW',
      tetra: '99001',
      state: 1,
    });

    await page.goto('/');
    await expect(page.locator('td', { hasText: `OVW-1-${RUN}` })).toBeVisible({ timeout: 10_000 });
    const row = page.locator('tr', { hasText: `OVW-1-${RUN}` });
    await expect(row.locator('td', { hasText: 'Einsatzbereit' })).toBeVisible();
  });

  test('shows resource editor for dispo users', async ({ page }) => {
    const resource = await api.createResource({
      callSign: `OVW-2-${RUN}`,
      type: 'KTW',
      tetra: '99002',
      state: 0,
    });

    await page.goto('/');
    await page.locator('tr', { hasText: `OVW-2-${RUN}` }).click();
    await expect(page.getByText('Status ändern')).toBeVisible();
    // The clicked resource is selected in the editor and marked in its row
    await expect(page.getByLabel('Ressource', { exact: true })).toHaveValue(resource._id);
    await expect(page.locator('tr', { hasText: `OVW-2-${RUN}` }).locator('.fa-pencil')).toBeVisible();
  });

  test('shows station load cards', async ({ page }) => {
    await api.createStation({
      name: `SanHiSt Alpha ${RUN}`,
      currentPatients: 3,
      maxPatients: 10,
      ordering: 1,
    });

    await page.goto('/');
    await expect(page.getByText(`SanHiSt Alpha ${RUN}`)).toBeVisible({ timeout: 10_000 });
  });

  test('dispo user changes a status in the UI, row updates and a log entry is created', async ({ browser }) => {
    const resource = await api.createResource({
      callSign: `OVW-SUBMIT-${RUN}`,
      type: 'RTW',
      tetra: '99010',
      state: 0,
    });
    const { user, page } = await api.loginAsNewUser(browser, ['dispo']);

    const row = page.locator('tr', { hasText: `OVW-SUBMIT-${RUN}` });
    await row.click();
    await expect(page.getByLabel('Ressource', { exact: true })).toHaveValue(resource._id);

    await page.getByLabel('Status', { exact: true }).selectOption('3');
    await page.getByLabel('Letzter Standort').fill('Wache Nord');
    await page.getByLabel('Zielort').fill('Klinikum Süd');
    await page.getByLabel('Info', { exact: true }).fill('Einsatz 42');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(row.locator('td', { hasText: 'am Berufungsort' })).toBeVisible();
    await expect(row.locator('td', { hasText: 'Wache Nord' })).toBeVisible();
    await expect(row.locator('td', { hasText: 'Klinikum Süd' })).toBeVisible();
    await expect(row.locator('td', { hasText: 'Einsatz 42' })).toBeVisible();
    await expect(row).toHaveCSS('background-color', 'rgb(255, 173, 91)');
    // a manual change carries no TETRA marker
    await expect(row.locator('.fa-tower-broadcast')).toHaveCount(0);

    // the change is persisted ...
    await expect.poll(async () => {
      const stored = (await api.getResources()).find((r) => r._id === resource._id);
      return [stored.state, stored.lastPosition, stored.destination, stored.info];
    }).toEqual([3, 'Wache Nord', 'Klinikum Süd', 'Einsatz 42']);

    // ... and logged with the initials of the user who made it
    await page.getByRole('link', { name: /Statusverlauf/ }).click();
    const logRow = page.locator('tr.logRow', { hasText: `OVW-SUBMIT-${RUN}` }).first();
    await expect(logRow).toContainText('am Berufungsort');
    await expect(logRow).toContainText('Wache Nord');
    await expect(logRow).toContainText(user.initials);
  });

  test('another connected client sees the status change made in the editor', async ({ browser, page }) => {
    await api.createResource({ callSign: `OVW-SYNC-${RUN}`, type: 'RTW', tetra: '99011', state: 0 });
    const { page: dispo } = await api.loginAsNewUser(browser, ['dispo']);

    await page.goto('/');
    await expect(page.locator('tr', { hasText: `OVW-SYNC-${RUN}` }).locator('td', { hasText: 'Außer Dienst' })).toBeVisible();

    await dispo.locator('tr', { hasText: `OVW-SYNC-${RUN}` }).click();
    await dispo.getByLabel('Status', { exact: true }).selectOption('1');
    await dispo.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.locator('tr', { hasText: `OVW-SYNC-${RUN}` }).locator('td', { hasText: 'Einsatzbereit' })).toBeVisible();
  });

  test('editor switches between resources via the dropdown', async ({ browser }) => {
    const a = await api.createResource({ callSign: `OVW-SEL-A-${RUN}`, type: 'RTW', tetra: '99012', state: 1, info: 'info A' });
    const b = await api.createResource({ callSign: `OVW-SEL-B-${RUN}`, type: 'KTW', tetra: '99013', state: 2, info: 'info B' });
    const { page } = await api.loginAsNewUser(browser, ['dispo']);

    await page.locator('tr', { hasText: `OVW-SEL-A-${RUN}` }).click();
    await expect(page.getByLabel('Ressource', { exact: true })).toHaveValue(a._id);
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('1');
    await expect(page.getByLabel('Info', { exact: true })).toHaveValue('info A');

    // choosing another resource in the dropdown loads its values
    await page.getByLabel('Ressource', { exact: true }).selectOption(b._id);
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('2');
    await expect(page.getByLabel('Info', { exact: true })).toHaveValue('info B');
    await expect(page.locator('tr', { hasText: `OVW-SEL-B-${RUN}` }).locator('.fa-pencil')).toBeVisible();
    await expect(page.locator('tr', { hasText: `OVW-SEL-A-${RUN}` }).locator('.fa-pencil')).toHaveCount(0);
  });

  test.describe('position buttons', () => {
    const positionGroup = (page, label) =>
      page.getByLabel(label, { exact: true }).locator('xpath=ancestor::div[contains(@class,"input-group")]');

    test('home button fills position fields with the home location', async ({ page }) => {
      await api.createResource({
        callSign: `OVW-HOME-${RUN}`, type: 'RTW', tetra: '99020', state: 1,
        home: 'Rettungswache Ost', lastPosition: 'Unterwegs', destination: 'Irgendwo',
      });
      await page.goto('/');
      const row = page.locator('tr', { hasText: `OVW-HOME-${RUN}` });
      await row.click();
      await expect(page.getByLabel('Letzter Standort', { exact: true })).toHaveValue('Unterwegs');

      await positionGroup(page, 'Letzter Standort').locator('.fa-home').click();
      await expect(page.getByLabel('Letzter Standort', { exact: true })).toHaveValue('Rettungswache Ost');
      await expect(page.getByLabel('Zielort', { exact: true })).toHaveValue('Irgendwo');

      await positionGroup(page, 'Zielort').locator('.fa-home').click();
      await expect(page.getByLabel('Zielort', { exact: true })).toHaveValue('Rettungswache Ost');

      // nothing is saved until the form is submitted
      await expect(row.locator('td', { hasText: 'Unterwegs' })).toBeVisible();
      await page.getByRole('button', { name: 'Speichern' }).click();
      await expect(row.locator('td', { hasText: 'Unterwegs' })).toHaveCount(0);
      await expect(row.locator('td', { hasText: 'Rettungswache Ost' })).toHaveCount(2);
    });

    test('swap button exchanges last position and destination', async ({ page }) => {
      await api.createResource({
        callSign: `OVW-SWAP-${RUN}`, type: 'RTW', tetra: '99021', state: 4,
        lastPosition: 'Einsatzort', destination: 'Klinikum',
      });
      await page.goto('/');
      const row = page.locator('tr', { hasText: `OVW-SWAP-${RUN}` });
      await row.click();
      await expect(page.getByLabel('Letzter Standort', { exact: true })).toHaveValue('Einsatzort');

      await positionGroup(page, 'Letzter Standort').locator('.fa-retweet').click();
      await expect(page.getByLabel('Letzter Standort', { exact: true })).toHaveValue('Klinikum');
      await expect(page.getByLabel('Zielort', { exact: true })).toHaveValue('Einsatzort');

      // the swap button next to the destination does the same
      await positionGroup(page, 'Zielort').locator('.fa-retweet').click();
      await expect(page.getByLabel('Letzter Standort', { exact: true })).toHaveValue('Einsatzort');
      await expect(page.getByLabel('Zielort', { exact: true })).toHaveValue('Klinikum');

      await positionGroup(page, 'Zielort').locator('.fa-retweet').click();
      await page.getByRole('button', { name: 'Speichern' }).click();
      await expect(row.locator('td').nth(5)).toHaveText('Klinikum');
      await expect(row.locator('td').nth(6)).toHaveText('Einsatzort');
    });
  });

  test.describe('sending messages', () => {
    const messagesTo = async (destination) =>
      (await api._request('GET', '/messages')).filter((m) => m.destination === destination);

    test.afterEach(async () => {
      for (const m of await api._request('GET', '/messages')) {
        if (String(m.message).endsWith(RUN)) {
          await api._request('DELETE', `/messages/${m._id}`).catch(() => {});
        }
      }
    });

    test('sends a message to the selected resource', async ({ browser }) => {
      await api.createResource({ callSign: `OVW-MSG-${RUN}`, type: 'RTW', tetra: '99030', state: 1 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      await page.locator('tr', { hasText: `OVW-MSG-${RUN}` }).click();
      await expect(page.getByText('Nachricht senden')).toBeVisible();
      // no callout toggle for resources that can not be called out
      await expect(page.getByText('Callout', { exact: true })).toHaveCount(0);

      await page.getByLabel('Nachricht senden').fill(`Bitte Standort melden ${RUN}`);
      await page.getByRole('button', { name: 'Senden' }).click();
      // the text area is cleared after sending
      await expect(page.getByLabel('Nachricht senden')).toHaveValue('');

      await page.getByRole('link', { name: /Nachrichen/ }).click();
      const row = page.locator('tr', { hasText: `Bitte Standort melden ${RUN}` });
      await expect(row).toBeVisible();
      await expect(row).toContainText(`RTW OVW-MSG-${RUN}`);
      await expect(row.locator('.fa-bullhorn')).toHaveCount(0);

      const stored = await messagesTo('99030');
      expect(stored).toHaveLength(1);
      expect(stored[0].callout).toBeFalsy();
    });

    test('empty message is not sent', async ({ browser }) => {
      await api.createResource({ callSign: `OVW-MSGEMPTY-${RUN}`, type: 'RTW', tetra: '99032', state: 1 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      await page.locator('tr', { hasText: `OVW-MSGEMPTY-${RUN}` }).click();
      await page.getByRole('button', { name: 'Senden' }).click();
      // a valid message right after proves the empty one was dropped, not just slow
      await page.getByLabel('Nachricht senden').fill(`Zweiter Versuch ${RUN}`);
      await page.getByRole('button', { name: 'Senden' }).click();
      await expect(page.getByLabel('Nachricht senden')).toHaveValue('');
      await expect.poll(async () => (await messagesTo('99032')).map((m) => m.message)).toEqual([`Zweiter Versuch ${RUN}`]);
    });

    test('sends a callout to a resource that supports it', async ({ browser }) => {
      await api.createResource({ callSign: `OVW-CALL-${RUN}`, type: 'RTW', tetra: '99031', state: 1, hasCallout: true });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      await page.locator('tr', { hasText: `OVW-CALL-${RUN}` }).click();
      await expect(page.getByText('Callout', { exact: true })).toBeVisible();
      await page.getByLabel('Nachricht senden').fill(`Alarm Sammelplatz ${RUN}`);
      await page.getByText('Callout', { exact: true }).click();
      await page.getByRole('button', { name: 'Senden' }).click();
      await expect(page.getByLabel('Nachricht senden')).toHaveValue('');

      await page.getByRole('link', { name: /Nachrichen/ }).click();
      const row = page.locator('tr', { hasText: `Alarm Sammelplatz ${RUN}` });
      await expect(row.locator('.fa-bullhorn')).toBeVisible();

      const stored = await messagesTo('99031');
      expect(stored).toHaveLength(1);
      expect(stored[0].callout).toMatchObject({ severity: 1 });
    });

    test('resource without TETRA id has no message form', async ({ browser }) => {
      await api.createResource({ callSign: `OVW-NOTETRA-${RUN}`, type: 'RTW', tetra: '', state: 1 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      await page.locator('tr', { hasText: `OVW-NOTETRA-${RUN}` }).click();
      await expect(page.getByLabel('Ressource', { exact: true }).locator('option:checked')).toHaveText(`RTW OVW-NOTETRA-${RUN}`);
      await expect(page.getByText('Nachricht senden')).toHaveCount(0);
    });
  });

  test.describe('icons on resource rows', () => {
    test('open transport shows an ambulance icon with a popover and opens the transport form', async ({ browser }) => {
      const resource = await api.createResource({ callSign: `OVW-TRP-${RUN}`, type: 'RTW', tetra: '99040', state: 4 });
      await api.createTransport({
        resourceId: resource._id,
        requester: 'Popover Requester',
        priority: 1,
        type: 1,
        diagnose: 'Popover Diagnose',
        destination: { hospital: 'Popover Klinik', station: 'Popover Station' },
        state: 1,
      });
      // finished transports are not shown on the row (0 neu, 1 angenommen, 2 in Durchführung, 3 abgeschlossen, 4 storniert)
      await api.createTransport({ resourceId: resource._id, requester: 'Finished Requester', state: 3 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      const row = page.locator('tr', { hasText: `OVW-TRP-${RUN}` });
      await expect(row.locator('.fa-ambulance')).toHaveCount(1);

      await row.locator('.fa-ambulance').hover();
      const popover = page.locator('.popover');
      await expect(popover).toContainText('Popover Requester');
      await expect(popover).toContainText('Popover Diagnose');
      await expect(popover).toContainText('Popover Klinik Popover Station');
      await expect(popover).not.toContainText('Finished Requester');

      await row.locator('.fa-ambulance').click();
      await expect(page.getByText('Patientenabtransport')).toBeVisible();
      await expect(page.getByLabel('Anfordernde Stelle')).toHaveValue('Popover Requester');
      await expect(page.getByLabel('Verdachtsdiagnose')).toHaveValue('Popover Diagnose');
    });

    test('no ambulance icon for resources without an open transport', async ({ browser }) => {
      const resource = await api.createResource({ callSign: `OVW-NOTRP-${RUN}`, type: 'RTW', tetra: '99041', state: 1 });
      await api.createTransport({ resourceId: resource._id, state: 3 });
      await api.createTransport({ resourceId: resource._id, state: 4 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      await expect(page.locator('tr', { hasText: `OVW-NOTRP-${RUN}` })).toBeVisible();
      await expect(page.locator('tr', { hasText: `OVW-NOTRP-${RUN}` }).locator('.fa-ambulance')).toHaveCount(0);
    });

    test('ambulance icon appears when a transport is assigned and disappears when it ends', async ({ browser }) => {
      const resource = await api.createResource({ callSign: `OVW-TRLIVE-${RUN}`, type: 'RTW', tetra: '99042', state: 1 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);
      const row = page.locator('tr', { hasText: `OVW-TRLIVE-${RUN}` });
      await expect(row).toBeVisible();
      await expect(row.locator('.fa-ambulance')).toHaveCount(0);

      const transport = await api.createTransport({ resourceId: resource._id, state: 1 });
      await expect(row.locator('.fa-ambulance')).toHaveCount(1);

      await api._request('PATCH', `/transports/${transport._id}`, { state: 3 });
      await expect(row.locator('.fa-ambulance')).toHaveCount(0);
    });

    test('recent incoming radio call shows a bullhorn icon with talk group tooltip', async ({ browser }) => {
      await api.createResource({ callSign: `OVW-CALLIC-${RUN}`, type: 'RTW', tetra: '99050', state: 1, gssi: 9000050 });
      await api.createResource({ callSign: `OVW-NOCALL-${RUN}`, type: 'RTW', tetra: '99051', state: 1, gssi: 9000050 });
      await api.createTalkGroup({ name: `E2E Einsatz ${RUN}`, gssi: 9000050 });
      await api.createIncomingCall({ issi: 99050, gssi: 9000050 });
      const { page } = await api.loginAsNewUser(browser, ['dispo']);

      const row = page.locator('tr', { hasText: `OVW-CALLIC-${RUN}` });
      await expect(row.locator('.fa-bullhorn')).toBeVisible();
      await expect(page.locator('tr', { hasText: `OVW-NOCALL-${RUN}` }).locator('.fa-bullhorn')).toHaveCount(0);

      await row.locator('.fa-bullhorn').hover();
      await expect(page.getByRole('tooltip')).toContainText(new RegExp(`\\d\\d:\\d\\d:\\d\\d\\s*—\\s*E2E Einsatz ${RUN}`));
    });
  });

  test.describe('non-dispo users', () => {
    for (const roles of [['station'], ['transports']]) {
      test(`${roles[0]} user sees the list without editor, icons or selectable rows`, async ({ browser }) => {
        const resource = await api.createResource({ callSign: `OVW-ROLE-${RUN}`, type: 'RTW', tetra: '99060', state: 1 });
        await api.createTransport({ resourceId: resource._id, state: 1 });
        const { page } = await api.loginAsNewUser(browser, roles);

        const row = page.locator('tr', { hasText: `OVW-ROLE-${RUN}` });
        await expect(row.locator('td', { hasText: 'Einsatzbereit' })).toBeVisible();
        await row.click();
        await expect(page.getByText('Status ändern')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Speichern' })).toHaveCount(0);
        await expect(row.locator('.fa-ambulance')).toHaveCount(0);
        await expect(row.locator('.fa-pencil')).toHaveCount(0);
        // navigation is limited to what the role may see
        await expect(page.getByRole('link', { name: /Statusverlauf/ })).toHaveCount(0);
        await expect(page.getByRole('link', { name: /Ressourcen/ })).toHaveCount(0);
      });
    }
  });
});
