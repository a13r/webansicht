const { test: setup, expect } = require('@playwright/test');
const path = require('path');

const authFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Benutzername').fill('admin');
  await page.getByLabel('Passwort').fill('changeme');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText('Administrator')).toBeVisible({ timeout: 15_000 });
  await page.context().storageState({ path: authFile });
});
