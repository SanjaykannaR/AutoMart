import { test, expect } from '@playwright/test'

test.describe('Registration', () => {
  test('should show registration form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should show error on short password', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('123')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.locator('text=8 characters')).toBeVisible()
  })

  test('should navigate back to login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
