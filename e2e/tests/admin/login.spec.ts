/**
 * Admin Login Tests
 * Tests the admin authentication flow.
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@automart.com'
const ADMIN_PASSWORD = 'AutoMart@2026!'

test.describe('Admin Login', () => {
  test('admin login page loads with form fields', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByPlaceholder('admin@automart.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('admin login page shows "Admin Access" badge', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByText('Admin Access')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign In to Admin Panel' })).toBeVisible()
  })

  test('admin login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByPlaceholder('admin@automart.com').fill('wrong@email.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should show an error message (not redirect)
    await expect(page.getByText(/invalid|error|failed/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('admin login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByPlaceholder('admin@automart.com').fill(ADMIN_EMAIL)
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
  })
})
