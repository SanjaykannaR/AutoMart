/**
 * RegisterPage Page Object Model
 */

import { type Page, type Locator } from '@playwright/test'

export class RegisterPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly signInLink: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.getByPlaceholder('Your full name')
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.getByPlaceholder('At least 8 characters')
    this.submitButton = page.getByRole('button', { name: /create account/i })
    this.errorMessage = page.locator('[class*="danger"], [class*="error"]')
    this.signInLink = page.getByRole('link', { name: /sign in/i })
  }

  async goto() {
    await this.page.goto('/register')
  }

  async register(name: string, email: string, password: string) {
    await this.nameInput.fill(name)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
