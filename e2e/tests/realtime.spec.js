const { test, expect } = require('@playwright/test');
const path = require('path');
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
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3030';

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

    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3030';

    // Create an unauthenticated context (no storageState, no login)
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(baseURL);

    // Connect a raw Socket.IO client without Feathers authentication
    // and start listening for resource events
    await page.evaluate(() => {
      window.__receivedResourceEvents = [];
      if (window.io) {
        const sock = window.io();
        sock.on('resources patched', (data) => {
          window.__receivedResourceEvents.push(data);
        });
        sock.on('resources created', (data) => {
          window.__receivedResourceEvents.push(data);
        });
        window.__testSocket = sock;
      }
    });

    // Wait for socket to connect
    await page.waitForTimeout(1000);

    // Trigger a state change via authenticated API
    await api.patchResource(resource._id, { state: 1 });

    // Wait for potential event delivery
    await page.waitForTimeout(3000);

    // Check received events
    const events = await page.evaluate(() => {
      if (window.__testSocket) window.__testSocket.disconnect();
      return window.__receivedResourceEvents;
    });

    // The server publishes only to the 'authenticated' channel (src/channels.js:44).
    // Unauthenticated connections remain in the 'anonymous' channel which has no publisher.
    expect(events).toHaveLength(0);

    await context.close();
  });
});
