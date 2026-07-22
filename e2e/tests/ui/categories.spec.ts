import { test, expect } from '@playwright/test'

test.describe('Categories Page', () => {
  test('shows categories page with heading', async ({ page }) => {
    await page.goto('/categories')
    await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible()
  })

  test('displays category cards', async ({ page }) => {
    await page.goto('/categories')
    // Should show at least some categories
    await expect(page.getByText('Brakes').or(page.getByText('Brake System'))).toBeVisible()
    await expect(page.getByText('Engine').or(page.getByText('Engine Parts'))).toBeVisible()
  })

  test('category cards link to search', async ({ page }) => {
    await page.goto('/categories')
    // At least one category should have a link to /search
    const searchLinks = page.getByRole('link', { name: /search|browse|parts/i })
    await expect(searchLinks.first()).toBeVisible()
  })

  test('shows category count', async ({ page }) => {
    await page.goto('/categories')
    // Categories should show part counts (numbers)
    await expect(page.getByText(/parts/i).first()).toBeVisible()
  })
})
