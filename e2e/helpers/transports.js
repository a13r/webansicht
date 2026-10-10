const { expect } = require('@playwright/test');
const fs = require('fs');

/**
 * Log in as another user in a fresh browser context (not the admin storage state).
 * Returns { context, page }; the caller closes the context.
 */
async function loginAs(browser, user, password = 'testpass123') {
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL,
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel('Benutzername').fill(user.username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText(user.name, { exact: true })).toBeVisible({ timeout: 15_000 });
  return { context, page };
}

/** Click the export button and check that a non-empty xlsx (zip, starts with "PK") is downloaded. */
async function expectXlsxDownload(page, filenamePattern) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Excel-Export/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(filenamePattern);
  const content = fs.readFileSync(await download.path());
  expect(content.length).toBeGreaterThan(100);
  expect(content.subarray(0, 2).toString('latin1')).toBe('PK');
}

/** Register UI-created transports (found by requester) for cleanup. */
async function trackTransportsByRequester(api, requester) {
  const all = await api._request('GET', '/transports');
  for (const t of all.filter(t => t.requester === requester)) {
    if (!api._createdTransports.includes(t._id)) api._createdTransports.push(t._id);
  }
}

module.exports = { loginAs, expectXlsxDownload, trackTransportsByRequester };
