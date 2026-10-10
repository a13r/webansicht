const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');

test.describe('Journal (ETB) audit log', () => {
  let api;

  test.beforeEach(async () => {
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('editing an entry does not rewrite its timestamp', async ({ page }) => {
    // The server stores the creation time with seconds; the form only shows minutes
    const text = `E2E audit ${Date.now()}`;
    const entry = await api.createJournalEntry({ text, reporter: 'E2E Tester', state: 'offen' });

    await page.goto('/journal');
    await page.locator('tr', { hasText: text }).click();
    const dialog = page.getByRole('dialog');
    const textField = dialog.getByLabel('Eintrag', { exact: true });
    await expect(textField).toHaveValue(text);
    // the editor focuses this field shortly after opening
    await expect(textField).toBeFocused();
    await textField.fill(`${text} ergänzt`);
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Protokolleintrag gespeichert')).toBeVisible();

    const saved = await api._request('GET', `/journal/${entry._id}`);
    expect(saved.text).toBe(`${text} ergänzt`);
    expect(saved.createdAt).toBe(entry.createdAt);
    expect(saved.auditLog.map(log => log.field)).toEqual(['text']);

    // the audit list in the editor shows only the text change
    await page.locator('tr', { hasText: `${text} ergänzt` }).click();
    const audit = dialog.locator('table');
    await expect(audit.getByRole('cell', { name: 'Eintrag', exact: true })).toBeVisible();
    await expect(audit.getByRole('cell', { name: 'Zeitpunkt', exact: true })).toHaveCount(0);
    await expect(audit.locator('tbody tr')).toHaveCount(1);
  });
});
