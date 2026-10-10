const { test, expect } = require('@playwright/test');
const { MiscApiHelper } = require('../helpers/misc');

const unique = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const toasts = (page) => page.locator('.Toastify__toast');

// Parses the form's 'DD.MM.YYYY HH:mm' value into minutes since an arbitrary epoch so that
// differences between two values can be compared independent of the current time.
function minutesOf(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`Unexpected date format: "${value}"`);
  const [, d, mo, y, h, mi] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) / 60000;
}

test.describe('Todos', () => {
  let api;

  test.beforeEach(async ({ page }) => {
    api = new MiscApiHelper();
    await api.authenticate();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  // Todos created through the UI are not tracked by the helper
  async function trackByDescription(description) {
    const result = await api.getTodos();
    for (const todo of result.data || result) {
      if (todo.description === description) api._createdTodos.push(todo._id);
    }
  }

  const openDropdown = async (page) => {
    await page.getByRole('button', { name: 'Todos' }).click();
  };

  const dialog = (page) => page.getByRole('dialog');
  const dueDate = (page) => dialog(page).getByLabel('Fälligkeit');

  test('lists existing todos sorted by due date, with the due time', async ({ page }) => {
    const late = unique('late');
    const early = unique('early');
    await api.createTodo({ description: late, dueDate: new Date(Date.now() + 4 * 3600_000).toISOString() });
    await api.createTodo({ description: early, dueDate: new Date(Date.now() + 2 * 3600_000).toISOString() });

    await openDropdown(page);
    const items = page.locator('.dropdown-menu.show .dropdown-item');
    await expect(items.filter({ hasText: early })).toContainText(/fällig \d{2}:\d{2}/);
    await expect(items.filter({ hasText: late })).toBeVisible();
    const texts = await items.allTextContents();
    expect(texts.findIndex((t) => t.includes(early))).toBeLessThan(texts.findIndex((t) => t.includes(late)));
    // the "new" entry is always last
    await expect(items.last()).toContainText('neu');
  });

  test('shows todos created elsewhere in real time and removes deleted ones', async ({ page }) => {
    const description = unique('live');
    const todo = await api.createTodo({ description });
    await openDropdown(page);
    const item = page.locator('.dropdown-menu.show .dropdown-item', { hasText: description });
    await expect(item).toBeVisible();

    await api._request('PATCH', `/todos/${todo._id}`, { description: `${description}-edited` });
    await expect(page.locator('.dropdown-menu.show .dropdown-item', { hasText: `${description}-edited` })).toBeVisible();

    await api._request('DELETE', `/todos/${todo._id}`);
    await expect(page.locator('.dropdown-menu.show .dropdown-item', { hasText: description })).toHaveCount(0);
  });

  test('creates a todo with the time buttons', async ({ page }) => {
    const description = unique('create');
    await openDropdown(page);
    await page.locator('.dropdown-menu.show .dropdown-item', { hasText: 'neu' }).click();
    await expect(dialog(page).getByText('Todo erstellen')).toBeVisible();
    // no delete button for new todos
    await expect(dialog(page).getByRole('button', { name: 'Löschen' })).toHaveCount(0);

    await dialog(page).getByLabel('Beschreibung').fill(description);
    await dialog(page).getByRole('button', { name: 'jetzt' }).click();
    await expect(dueDate(page)).toHaveValue(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    const now = minutesOf(await dueDate(page).inputValue());

    await dialog(page).getByRole('button', { name: '+0:30' }).click();
    await expect.poll(async () => minutesOf(await dueDate(page).inputValue())).toBe(now + 30);
    await dialog(page).getByRole('button', { name: '–0:15' }).click();
    await expect.poll(async () => minutesOf(await dueDate(page).inputValue())).toBe(now + 15);
    await dialog(page).getByRole('button', { name: '+0:15' }).click();
    await expect.poll(async () => minutesOf(await dueDate(page).inputValue())).toBe(now + 30);
    await dialog(page).getByRole('button', { name: '–0:30' }).click();
    await expect.poll(async () => minutesOf(await dueDate(page).inputValue())).toBe(now);
    await dialog(page).getByRole('button', { name: '+0:30' }).click();
    await dialog(page).getByRole('button', { name: ':00' }).click();
    await expect(dueDate(page)).toHaveValue(/:00$/);

    // the saved due date is the one in the form
    const expectedMinutes = minutesOf(await dueDate(page).inputValue());
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();
    await expect(toasts(page).filter({ hasText: 'Todo erstelt' })).toBeVisible();
    await expect(dialog(page)).toHaveCount(0);
    await trackByDescription(description);

    const result = await api.getTodos();
    const saved = (result.data || result).find((t) => t.description === description);
    expect(saved).toBeTruthy();
    // compare in the browser's time zone, the same one the form used
    const local = await page.evaluate((iso) => {
      const d = new Date(iso);
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) / 60000;
    }, saved.dueDate);
    expect(local).toBe(expectedMinutes);

    await openDropdown(page);
    await expect(page.locator('.dropdown-menu.show .dropdown-item', { hasText: description })).toContainText(/fällig \d{2}:\d{2}/);
  });

  test('edits a todo', async ({ page }) => {
    const description = unique('edit');
    const todo = await api.createTodo({ description });

    await openDropdown(page);
    await page.locator('.dropdown-menu.show .dropdown-item', { hasText: description }).click();
    await expect(dialog(page).getByText('Todo bearbeiten')).toBeVisible();
    await expect(dialog(page).getByLabel('Beschreibung')).toHaveValue(description);
    await expect(dueDate(page)).toHaveValue(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    const before = minutesOf(await dueDate(page).inputValue());

    await dialog(page).getByLabel('Beschreibung').fill(`${description}-changed`);
    await dialog(page).getByRole('button', { name: '+0:15' }).click();
    await expect.poll(async () => minutesOf(await dueDate(page).inputValue())).toBe(before + 15);
    await dialog(page).getByRole('button', { name: 'Speichern' }).click();
    await expect(toasts(page).filter({ hasText: 'Todo aktualisiert' })).toBeVisible();
    await expect(dialog(page)).toHaveCount(0);

    await expect.poll(async () => {
      const saved = await api._request('GET', `/todos/${todo._id}`);
      return saved.description;
    }).toBe(`${description}-changed`);
    const saved = await api._request('GET', `/todos/${todo._id}`);
    // the form works with minute precision, so the seconds of the original due date are dropped
    const minute = (iso) => Math.floor(new Date(iso).getTime() / 60_000);
    expect(minute(saved.dueDate)).toBe(minute(todo.dueDate) + 15);
  });

  test('deletes a todo', async ({ page }) => {
    const description = unique('delete');
    const todo = await api.createTodo({ description });

    await openDropdown(page);
    await page.locator('.dropdown-menu.show .dropdown-item', { hasText: description }).click();
    await dialog(page).getByRole('button', { name: 'Löschen' }).click();
    await expect(toasts(page).filter({ hasText: 'Todo gelöscht' })).toBeVisible();
    await expect(dialog(page)).toHaveCount(0);

    await openDropdown(page);
    await expect(page.locator('.dropdown-menu.show .dropdown-item', { hasText: description })).toHaveCount(0);
    await expect(api._request('GET', `/todos/${todo._id}`)).rejects.toThrow(/404/);
  });

  test('cancelling does not save anything', async ({ page }) => {
    const description = unique('cancel');
    await openDropdown(page);
    await page.locator('.dropdown-menu.show .dropdown-item', { hasText: 'neu' }).click();
    await dialog(page).getByLabel('Beschreibung').fill(description);
    await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog(page)).toHaveCount(0);

    // a following "new" starts with an empty form
    await openDropdown(page);
    await page.locator('.dropdown-menu.show .dropdown-item', { hasText: 'neu' }).click();
    await expect(dialog(page).getByLabel('Beschreibung')).toHaveValue('');
    const result = await api.getTodos();
    expect((result.data || result).filter((t) => t.description === description)).toHaveLength(0);
  });
});
