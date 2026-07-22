import { test, expect } from '@playwright/test'
import { RegisterPage } from '../../pages/RegisterPage'

test.describe('Authentication — Registration', () => {
  test('should show registration form with all fields', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(registerPage.nameInput).toBeVisible()
    await expect(registerPage.emailInput).toBeVisible()
    await expect(registerPage.passwordInput).toBeVisible()
    await expect(registerPage.submitButton).toBeVisible()
  })

  test('should show error for short password', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()
    await registerPage.register('Test User', 'newuser@example.com', '123')
    // The API returns a validation error about minimum 8 characters
    await expect(registerPage.errorMessage.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show error for duplicate email', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()
    await registerPage.register('Duplicate User', 'admin@automart.com', 'Password123!')
    // API returns 409 with email already taken message
    await expect(registerPage.errorMessage.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate back to login from register', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()
    await registerPage.signInLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})
