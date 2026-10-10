const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { trackJournalByText } = require('../helpers/journal');
const { loginAs, expectXlsxDownload } = require('../helpers/transports');

test.describe('Journal (ETB)', () => {
  let api;
  let id; // unique per test run, so parallel tests (and --repeat-each) never share data

  test.beforeEach(async () => {
    id = Math.random().toString(36).slice(2, 8);
    api = new ApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  const row = (page, text) => page.locator('tr.journal-list', { hasText: text });
  const dialog = page => page.getByRole('dialog');
  // the editor focuses the "Eintrag" field after a short delay; wait for it so that it cannot steal the focus later
  // centre the row first: new entries from parallel tests shift the list, and the fixed navbar may cover the row at the top
  const openRow = async r => {
    await r.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await r.click();
  };
  const editorReady = page => expect(dialog(page).getByLabel('Eintrag', { exact: true })).toBeFocused();

  test('displays journal page for dispo user', async ({ page }) => {
    await page.goto('/journal');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('th', { hasText: 'Eintrag' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Melder' })).toBeVisible();
  });

  test('shows journal entry created via API', async ({ page }) => {
    await api.createJournalEntry({
      text: `E2E test journal entry ${id}`,
      reporter: 'E2E Tester',
      state: 'offen',
    });

    await page.goto('/journal');
    await expect(page.locator('td', { hasText: `E2E test journal entry ${id}` })).toBeVisible({ timeout: 10_000 });
  });

  test('exports the journal as a non-empty xlsx file', async ({ page }) => {
    await api.createJournalEntry({ text: `E2E export entry ${id}`, reporter: 'E2E Tester', state: 'offen' });
    await page.goto('/journal');
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 10_000 });
    await expectXlsxDownload(page, /^Protokoll_.*\.xlsx$/);
  });

  test('creates an entry via the "Neuer ETB-Eintrag" navbar link', async ({ browser }) => {
    const text = `E2E created via navbar ${id}`;
    const user = await api.createUser({ roles: ['dispo'], name: `E2E Dispo Creator ${id}`, initials: 'QA' });
    const { context, page } = await loginAs(browser, user);
    await page.goto('/journal');
    await page.getByText('Neuer ETB-Eintrag').click();

    await expect(dialog(page).getByText('ETB-Eintrag erstellen')).toBeVisible();
    await editorReady(page);
    // the timestamp is prefilled with the current time
    await expect(dialog(page).getByLabel('Zeitpunkt')).toHaveValue(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    await dialog(page).getByLabel('Eintrag', { exact: true }).fill(text);
    await dialog(page).getByLabel('Melder').fill('E2E Melder');
    await dialog(page).getByLabel('Meldeweg').selectOption('Funk');
    await dialog(page).getByLabel('Priorität').selectOption('hoch');
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByText('Protokolleintrag erstellt')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    const created = row(page, text);
    await expect(created).toBeVisible();
    await expect(created.locator('td').nth(2)).toHaveText('E2E Melder');
    await expect(created.locator('td').nth(3)).toHaveText('Funk');
    await expect(created.locator('td').nth(4)).toHaveText('Eingang');
    await expect(created.locator('td').nth(5)).toHaveText('hoch');
    await expect(created.locator('td').nth(6)).toHaveText('offen');
    await expect(created.locator('td').nth(9)).toHaveText('QA');
    await trackJournalByText(api, text);
    await context.close();
  });

  test('creates an entry with the Ctrl+E shortcut', async ({ page }) => {
    const text = `E2E created via shortcut ${id}`;
    await page.goto('/journal');
    await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toBeVisible({ timeout: 10_000 });
    // wait until the shortcuts are bound after login
    await expect(async () => {
      await page.keyboard.press('Control+e');
      await expect(dialog(page).getByText('ETB-Eintrag erstellen')).toBeVisible({ timeout: 500 });
    }).toPass();

    await editorReady(page);
    await dialog(page).getByLabel('Eintrag', { exact: true }).fill(text);
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByText('Protokolleintrag erstellt')).toBeVisible();
    await expect(row(page, text)).toBeVisible();
    await trackJournalByText(api, text);
  });

  test('does not save an invalid "Zeitpunkt"', async ({ page }) => {
    const text = `E2E invalid timestamp ${id}`;
    await page.goto('/journal');
    await page.getByText('Neuer ETB-Eintrag').click();
    await editorReady(page);

    await dialog(page).getByLabel('Zeitpunkt').fill('foo');
    await dialog(page).getByLabel('Eintrag', { exact: true }).fill(text);
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(dialog(page).getByText('Datum und Uhrzeit erforderlich')).toBeVisible();
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByText('Protokolleintrag erstellt')).toHaveCount(0);
    await expect(row(page, text)).toHaveCount(0);
    expect((await api._request('GET', '/journal')).filter(e => e.text === text)).toHaveLength(0);

    // an empty timestamp is rejected as well
    await dialog(page).getByLabel('Zeitpunkt').fill('');
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog(page).getByText('Zeitpunkt ist erforderlich')).toBeVisible();
    expect((await api._request('GET', '/journal')).filter(e => e.text === text)).toHaveLength(0);

    // fixing the timestamp makes the entry saveable
    await dialog(page).getByLabel('Zeitpunkt').fill('01.02.2025 13:45');
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Protokolleintrag erstellt')).toBeVisible();
    await expect(row(page, text).locator('td').first()).toHaveText('01.02.2025 13:45');
    await trackJournalByText(api, text);
  });

  test('edits an entry and shows the audit log to admins', async ({ browser }) => {
    const admin = await api.createUser({ roles: ['admin', 'dispo'], name: `E2E Admin Editor ${id}`, initials: 'QA' });
    const { context, page } = await loginAs(browser, admin);
    const entry = await api.createJournalEntry({
      text: `E2E before edit ${id}`,
      reporter: 'E2E Tester',
      reportedVia: 'Funk',
      direction: 'Eingang',
      priority: 'normal',
      state: 'offen',
    });
    await page.goto('/journal');
    await openRow(row(page, `E2E before edit ${id}`));

    await expect(dialog(page).getByText('ETB-Eintrag bearbeiten')).toBeVisible();
    await editorReady(page);
    await expect(dialog(page).getByLabel('Eintrag', { exact: true })).toHaveValue(`E2E before edit ${id}`);
    // a fresh entry has no audit log
    await expect(dialog(page).getByRole('columnheader', { name: 'Kürzel' })).toHaveCount(0);

    await dialog(page).getByLabel('Eintrag', { exact: true }).fill(`E2E after edit ${id}`);
    await dialog(page).getByLabel('Status').selectOption('erledigt');
    await dialog(page).getByLabel('Erledigungsvermerk').fill('alles klar');
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByText('Protokolleintrag gespeichert')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    const edited = row(page, `E2E after edit ${id}`);
    await expect(edited).toBeVisible();
    await expect(edited.locator('td').nth(6)).toHaveText('erledigt');
    await expect(edited.locator('td').nth(7)).toHaveText('alles klar');
    await expect(row(page, `E2E before edit ${id}`)).toHaveCount(0);
    expect((await api._request('GET', `/journal/${entry._id}`)).text).toBe(`E2E after edit ${id}`);

    // reopen: the audit log lists the changed fields with old and new value
    await openRow(edited);
    const audit = dialog(page).locator('table');
    await expect(audit.getByRole('columnheader', { name: 'alt' })).toBeVisible();
    const textRow = audit.locator('tr', { has: page.getByRole('cell', { name: 'Eintrag', exact: true }) });
    await expect(textRow.getByRole('cell').nth(2)).toHaveText(`E2E before edit ${id}`);
    await expect(textRow.getByRole('cell').nth(3)).toHaveText(`E2E after edit ${id}`);
    await expect(textRow.getByRole('cell').nth(4)).toHaveText('QA');
    const stateRow = audit.locator('tr', { has: page.getByRole('cell', { name: 'Status', exact: true }) });
    await expect(stateRow.getByRole('cell').nth(2)).toHaveText('offen');
    await expect(stateRow.getByRole('cell').nth(3)).toHaveText('erledigt');
    const commentRow = audit.locator('tr', { has: page.getByRole('cell', { name: 'Erledigungsvermerk', exact: true }) });
    await expect(commentRow.getByRole('cell').nth(3)).toHaveText('alles klar');
    // unchanged fields are not listed
    await expect(audit.getByRole('cell', { name: 'Melder', exact: true })).toHaveCount(0);
    await context.close();
  });

  test('hides the audit log from non-admin dispo users', async ({ browser }) => {
    const entry = await api.createJournalEntry({ text: `E2E audit hidden ${id}`, state: 'offen', priority: 'normal' });
    // PATCH as admin through the external API to create an audit log entry
    await api._request('PATCH', `/journal/${entry._id}`, { text: `E2E audit hidden (edited) ${id}` });
    const logged = await api._request('GET', `/journal/${entry._id}`);
    expect(logged.auditLog.length).toBeGreaterThan(0);

    const dispo = await api.createUser({ roles: ['dispo'], name: `E2E Dispo Audit ${id}` });
    const { context, page } = await loginAs(browser, dispo);
    try {
      await page.goto('/journal');
      await openRow(row(page, `E2E audit hidden (edited) ${id}`));
      await expect(dialog(page).getByText('ETB-Eintrag bearbeiten')).toBeVisible();
      await expect(dialog(page).getByLabel('Eintrag', { exact: true })).toHaveValue(`E2E audit hidden (edited) ${id}`);
      await expect(dialog(page).locator('table')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('toggles the sort order', async ({ page }) => {
    await api.createJournalEntry({ text: `E2E sort older ${id}`, createdAt: '2020-01-01T10:00:00.000Z' });
    await api.createJournalEntry({ text: `E2E sort newer ${id}`, createdAt: '2020-01-02T10:00:00.000Z' });
    await page.goto('/journal');
    const texts = async () => (await page.locator('tr.journal-list td:nth-child(2)').allTextContents());
    await expect(row(page, `E2E sort newer ${id}`)).toBeVisible();

    // default: newest first
    const toggle = page.locator('th', { hasText: 'Zeitpunkt' }).locator('i.fa-sort-desc');
    await expect(toggle).toBeVisible();
    await expect.poll(async () => {
      const t = await texts();
      return t.indexOf(`E2E sort newer ${id}`) < t.indexOf(`E2E sort older ${id}`);
    }).toBe(true);

    await toggle.click();
    await expect(page.locator('th', { hasText: 'Zeitpunkt' }).locator('i.fa-sort-asc')).toBeVisible();
    await expect.poll(async () => {
      const t = await texts();
      return t.indexOf(`E2E sort older ${id}`) < t.indexOf(`E2E sort newer ${id}`);
    }).toBe(true);

    await page.locator('th', { hasText: 'Zeitpunkt' }).locator('i.fa-sort-asc').click();
    await expect(page.locator('th', { hasText: 'Zeitpunkt' }).locator('i.fa-sort-desc')).toBeVisible();
    await expect.poll(async () => {
      const t = await texts();
      return t.indexOf(`E2E sort newer ${id}`) < t.indexOf(`E2E sort older ${id}`);
    }).toBe(true);
  });

  test('colours rows by priority and state', async ({ page }) => {
    await api.createJournalEntry({ text: `E2E colour hoch offen ${id}`, priority: 'hoch', state: 'offen' });
    await api.createJournalEntry({ text: `E2E colour hoch bearb ${id}`, priority: 'hoch', state: 'bearb.' });
    await api.createJournalEntry({ text: `E2E colour hoch erledigt ${id}`, priority: 'hoch', state: 'erledigt' });
    await api.createJournalEntry({ text: `E2E colour normal bearb ${id}`, priority: 'normal', state: 'bearb.' });
    await page.goto('/journal');
    await expect(row(page, `E2E colour normal bearb ${id}`)).toBeVisible();

    const prio = r => r.locator('td').nth(5);
    const state = r => r.locator('td').nth(6);

    const openHigh = row(page, `E2E colour hoch offen ${id}`);
    await expect(openHigh).toHaveClass(/bg-danger-subtle/);
    await expect(prio(openHigh)).toHaveClass(/bg-danger-subtle/);
    await expect(state(openHigh)).toHaveClass(/bg-danger-subtle/);

    const workingHigh = row(page, `E2E colour hoch bearb ${id}`);
    await expect(workingHigh).toHaveClass(/bg-danger-subtle/);
    await expect(state(workingHigh)).toHaveClass(/bg-warning-subtle/);

    // finished entries lose the row highlight, but keep the cell colours
    const doneHigh = row(page, `E2E colour hoch erledigt ${id}`);
    await expect(doneHigh).not.toHaveClass(/bg-danger-subtle/);
    await expect(prio(doneHigh)).toHaveClass(/bg-danger-subtle/);
    await expect(state(doneHigh)).toHaveClass(/bg-success-subtle/);

    const normal = row(page, `E2E colour normal bearb ${id}`);
    await expect(normal).not.toHaveClass(/bg-danger-subtle/);
    await expect(prio(normal)).not.toHaveClass(/bg-danger-subtle/);
    await expect(state(normal)).toHaveClass(/bg-warning-subtle/);
  });

  test('is not available to users without the dispo role', async ({ browser }) => {
    const user = await api.createUser({ roles: ['transports'], name: `E2E Transports Only ${id}` });
    const { context, page } = await loginAs(browser, user);
    try {
      await expect(page.getByText('ETB', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Neuer ETB-Eintrag')).toHaveCount(0);
      await page.goto('/journal');
      await expect(page.getByText(user.name, { exact: true })).toBeVisible();
      await expect(page.locator('th', { hasText: 'Zeitpunkt' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
