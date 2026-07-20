/**
 * LoginPage Page Object Model
 *
 * POM encapsulates page structure and interactions.
 * Tests use semantic selectors (getByRole, getByLabel) — not CSS selectors.
 * This makes tests resilient to DOM structure changes.
 */

import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: /sign in/i })
    this.errorMessage = page.locator('[class*="danger"], [class*="error"]')
    this.registerLink = page.getByRole('link', { name: /register/i })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async waitForError() {
    await this.errorMessage.first().waitFor({ state: 'visible', timeout: 10000 })
  }
}
