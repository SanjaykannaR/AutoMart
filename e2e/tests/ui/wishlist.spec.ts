import { test, expect } from '@playwright/test'

test.describe('Wishlist Page', () => {
  test('shows empty state when no items', async ({ page }) => {
    await page.goto('/wishlist')
    await page.evaluate(() => localStorage.removeItem('wishlist'))
    await page.reload()
    await expect(page.getByText(/wishlist/i).first()).toBeVisible()
    await expect(page.getByText(/no items/i).or(page.getByText(/empty/i))).toBeVisible()
  })

  test('shows wishlist items after adding from product page', async ({ page }) => {
    // Seed wishlist via localStorage
    await page.goto('/wishlist')
    await page.evaluate(() => {
      localStorage.setItem('wishlist', JSON.stringify([
        { id: '1', name: 'Ceramic Brake Pads', price: 45.99, image: '', category: 'Brakes' },
      ]))
    })
    await page.reload()
    await expect(page.getByText('Ceramic Brake Pads')).toBeVisible()
    await expect(page.getByText('$45.99')).toBeVisible()
  })

  test('can remove item from wishlist', async ({ page }) => {
    await page.goto('/wishlist')
    await page.evaluate(() => {
      localStorage.setItem('wishlist', JSON.stringify([
        { id: '1', name: 'Test Part', price: 19.99, image: '', category: 'Test' },
      ]))
    })
    await page.reload()
    await expect(page.getByText('Test Part')).toBeVisible()
    // Click remove button
    await page.getByRole('button', { name: /remove/i }).or(page.locator('button').filter({ has: page.locator('svg') }).last()).click()
    await page.reload()
    // Should show empty state
    await expect(page.getByText('Test Part')).not.toBeVisible()
  })

  test('has browse parts link in empty state', async ({ page }) => {
    await page.goto('/wishlist')
    await page.evaluate(() => localStorage.removeItem('wishlist'))
    await page.reload()
    await expect(page.getByRole('main').getByRole('link', { name: /browse/i })).toBeVisible()
  })
})
