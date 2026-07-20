import { test, expect } from '@playwright/test'

test.describe('Product Browsing', () => {
  test('homepage shows categories', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Browse by Category')).toBeVisible()
    await expect(page.getByText('Brake System')).toBeVisible()
    await expect(page.getByText('Engine Parts')).toBeVisible()
  })

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products/1')
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible()
  })

  test('can add product to cart', async ({ page }) => {
    await page.goto('/products/1')
    await page.getByRole('button', { name: /add to cart/i }).click()
    await expect(page).toHaveURL(/\/cart/)
  })
})
