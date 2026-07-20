import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../../pages/CheckoutPage'

test.describe('Order Flow', () => {
  test('cart shows empty state when no items', async ({ page }) => {
    // Clear cart
    await page.goto('/cart')
    await page.evaluate(() => localStorage.removeItem('cart'))
    await page.reload()
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByRole('link', { name: /browse parts/i })).toBeVisible()
  })

  test('checkout redirects to cart when cart is empty', async ({ page }) => {
    // Clear cart
    await page.goto('/cart')
    await page.evaluate(() => localStorage.removeItem('cart'))

    // Navigate to checkout — should redirect to cart
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/cart/)
  })

  test('checkout form is accessible with items in cart', async ({ page }) => {
    // Seed cart with a test item
    await page.goto('/checkout')
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 'test-1', name: 'Test Brake Pad', price: 29.99, qty: 1, imageUrl: '', brand: 'Test', category: 'Brakes' },
      ]))
    })
    await page.goto('/checkout')

    const checkoutPage = new CheckoutPage(page)
    await expect(checkoutPage.addressInput).toBeVisible()
    await expect(checkoutPage.phoneInput).toBeVisible()
    await expect(checkoutPage.placeOrderButton).toBeVisible()
  })

  test('checkout place order button is disabled without address/phone', async ({ page }) => {
    // Seed cart
    await page.goto('/checkout')
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 'test-1', name: 'Test Brake Pad', price: 29.99, qty: 1, imageUrl: '', brand: 'Test', category: 'Brakes' },
      ]))
    })
    await page.goto('/checkout')

    const checkoutPage = new CheckoutPage(page)
    await expect(checkoutPage.placeOrderButton).toBeDisabled()
  })

  test('checkout shows order summary with item details', async ({ page }) => {
    // Seed cart
    await page.goto('/checkout')
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 'test-1', name: 'Test Brake Pad', price: 29.99, qty: 2, imageUrl: '', brand: 'Test', category: 'Brakes' },
      ]))
    })
    await page.goto('/checkout')

    await expect(page.getByText('Order Summary')).toBeVisible()
    await expect(page.getByText('Test Brake Pad')).toBeVisible()
    await expect(page.getByText('$59.98')).toBeVisible() // 29.99 * 2
  })
})
