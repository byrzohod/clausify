import { test, expect } from '@playwright/test';

test.describe('Demo Page', () => {
  test('displays demo upload form', async ({ page }) => {
    await page.goto('/demo');

    await expect(
      page.getByRole('heading', { name: /try clausify demo/i })
    ).toBeVisible();
    await expect(page.getByText(/upload a contract/i)).toBeVisible();
    await expect(
      page.getByText(/drop your pdf or docx file/i)
    ).toBeVisible();
  });

  test('displays demo limitations', async ({ page }) => {
    await page.goto('/demo');

    await expect(page.getByText(/demo limitations/i)).toBeVisible();
    await expect(page.getByText(/maximum file size: 5mb/i)).toBeVisible();
    await expect(
      page.getByText(/1 demo analysis per hour/i)
    ).toBeVisible();
  });

  test('has link to signup', async ({ page }) => {
    await page.goto('/demo');

    const signupLink = page.getByRole('link', { name: /sign up for free/i });
    await expect(signupLink).toBeVisible();

    await signupLink.click();
    await expect(page).toHaveURL('/signup');
  });

  test('shows drop zone for file upload', async ({ page }) => {
    await page.goto('/demo');

    // Check for upload area
    const uploadArea = page.locator('text=Upload your contract');
    await expect(uploadArea).toBeVisible();
  });

  test('shows supported file types', async ({ page }) => {
    await page.goto('/demo');

    await expect(page.getByText(/supported: pdf, docx/i)).toBeVisible();
  });
});
