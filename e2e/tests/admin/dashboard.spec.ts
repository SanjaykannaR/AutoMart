/**
 * Admin Dashboard Tests
 * Tests the admin dashboard page after login.
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@automart.com'
const ADMIN_PASSWORD = 'AutoMart@2026!'

/** Helper: login as admin and navigate to dashboard */
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('admin@automart.com').fill(ADMIN_EMAIL)
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
}

test.describe('Admin Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    await loginAsAdmin(page)
    // Should show stat cards for all metrics
    await expect(page.getByText('Products')).toBeVisible()
    await expect(page.getByText('Orders')).toBeVisible()
    await expect(page.getByText('Revenue')).toBeVisible()
    await expect(page.getByText('Inventory')).toBeVisible()
    await expect(page.getByText('Banners')).toBeVisible()
    await expect(page.getByText('Users')).toBeVisible()
  })

  test('dashboard shows recent users section', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Recent Users')).toBeVisible()
    // Should show at least the admin user in the recent users list
    await expect(page.locator('text=admin@automart.com').first()).toBeVisible({ timeout: 10000 })
  })

  test('dashboard shows quick actions', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Quick Actions')).toBeVisible()
    await expect(page.getByText('Manage Banners')).toBeVisible()
    await expect(page.getByText('View Products')).toBeVisible()
    await expect(page.getByText('View Orders')).toBeVisible()
  })

  test('dashboard sidebar has all nav items', async ({ page }) => {
    await loginAsAdmin(page)
    // Sidebar nav links — use getByRole('link') to disambiguate from heading/header text
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Banners' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  })
})
