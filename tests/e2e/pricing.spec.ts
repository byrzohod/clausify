import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('displays all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');

    await expect(
      page.getByRole('heading', { name: /simple, transparent pricing/i })
    ).toBeVisible();

    // Check all plan names
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Pay Per Use', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Pro Annual', exact: true })
    ).toBeVisible();
  });

  test('displays correct prices', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.getByText('$4.99')).toBeVisible();
    await expect(page.getByText('$14.99')).toBeVisible();
    await expect(page.getByText('$119')).toBeVisible();
  });

  test('shows most popular badge on Pro plan', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('displays features for each plan', async ({ page }) => {
    await page.goto('/pricing');

    // Free plan features
    await expect(page.getByText('2 contract analyses')).toBeVisible();

    // Pro plan features
    await expect(page.getByText('20 analyses per month')).toBeVisible();
    await expect(page.getByText('PDF export').first()).toBeVisible();
  });

  test('Get Started button redirects to signup for unauthenticated user', async ({
    page,
  }) => {
    await page.goto('/pricing');

    await page.getByRole('button', { name: 'Get Started' }).click();

    await expect(page).toHaveURL('/signup');
  });

  test('displays FAQ section', async ({ page }) => {
    await page.goto('/pricing');

    await expect(
      page.getByText('Frequently Asked Questions')
    ).toBeVisible();
    await expect(
      page.getByText(/what counts as one analysis/i)
    ).toBeVisible();
    await expect(page.getByText(/can i cancel anytime/i)).toBeVisible();
  });

  test('displays contact sales section', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByText('Need More?')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /contact sales/i })
    ).toBeVisible();
  });
});
