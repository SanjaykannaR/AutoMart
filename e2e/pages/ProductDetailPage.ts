/**
 * ProductDetailPage Page Object Model
 */

import { type Page, type Locator } from '@playwright/test'

export class ProductDetailPage {
  readonly page: Page
  readonly productName: Locator
  readonly productPrice: Locator
  readonly addToCartButton: Locator
  readonly quantityMinus: Locator
  readonly quantityPlus: Locator
  readonly quantityDisplay: Locator
  readonly deliveryInfo: Locator

  constructor(page: Page) {
    this.page = page
    this.productName = page.locator('h1')
    this.productPrice = page.locator('.glow-text').first()
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i })
    this.quantityMinus = page.locator('button').filter({ hasText: /^-$/ }).first()
    this.quantityPlus = page.locator('button').filter({ hasText: /^\+$/ }).first()
    this.quantityDisplay = page.locator('span').filter({ hasText: /^\d+$/ }).first()
    this.deliveryInfo = page.getByText(/delivery in 30 minutes/i)
  }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}`)
    // Wait for page to load (either skeleton or content)
    await this.page.waitForTimeout(500)
  }

  async addToCart() {
    await this.addToCartButton.click()
  }
}
