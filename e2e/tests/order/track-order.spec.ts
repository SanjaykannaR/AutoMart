import { test, expect } from '@playwright/test'

test.describe('Order Tracking', () => {
  test('orders page shows empty state', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByText('No orders yet')).toBeVisible()
  })
})
