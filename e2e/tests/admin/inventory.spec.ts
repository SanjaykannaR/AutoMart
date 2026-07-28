/**
 * Admin Inventory Tests
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@automart.com'
const ADMIN_PASSWORD = 'AutoMart@2026!'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('admin@automart.com').fill(ADMIN_EMAIL)
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
}

test.describe('Admin Inventory', () => {
  test('inventory page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/inventory')
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible({ timeout: 10000 })
  })

  test('inventory page shows summary cards', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/inventory')
    // Should show some summary stats
    await expect(page.getByText(/total|stock|product|low|out/i).first()).toBeVisible({ timeout: 10000 })
  })
})
