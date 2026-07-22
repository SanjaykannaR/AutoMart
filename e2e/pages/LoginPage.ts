/**
 * LoginPage Page Object Model
 *
 * POM encapsulates page structure and interactions.
 * Tests use semantic selectors (getByRole, getByLabel) — not CSS selectors.
 * This makes tests resilient to DOM structure changes.
 *
 * NOTE: The login page wraps forms in GoogleOAuthProvider + framer-motion
 * AnimatePresence. Google's OAuth script causes a React re-render on load
 * that detaches and replaces form DOM nodes. We must wait for the form to
 * stabilize before interacting.
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
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]').first()
    this.submitButton = page.getByRole('button', { name: /sign in/i })
    this.errorMessage = page.locator('[class*="danger"], [class*="error"]')
    this.registerLink = page.getByRole('link', { name: /create account/i })
  }

  async goto() {
    await this.page.goto('/login')
    // Wait for page to fully load
    await this.page.waitForLoadState('networkidle')
    // Wait for the email input to be visible (form rendered)
    // Use a generous timeout since GoogleOAuth + framer-motion can delay render
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 })
    // Extra settle time for AnimatePresence + OAuth hydration re-render
    await this.page.waitForTimeout(1000)
  }

  async login(email: string, password: string) {
    // Re-resolve locators to avoid detached DOM nodes from OAuth re-render
    const emailInput = this.page.locator('input[type="email"]')
    const passwordInput = this.page.locator('input[type="password"]').first()
    const submitButton = this.page.getByRole('button', { name: /sign in/i })
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()
  }

  async waitForError() {
    await this.errorMessage.first().waitFor({ state: 'visible', timeout: 10000 })
  }
}
