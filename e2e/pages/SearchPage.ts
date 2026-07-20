import { type Page, type Locator } from '@playwright/test'

export class SearchPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly voiceButton: Locator
  readonly imageButton: Locator
  readonly categoryFilter: Locator
  readonly brandFilter: Locator
  readonly productCards: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByPlaceholder(/search/i)
    this.searchButton = page.getByRole('button', { name: /search/i })
    this.voiceButton = page.locator('[title="Voice search"]')
    this.imageButton = page.locator('[title="Search by image"]')
    this.categoryFilter = page.getByLabel(/category/i)
    this.brandFilter = page.getByPlaceholder(/e\.g\. Bosch/i)
    this.productCards = page.locator('[class*="glass-card"]')
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
