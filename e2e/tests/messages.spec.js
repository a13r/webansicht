const { test, expect } = require('@playwright/test');
const { MiscApiHelper } = require('../helpers/misc');

// NOTE: the test server has no LARDIS radios configured, so the backend immediately patches every
// newly created message to { state: 'error', errorType: 'no_radio' }. Tests that need another state
// first wait for that automatic patch and then patch the message via the API themselves
// (the same thing LARDIS does when a radio reports delivery).

const unique = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
// The toasts only appear for a logged in user, so wait for the logged in navbar before creating messages
const openMessages = async (page) => {
  await page.goto('/messages');
  await expect(page.getByRole('button', { name: 'Administrator' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible();
};
const toasts = (page) => page.locator('.Toastify__toast');

test.describe('Messages', () => {
  let api;

  test.beforeEach(async () => {
    api = new MiscApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('lists a message with the resource name and the status', async ({ page }) => {
    const text = unique('list');
    const tetra = String(60000 + Math.floor(Math.random() * 9999));
    await api.createResource({ callSign: 'MSG-RES', type: 'RTW', tetra });
    await api.createMessage({ message: text, destination: tetra });

    await page.goto('/messages');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible();
    const row = page.locator('tr', { hasText: text });
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(1)).toHaveText('RTW MSG-RES');
    await expect(row.locator('td').nth(3)).toHaveText('Fehler');
    await expect(row.locator('.fa-bullhorn')).toHaveCount(0);
  });

  test('shows the raw destination if no resource matches', async ({ page }) => {
    const text = unique('nodest');
    const destination = unique('9999');
    await api.createMessage({ message: text, destination });

    await page.goto('/messages');
    await expect(page.locator('tr', { hasText: text }).locator('td').nth(1)).toHaveText(destination);
  });

  test('shows new messages at the top in real time and updates their status', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible();

    const first = unique('first');
    const second = unique('second');
    const m1 = await api.createMessage({ message: first });
    await expect(page.locator('tr', { hasText: first })).toBeVisible();
    await api.createMessage({ message: second });
    await expect(page.locator('tr', { hasText: second })).toBeVisible();

    // newest message first
    await expect(page.locator('tbody tr').first()).toContainText(second);

    // status changes arrive without reload
    await expect(page.locator('tr', { hasText: first }).locator('td').nth(3)).toHaveText('Fehler');
    await api.patchMessage(m1._id, { state: 'sent' });
    await expect(page.locator('tr', { hasText: first }).locator('td').nth(3)).toHaveText('gesendet');
    await api.patchMessage(m1._id, { state: 'pending' });
    await expect(page.locator('tr', { hasText: first }).locator('td').nth(3)).toHaveText('wird gesendet');
    await api.patchMessage(m1._id, { state: 'delivered' });
    await expect(page.locator('tr', { hasText: first }).locator('td').nth(3)).toHaveText('zugestellt');
  });

  test('removes a deleted message from the list', async ({ page }) => {
    const text = unique('delete');
    const message = await api.createMessage({ message: text });
    await page.goto('/messages');
    await expect(page.locator('tr', { hasText: text })).toBeVisible();

    await api._request('DELETE', `/messages/${message._id}`);
    await expect(page.locator('tr', { hasText: text })).toHaveCount(0);
  });

  test('shows the acknowledged callout time', async ({ page }) => {
    const text = unique('callout');
    const message = await api.createMessage({ message: text, callout: { severity: 1 } });
    await page.goto('/messages');
    const row = page.locator('tr', { hasText: text });
    await expect(row.locator('.fa-bullhorn')).toBeVisible();
    await expect(row.locator('.fa-check')).toHaveCount(0);

    await api.patchMessage(message._id, { 'callout.ackReceived': new Date().toISOString() });
    await expect(row.locator('.fa-check')).toBeVisible();
  });

  test.describe('delivery toasts', () => {
    test('shows an error toast when no radio is available', async ({ page }) => {
      await openMessages(page);
      const text = unique('noradio');
      await api.createMessage({ message: text, destination: 'DEST-NR' });
      const toast = toasts(page).filter({ hasText: 'DEST-NR' });
      await expect(toast).toContainText('Zustellfehler');
      await expect(toast).toContainText('Nachricht an DEST-NR nicht erfolgreich: kein Funkgerät verfügbar.');
    });

    test('shows an error toast for TETRA errors', async ({ page }) => {
      await openMessages(page);
      const text = unique('tetra');
      const message = await api.createMessage({ message: text, destination: 'DEST-TE' });
      await expect(page.locator('tr', { hasText: text }).locator('td').nth(3)).toHaveText('Fehler');
      await api.patchMessage(message._id, { errorType: 'tetra' });
      await expect(toasts(page).filter({ hasText: 'DEST-TE' }).filter({ hasText: 'TETRA-Fehler' })).toBeVisible();
    });

    test('shows a success toast when the message was delivered', async ({ page }) => {
      await openMessages(page);
      const text = unique('delivered');
      const message = await api.createMessage({ message: text, destination: 'DEST-OK' });
      await expect(page.locator('tr', { hasText: text }).locator('td').nth(3)).toHaveText('Fehler');
      await api.patchMessage(message._id, { state: 'delivered', errorType: null });
      // the automatic no_radio error toast for the same destination is shown as well
      const toast = toasts(page).filter({ hasText: 'Nachricht zugestellt' }).filter({ hasText: 'DEST-OK' });
      await expect(toast).toContainText('Zustellung an DEST-OK erfolgreich');
    });

    test('does not show toasts for messages of other users', async ({ page }) => {
      const user = await api.createUser({ roles: ['dispo'] });
      const other = new MiscApiHelper();
      await other.authenticate(user.username, 'testpass123');

      await openMessages(page);
      const text = unique('foreign');
      const message = await other.createMessage({ message: text, destination: 'DEST-OTHER' });
      try {
        await expect(page.locator('tr', { hasText: text }).locator('td').nth(3)).toHaveText('Fehler');
        await other.patchMessage(message._id, { state: 'delivered' });
        await expect(page.locator('tr', { hasText: text }).locator('td').nth(3)).toHaveText('zugestellt');
        // toasts of other tests running in parallel (same admin) are unrelated, so match on the destination
        await expect(toasts(page).filter({ hasText: 'DEST-OTHER' })).toHaveCount(0);
      } finally {
        await other.cleanup();
      }
    });
  });

  test.describe('sending', () => {
    test('sends a message from the resource editor', async ({ page }) => {
      const callSign = unique('SEND');
      const text = unique('hello');
      await api.createResource({ callSign, type: 'KTW', tetra: String(50000 + Math.floor(Math.random() * 9999)) });

      await page.goto('/');
      await page.locator('tr', { hasText: callSign }).click();
      await page.getByLabel('Nachricht senden').fill(text);
      await page.getByRole('button', { name: 'Senden' }).click();
      // the form is cleared after a successful send
      await expect(page.getByLabel('Nachricht senden')).toHaveValue('');

      await page.goto('/messages');
      const row = page.locator('tr', { hasText: text });
      await expect(row.locator('td').nth(1)).toHaveText(`KTW ${callSign}`);
      await expect(row.locator('.fa-bullhorn')).toHaveCount(0);

      // track for cleanup (created via the UI)
      const { data } = await api._request('GET', `/messages?message=${encodeURIComponent(text)}`).then((r) => ({ data: r.data || r }));
      api._createdMessages.push(...data.map((m) => m._id));
    });

    test('sends a callout for resources that support callouts', async ({ page }) => {
      const callSign = unique('CALL');
      const text = unique('alarm');
      await api.createResource({
        callSign, type: 'RTW', tetra: String(40000 + Math.floor(Math.random() * 9999)), hasCallout: true,
      });

      await page.goto('/');
      await page.locator('tr', { hasText: callSign }).click();
      await page.getByLabel('Nachricht senden').fill(text);
      await page.getByText('Callout', { exact: true }).click();
      await page.getByRole('button', { name: 'Senden' }).click();
      await expect(page.getByLabel('Nachricht senden')).toHaveValue('');

      await page.goto('/messages');
      await expect(page.locator('tr', { hasText: text }).locator('.fa-bullhorn')).toBeVisible();

      const { data } = await api._request('GET', `/messages?message=${encodeURIComponent(text)}`).then((r) => ({ data: r.data || r }));
      api._createdMessages.push(...data.map((m) => m._id));
    });

    test('does not offer the callout toggle for resources without callout', async ({ page }) => {
      const callSign = unique('NOCALL');
      await api.createResource({ callSign, type: 'RTW', tetra: String(30000 + Math.floor(Math.random() * 9999)) });
      await page.goto('/');
      await page.locator('tr', { hasText: callSign }).click();
      await expect(page.getByLabel('Nachricht senden')).toBeVisible();
      await expect(page.getByText('Callout', { exact: true })).toHaveCount(0);
    });

    test('shows no message form for resources without TETRA id', async ({ page }) => {
      const callSign = unique('NOTETRA');
      await api.createResource({ callSign, type: 'RTW', tetra: '' });
      await page.goto('/');
      await page.locator('tr', { hasText: callSign }).click();
      await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
      await expect(page.getByLabel('Nachricht senden')).toHaveCount(0);
    });
  });
});
