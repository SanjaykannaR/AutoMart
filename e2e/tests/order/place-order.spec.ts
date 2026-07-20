import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../../pages/CheckoutPage'

test.describe('Order Flow', () => {
  test('cart shows empty state', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText('Your cart is empty')).toBeVisible()
  })

  test('checkout form is accessible', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page)
    await checkoutPage.goto()
    await expect(checkoutPage.addressInput).toBeVisible()
    await expect(checkoutPage.phoneInput).toBeVisible()
    await expect(checkoutPage.placeOrderButton).toBeVisible()
  })

  test('checkout requires address and phone', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page)
    await checkoutPage.goto()
    await expect(checkoutPage.placeOrderButton).toBeDisabled()
  })
})
