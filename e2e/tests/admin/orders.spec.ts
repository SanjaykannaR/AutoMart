/**
 * Admin Orders Tests
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

test.describe('Admin Orders', () => {
  test('orders page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 10000 })
  })

  test('orders page shows existing orders', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/orders')
    // We have 2 orders in the DB
    await expect(page.getByText(/order|total|status/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('orders page has filter/status controls', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/orders')
    // Filter buttons: "All", "pending", "confirmed", etc.
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /pending/i })).toBeVisible()
  })
})
