import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('displays hero section with call to action', async ({ page }) => {
    await page.goto('/');

    // Check hero heading (first h1)
    await expect(
      page.locator('h1').filter({ hasText: /understand your contracts/i })
    ).toBeVisible();

    // Check CTA buttons
    await expect(page.getByRole('link', { name: /start free analysis/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /try demo/i }).first()).toBeVisible();
  });

  test('navigates to signup from CTA', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /start free analysis/i }).click();

    await expect(page).toHaveURL('/signup');
  });

  test('navigates to demo page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /try demo/i }).first().click();

    await expect(page).toHaveURL('/demo');
  });

  test('displays features section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/how clausify works/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Upload' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Analyze' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3. Understand' })).toBeVisible();
  });

  test('displays contract types', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/works with any contract type/i)).toBeVisible();
    // Check specific contract type badges
    await expect(page.getByText('Employment', { exact: true })).toBeVisible();
    await expect(page.getByText('NDA', { exact: true })).toBeVisible();
    await expect(page.getByText('Lease', { exact: true })).toBeVisible();
  });

  test('header navigation works', async ({ page }) => {
    await page.goto('/');

    // Click Pricing (in header)
    const header = page.locator('header');
    await header.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');

    // Go back and click Sign In
    await page.goto('/');
    await header.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('footer links are present', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer.getByText('Privacy Policy')).toBeVisible();
    await expect(footer.getByText('Terms of Service')).toBeVisible();
    await expect(footer.getByText('Disclaimer')).toBeVisible();
  });
});
