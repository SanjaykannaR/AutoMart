/**
 * Admin Banners Tests
 * Tests banner CRUD, reorder, and toggle.
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@automart.com'
const ADMIN_PASSWORD = 'Admin@12345'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByPlaceholder('admin@automart.com').fill(ADMIN_EMAIL)
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
}

/** Fill the banner modal form — inputs use placeholder text (no label-for association) */
async function fillBannerForm(page: import('@playwright/test').Page, data: {
  headline?: string; subtitle?: string; badge?: string; cta?: string; link?: string; image?: string
} = {}) {
  await page.getByPlaceholder('Premium Brake Pads').fill(data.headline ?? 'Test Banner Playwright')
  await page.getByPlaceholder('OEM-quality stopping power').fill(data.subtitle ?? 'Automated test banner')
  await page.getByPlaceholder('NEW ARRIVAL').fill(data.badge ?? 'Test')
  await page.getByPlaceholder('Shop Now').fill(data.cta ?? 'Click Me')
  await page.getByPlaceholder('/products/...').fill(data.link ?? '/search')
  await page.getByPlaceholder('https://...').fill(data.image ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&h=600&fit=crop')
}

/** Click the save button inside the modal (not the header "Create Banner" button) */
async function clickModalSave(page: import('@playwright/test').Page) {
  const modal = page.locator('.fixed.inset-0.z-50')
  const saveBtn = modal.getByRole('button', { name: /create banner|update banner/i })
  await saveBtn.click()
}

test.describe('Admin Banners', () => {
  test('banners page loads with heading', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')
    await expect(page.getByText('Ads Banners')).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ create banner/i })).toBeVisible()
  })

  test('banners page shows existing banners', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')
    // We created 6 banners in the DB
    await expect(page.getByText('Mega Brake Sale')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Engine Oil Festival')).toBeVisible()
  })

  test('create banner opens modal form', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')
    await page.getByRole('button', { name: /\+ create banner/i }).click()
    // Modal heading appears, and placeholder inputs become visible
    await expect(page.getByRole('heading', { name: 'Create Banner' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByPlaceholder('Premium Brake Pads')).toBeVisible()
    await expect(page.getByPlaceholder('OEM-quality stopping power')).toBeVisible()
  })

  test('create banner and save', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')

    const uniqueName = `Created ${Date.now()}`
    await page.getByRole('button', { name: /\+ create banner/i }).click()
    await fillBannerForm(page, { headline: uniqueName })
    await clickModalSave(page)

    // Should appear in the list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 })
  })

  test('edit banner opens modal with pre-filled data', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')
    await expect(page.getByText('Mega Brake Sale')).toBeVisible({ timeout: 10000 })

    // Click edit on first banner
    const editButtons = page.locator('button[title="Edit banner"]')
    await editButtons.first().click()

    // Modal heading + pre-filled headline
    await expect(page.getByRole('heading', { name: 'Edit Banner' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByPlaceholder('Premium Brake Pads')).toHaveValue('Mega Brake Sale')
  })

  test('toggle banner active status', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')
    await expect(page.getByText('Mega Brake Sale')).toBeVisible({ timeout: 10000 })

    // Find the toggle button for the first banner
    const toggleButtons = page.locator('button[title*="Active"], button[title*="Inactive"]')
    const firstToggle = toggleButtons.first()
    await firstToggle.click()
    // Toggle should change state (no error)
    await page.waitForTimeout(1000)
  })

  test('delete banner via confirmation', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/banners')

    // Unique name to avoid collision with leftover banners from prior runs
    const uniqueName = `Delete Me ${Date.now()}`
    await page.getByRole('button', { name: /\+ create banner/i }).click()
    await fillBannerForm(page, { headline: uniqueName })
    await clickModalSave(page)
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 })

    // Find delete button for test banner row
    const testBanner = page.locator('.space-y-3 > div').filter({ hasText: uniqueName }).first()
    const deleteBtn = testBanner.locator('button[title="Delete banner"]')
    await deleteBtn.click()

    // Confirm deletion in confirmation modal
    const confirmModal = page.locator('.fixed.inset-0.z-50')
    await confirmModal.getByRole('button', { name: /delete|confirm|yes/i }).first().click()

    // Should be removed from the banner list (use exact match to skip confirm dialog text)
    await expect(page.getByText(uniqueName, { exact: true })).toBeHidden({ timeout: 10000 })
  })
})
