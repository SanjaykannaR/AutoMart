/**
 * CheckoutPage Page Object Model
 */

import { type Page, type Locator } from '@playwright/test'

export class CheckoutPage {
  readonly page: Page
  readonly addressInput: Locator
  readonly phoneInput: Locator
  readonly noteInput: Locator
  readonly placeOrderButton: Locator
  readonly orderSummary: Locator

  constructor(page: Page) {
    this.page = page
    this.addressInput = page.getByPlaceholder('Street, building, landmark')
    this.phoneInput = page.getByPlaceholder('+1 234 567 890')
    this.noteInput = page.getByPlaceholder('Ring the doorbell')
    this.placeOrderButton = page.getByRole('button', { name: /pay with card/i })
    this.orderSummary = page.getByText('Order Summary')
  }

  async goto() {
    await this.page.goto('/checkout')
  }

  async fillDetails(address: string, phone: string) {
    await this.addressInput.fill(address)
    await this.phoneInput.fill(phone)
  }

  async placeOrder() {
    await this.placeOrderButton.click()
  }
}
