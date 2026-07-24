/**
 * Admin Products Tests
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@automart.com'
const ADMIN_PASSWORD = 'Admin@12345'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('admin@automart.com').fill(ADMIN_EMAIL)
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
}

test.describe('Admin Products', () => {
  test('products page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible({ timeout: 10000 })
  })

  test('products page shows create button', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await expect(page.getByRole('button', { name: /\+|create|add/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('products page has search/filter controls', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    // Should have some form of search or filter
    await expect(page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]').first()).toBeVisible({ timeout: 10000 })
  })
})
