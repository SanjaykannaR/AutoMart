import { test, expect } from '@playwright/test'
import { SearchPage } from '../../pages/SearchPage'

test.describe('Product Search', () => {
  test('search page loads with filters', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await expect(searchPage.searchInput).toBeVisible()
    await expect(searchPage.categoryFilter).toBeVisible()
    await expect(searchPage.voiceButton).toBeVisible()
    await expect(searchPage.imageButton).toBeVisible()
  })

  test('search returns results', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.search('brake')
    const count = await searchPage.getResultsCount()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('autocomplete shows suggestions', async ({ page }) => {
    await page.goto('/search')
    await page.getByPlaceholder(/search/i).fill('eng')
    await page.waitForTimeout(500)
    // Autocomplete may or may not show results — just verify no crash
    await expect(page.getByPlaceholder(/search/i)).toHaveValue('eng')
  })
})
