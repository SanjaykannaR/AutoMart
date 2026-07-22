/**
 * OrdersPage Page Object Model
 */

import { type Page, type Locator } from '@playwright/test'

export class OrdersPage {
  readonly page: Page
  readonly heading: Locator
  readonly emptyState: Locator
  readonly orderCards: Locator
  readonly startShoppingLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /my orders/i })
    this.emptyState = page.getByText('No orders yet')
    this.orderCards = page.locator('.glass-card')
    this.startShoppingLink = page.getByRole('link', { name: /start shopping/i })
  }

  async goto() {
    await this.page.goto('/orders')
  }
}
