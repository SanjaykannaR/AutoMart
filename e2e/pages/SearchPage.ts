/**
 * SearchPage Page Object Model
 */

import { type Page, type Locator, expect } from '@playwright/test'

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

  async waitForCategoryOptions() {
    await this.page.locator('select').nth(0).waitFor()
    await expect(this.page.locator('select').nth(0).locator('option').first()).toBeVisible({ timeout: 15000 })
  }

  /**
   * Read the first real category option from the rendered dropdown.
   * The deployed app loads categories live from /api/categories (Supabase DB),
   * so names differ per environment ('Brake Parts' vs 'Brake System'). Reading
   * the actual option keeps the test robust to whatever catalog is seeded.
   */
  async getFirstCategory(): Promise<string> {
    await this.waitForCategoryOptions()
    const select = this.page.locator('select').nth(0)
    const values = await select.locator('option').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== ''),
    )
    if (values.length === 0) throw new Error('No category options rendered in the filter dropdown')
    return values[0]
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
