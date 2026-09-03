import { test, expect } from '@playwright/test';

test('home page loads and shows the title screen click gate', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('My Garage Life — Autocross');
  await expect(page.getByRole('button', { name: 'Click anywhere to start' })).toBeVisible();
});
