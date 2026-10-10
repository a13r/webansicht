const { expect } = require('@playwright/test');

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

// Opens a fresh, logged-out browser context and logs in through the login form.
async function loginInNewContext(browser, username, password, displayName) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel('Benutzername').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText(displayName)).toBeVisible({ timeout: 15_000 });
  return { context, page };
}

async function getUserByUsername(api, username) {
  const res = await api._request('GET', `/users?username=${encodeURIComponent(username)}`);
  const users = Array.isArray(res) ? res : res.data;
  return users.find(u => u.username === username);
}

// Finds a user (e.g. one created through the UI) and registers it for cleanup via api.cleanup().
async function trackUser(api, username) {
  await api._getSocketClient();
  const user = await getUserByUsername(api, username);
  if (user) api._createdUsers.push(user._id);
  return user;
}

module.exports = { randomSuffix, loginInNewContext, getUserByUsername, trackUser };
