/**
 * Admin Settings Tests
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

test.describe('Admin Settings', () => {
  test('settings page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: /settings/i }).nth(1)).toBeVisible({ timeout: 10000 })
  })

  test('settings page has username change form', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings')
    await expect(page.getByText(/username|display name|profile/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('settings page has password change form', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings')
    await expect(page.getByText(/password|change password/i).first()).toBeVisible({ timeout: 10000 })
  })
})
