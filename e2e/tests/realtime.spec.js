const { test, expect } = require('@playwright/test');
const path = require('path');
const { io } = require('socket.io-client');
const { ApiHelper } = require('../helpers/api');

test.describe('Real-time Socket.IO Updates', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('updates propagate to authenticated client in real-time', async ({ page }) => {
    const resource = await api.createResource({
      callSign: 'REALTIME-1',
      type: 'RTW',
      tetra: '44001',
      state: 0,
    });

    await page.goto('/');
    const row = page.locator('tr', { hasText: 'REALTIME-1' });
    await expect(row.locator('td', { hasText: 'Außer Dienst' })).toBeVisible({ timeout: 10_000 });

    // Change state via API (simulating LARDIS)
    await api.patchResource(resource._id, { state: 4 });

    // Verify real-time update without page refresh
    await expect(row.locator('td', { hasText: 'zum Zielort' })).toBeVisible({ timeout: 10_000 });
  });

  test('updates propagate across multiple authenticated contexts', async ({ browser }) => {
    const resource = await api.createResource({
      callSign: 'MULTI-1',
      type: 'RTW',
      tetra: '44002',
      state: 0,
    });

    const authState = path.join(__dirname, '../.auth/admin.json');
    const baseURL = process.env.E2E_BASE_URL;

    const context1 = await browser.newContext({ storageState: authState });
    const context2 = await browser.newContext({ storageState: authState });
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto(baseURL);
    await page2.goto(baseURL);

    await expect(page1.locator('tr', { hasText: 'MULTI-1' })).toBeVisible({ timeout: 10_000 });
    await expect(page2.locator('tr', { hasText: 'MULTI-1' })).toBeVisible({ timeout: 10_000 });

    // Change state via API
    await api.patchResource(resource._id, { state: 5 });

    // Both should update in real-time
    await expect(page1.locator('tr', { hasText: 'MULTI-1' }).locator('td', { hasText: 'am Zielort' }))
      .toBeVisible({ timeout: 10_000 });
    await expect(page2.locator('tr', { hasText: 'MULTI-1' }).locator('td', { hasText: 'am Zielort' }))
      .toBeVisible({ timeout: 10_000 });

    await context1.close();
    await context2.close();
  });

  test('does not send updates to unauthenticated Socket.IO clients', async ({ browser }) => {
    const resource = await api.createResource({
      callSign: 'UNAUTH-1',
      type: 'RTW',
      tetra: '44003',
      state: 0,
    });

    const baseURL = process.env.E2E_BASE_URL;

    // An unauthenticated browser only sees the login form ...
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'UNAUTH-1' })).toHaveCount(0);

    // ... and a raw Socket.IO client without Feathers authentication
    // must not receive resource events. An authenticated client acts as the
    // control: once it has seen the event, it has been dispatched to everybody
    // who is allowed to get it.
    const anonymous = io(baseURL);
    const anonymousEvents = [];
    anonymous.on('resources patched', (data) => anonymousEvents.push(data));
    anonymous.on('resources created', (data) => anonymousEvents.push(data));
    const authenticatedEvents = [];
    const authenticated = await api._getSocketClient();
    authenticated.service('resources').on('patched', (data) => authenticatedEvents.push(data));

    try {
      await new Promise((resolve, reject) => {
        anonymous.once('connect', resolve);
        anonymous.once('connect_error', reject);
        if (anonymous.connected) resolve();
      });

      await api.patchResource(resource._id, { state: 1 });
      await expect.poll(() => authenticatedEvents.filter((e) => e._id === resource._id).length).toBe(1);

      // The server publishes only to the 'authenticated' channel (src/channels.js:44).
      // Unauthenticated connections remain in the 'anonymous' channel which has no publisher.
      expect(anonymousEvents).toHaveLength(0);
    } finally {
      anonymous.disconnect();
      await context.close();
    }
  });
});
