import { test, expect } from '@playwright/test'
import { SearchPage } from '../../pages/SearchPage'

test.describe('Product Search', () => {
  test('search page loads with input and filters', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await expect(searchPage.searchInput).toBeVisible()
    await expect(searchPage.voiceButton).toBeVisible()
    await expect(searchPage.imageButton).toBeVisible()
  })

  test('search page has category filter', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await expect(searchPage.categoryFilter).toBeVisible()
  })

  test('search accepts input and does not crash', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.search('brake')
    // Verify page is still functional after search
    await expect(searchPage.searchInput).toBeVisible()
  })

  test('autocomplete input accepts typing', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByPlaceholder(/search/i)
    await input.fill('eng')
    await expect(input).toHaveValue('eng')
  })

  test('category filter can be changed', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.categoryFilter.selectOption('Brake System')
    await expect(searchPage.categoryFilter).toHaveValue('Brake System')
  })

  test('clear filters resets category', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.categoryFilter.selectOption('Engine Parts')
    const clearButton = page.getByRole('button', { name: /clear filters/i })
    await clearButton.click()
    await expect(searchPage.categoryFilter).toHaveValue('')
  })
})
