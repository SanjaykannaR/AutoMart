import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'

test.describe('Authentication — Login', () => {
  test('should show login form with all fields', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.registerLink).toBeVisible()
  })

  test('should show error for invalid email', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('nonexistent@example.com', 'wrongpassword')
    await expect(loginPage.errorMessage.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show error for wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    // Use an email that looks valid but won't match any seeded user
    await loginPage.login('admin@automart.com', 'wrongpassword')
    await expect(loginPage.errorMessage.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to register page from login', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.registerLink.click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('should have email and password inputs with correct types', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email')
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
  })
})
