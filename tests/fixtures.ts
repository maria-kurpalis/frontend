import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string) {
  await page.goto('/');
  const logout = page.getByRole('button', { name: 'Logout', exact: true });
  await expect(logout.or(page.getByLabel('Email address', { exact: true }))).toBeVisible();
  if (await logout.count()) await logout.click();
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page).toHaveURL(/\/(resident\/[0-9a-f-]+|admin\/[0-9a-f-]+\/community\/[0-9a-f-]+)$/);
}

// Direct test API calls select the fixture resident. Browser calls must retain
// the actual selected route identity, especially when switching communities.
export const test = base.extend({
  request: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      extraHTTPHeaders: process.env.E2E_RESIDENT_ID ? { 'X-Resident-Id': process.env.E2E_RESIDENT_ID } : {},
    });
    try { await use(request); } finally { await request.dispose(); }
  },
});
export { expect };
