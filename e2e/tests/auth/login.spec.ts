import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'

test.describe('Authentication', () => {
  test('should show login form', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('wrong@email.com', 'wrongpassword')
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to register page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.registerLink.click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })
})
