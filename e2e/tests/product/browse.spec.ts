import { test, expect } from '@playwright/test'

test.describe('Product Browsing', () => {
  test('homepage shows hero section', async ({ page }) => {
    await page.goto('/')
    // Hero is a banner carousel — check for search bar and slide navigation
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible()
    await expect(page.locator('[aria-label="Next slide"]')).toBeVisible()
  })

  test('homepage shows categories section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Browse by Category')).toBeVisible()
    await expect(page.getByText('Brake System').last()).toBeVisible()
    await expect(page.getByText('Engine Parts').last()).toBeVisible()
    await expect(page.getByText('Suspension').last()).toBeVisible()
    await expect(page.getByText('Electrical').last()).toBeVisible()
  })

  test('homepage has search bar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible()
  })

  test('product detail page loads with mock data', async ({ page }) => {
    await page.goto('/products/1')
    // Page falls back to mockProduct when API doesn't have the ID
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Ceramic Brake Pads' })).toBeVisible()
  })

  test('product detail shows price and specs', async ({ page }) => {
    await page.goto('/products/1')
    await expect(page.getByText('$45.99').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Specifications')).toBeVisible()
    await expect(page.getByText('Compatible Vehicles')).toBeVisible()
  })

  test('can add product to cart and navigate to cart', async ({ page }) => {
    await page.goto('/products/1')
    await page.getByRole('button', { name: /add to cart/i }).click()
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.getByText('Shopping Cart')).toBeVisible()
  })

  test('cart shows item after adding from product page', async ({ page }) => {
    // Clear cart first
    await page.goto('/cart')
    await page.evaluate(() => localStorage.removeItem('cart'))

    // Add item
    await page.goto('/products/1')
    await page.getByRole('button', { name: /add to cart/i }).click()

    // Verify cart has item
    await expect(page.getByText('Ceramic Brake Pads')).toBeVisible()
    await expect(page.getByText('Proceed to Checkout')).toBeVisible()
  })

  test('homepage has "Start Browsing" CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Need a Part?')).toBeVisible()
    await expect(page.getByRole('link', { name: /start browsing/i })).toBeVisible()
  })
})
