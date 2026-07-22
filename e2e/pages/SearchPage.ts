/**
 * SearchPage Page Object Model
 */

import { type Page, type Locator } from '@playwright/test'

export class SearchPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly categoryFilter: Locator
  readonly brandFilter: Locator
  readonly vehicleTypeFilter: Locator
  readonly voiceButton: Locator
  readonly imageButton: Locator
  readonly productCards: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByPlaceholder(/search/i).first()
    this.categoryFilter = page.locator('select').nth(0)
    this.brandFilter = page.getByPlaceholder(/e\.g\. bosch/i)
    this.vehicleTypeFilter = page.locator('select').nth(1)
    this.voiceButton = page.locator('button[title="Voice search"]').last()
    this.imageButton = page.locator('button[title="Search by image"]').last()
    this.productCards = page.locator('.glass-card')
    this.emptyState = page.getByText('No products found')
  }

  async goto() {
    await this.page.goto('/search')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
    await this.page.waitForTimeout(1000)
  }

  async getResultsCount() {
    return this.productCards.count()
  }
}
