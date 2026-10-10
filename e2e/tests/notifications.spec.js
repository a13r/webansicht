const { test, expect } = require('@playwright/test');
const { collectErrors, MiscApiHelper } = require('../helpers/misc');

// The `notifications` service cannot be called from outside (disallow('external')); the backend creates
// `showNotification` notifications when a todo becomes due. That is the real production path, so it is what
// these tests use to trigger a server-pushed toast.
//
// `reloadClient` is only created by the server after a successful database restore (settings page import).
// A restore replaces all collections and reloads every connected client, which would break any other spec
// running in the same run, so that path is deliberately not exercised here.

const unique = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const inSeconds = (s) => new Date(Date.now() + s * 1000).toISOString();

test.describe('Server-pushed notifications', () => {
  let api;

  test.beforeEach(async () => {
    api = new MiscApiHelper();
    await api.authenticate();
  });

  test.afterEach(async () => {
    await api.cleanup();
  });

  test('shows a toast when a todo becomes due', async ({ page }) => {
    const errors = collectErrors(page);
    const description = unique('due');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();

    await api.createTodo({ description, dueDate: inSeconds(3) });

    const toast = page.locator('.Toastify__toast', { hasText: description });
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toContainText('Todo fällig');
    await expect(toast).toHaveClass(/Toastify__toast--info/);
    expect(errors()).toEqual([]);
  });

  test('shows the toast on every connected client', async ({ page, browser }) => {
    const description = unique('multi');
    const context = await browser.newContext({ storageState: await page.context().storageState() });
    const second = await context.newPage();
    try {
      await page.goto('/');
      await second.goto('/');
      await expect(second.getByRole('button', { name: 'Todos' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();

      await api.createTodo({ description, dueDate: inSeconds(3) });
      await expect(page.locator('.Toastify__toast', { hasText: description })).toBeVisible({ timeout: 15_000 });
      await expect(second.locator('.Toastify__toast', { hasText: description })).toBeVisible({ timeout: 15_000 });
    } finally {
      await context.close();
    }
  });

  test('notifies for every todo when several are created at the same time', async ({ page }) => {
    const first = unique('first');
    const second = unique('second');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();

    await api.createTodo({ description: first, dueDate: inSeconds(3) });
    await api.createTodo({ description: second, dueDate: inSeconds(4) });

    await expect(page.locator('.Toastify__toast', { hasText: first })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.Toastify__toast', { hasText: second })).toBeVisible({ timeout: 15_000 });
  });

  test('does not notify for a todo that was deleted before it became due', async ({ page }) => {
    const deleted = unique('deleted');
    const kept = unique('kept');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();

    const todo = await api.createTodo({ description: deleted, dueDate: inSeconds(3) });
    await api.createTodo({ description: kept, dueDate: inSeconds(5) });
    await api._request('DELETE', `/todos/${todo._id}`);

    // once the later todo fired, the earlier (deleted) one would have fired already
    await expect(page.locator('.Toastify__toast', { hasText: kept })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.Toastify__toast', { hasText: deleted })).toHaveCount(0);
  });

  test('does not notify at the old time after a todo was rescheduled', async ({ page }) => {
    const description = unique('moved');
    const marker = unique('marker');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible();

    const todo = await api.createTodo({ description, dueDate: inSeconds(3) });
    await api.createTodo({ description: marker, dueDate: inSeconds(5) });
    await api._request('PATCH', `/todos/${todo._id}`, { dueDate: new Date(Date.now() + 3600_000).toISOString() });

    await expect(page.locator('.Toastify__toast', { hasText: marker })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.Toastify__toast', { hasText: description })).toHaveCount(0);
  });
});
