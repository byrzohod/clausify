import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Signup Page', () => {
    test('displays signup form', async ({ page }) => {
      await page.goto('/signup');

      await expect(
        page.getByRole('heading', { name: /create an account/i })
      ).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(
        page.getByRole('button', { name: /create account/i })
      ).toBeVisible();
    });

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('button', { name: /create account/i }).click();

      // Form validation through Zod shows error messages
      await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 5000 });
    });

    test('shows error for password mismatch', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('password123');
      await page.getByLabel(/confirm password/i).fill('different123');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords don't match/i)).toBeVisible();
    });

    test('shows error for short password', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('short');
      await page.getByLabel(/confirm password/i).fill('short');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('link', { name: /sign in/i }).click();

      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Login Page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');

      await expect(
        page.getByRole('heading', { name: /welcome back/i })
      ).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole('button', { name: /sign in/i })
      ).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');

      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show error after API call (match various error messages)
      await expect(
        page.getByRole('alert').or(page.getByText(/invalid|error|failed/i))
      ).toBeVisible({ timeout: 10000 });
    });

    test('has link to signup page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /sign up/i }).click();

      await expect(page).toHaveURL('/signup');
    });
  });
});
