/**
 * Admin Users Tests
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

test.describe('Admin Users', () => {
  test('users page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({ timeout: 10000 })
  })

  test('users page shows user list', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/users')
    // Should show users we seeded
    await expect(page.getByText('admin@automart.com')).toBeVisible({ timeout: 10000 })
  })

  test('users page has search input', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/users')
    await expect(page.locator('input[placeholder*="search" i]').first()).toBeVisible({ timeout: 10000 })
  })

  test('users page shows role badges', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/users')
    await expect(page.getByText('admin').first()).toBeVisible({ timeout: 10000 })
  })
})
