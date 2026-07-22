import { test, expect } from '@playwright/test'

test.describe('Account Page', () => {
  test('shows account page with profile info', async ({ page }) => {
    await page.goto('/account')
    // Page should load with profile section
    await expect(page.getByText(/profile|account|settings/i).first()).toBeVisible()
  })

  test('shows guest profile when no user data', async ({ page }) => {
    await page.goto('/account')
    await page.evaluate(() => localStorage.removeItem('user'))
    await page.reload()
    // Should show default guest data
    await expect(page.getByText(/guest/i).first()).toBeVisible()
  })

  test('shows user profile when logged in', async ({ page }) => {
    await page.goto('/account')
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
      }))
    })
    await page.reload()
    await expect(page.getByText('Test User')).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('has navigation tabs', async ({ page }) => {
    await page.goto('/account')
    // Should have Profile, Addresses, Security tabs (or similar)
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible()
  })
})
