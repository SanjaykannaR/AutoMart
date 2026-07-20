import { test, expect } from '@playwright/test'
import { OrdersPage } from '../../pages/OrdersPage'

test.describe('Order Tracking', () => {
  test('orders page shows heading', async ({ page }) => {
    const ordersPage = new OrdersPage(page)
    await ordersPage.goto()
    await expect(ordersPage.heading).toBeVisible()
  })

  test('orders page shows empty state for unauthenticated user', async ({ page }) => {
    const ordersPage = new OrdersPage(page)
    await ordersPage.goto()
    // Without a valid token, the API returns anonymous user's orders (empty)
    await expect(ordersPage.emptyState).toBeVisible({ timeout: 10000 })
  })

  test('orders page has start shopping link', async ({ page }) => {
    const ordersPage = new OrdersPage(page)
    await ordersPage.goto()
    await expect(ordersPage.startShoppingLink).toBeVisible()
    await expect(ordersPage.startShoppingLink).toHaveAttribute('href', '/search')
  })
})
