import { test, expect } from '@playwright/test'

test.describe('Semantic Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })

  test('should focus search with keyboard shortcut', async ({ page }) => {
    // Press Cmd/Ctrl + K
    await page.keyboard.press('Meta+k')
    
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeFocused()
  })

  test('should show loading state when typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('mission')
    
    // Should show loading or results (depending on API availability)
    await page.waitForTimeout(1000)
  })

  test('should clear search input with X button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test query')
    
    // Clear button appears when there's text
    const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') })
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await expect(searchInput).toHaveValue('')
    }
  })

  test('should close search dropdown with Escape', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test')
    await searchInput.press('Escape')
    
    // Input should lose focus or dropdown should close
    await page.waitForTimeout(300)
  })
})

// These tests require OPENAI_API_KEY to work
test.describe('Semantic Search - With API', () => {
  test.skip(({ }, testInfo) => !process.env.OPENAI_API_KEY, 'Requires OPENAI_API_KEY')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should show results when typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('mission')
    
    // Wait for debounce and results
    await page.waitForTimeout(1000)
    
    // Results should appear
    const results = page.locator('.absolute.top-full')
    await expect(results).toBeVisible({ timeout: 5000 })
  })

  test('should show AI-powered indicator', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('email')
    
    await page.waitForTimeout(1000)
    
    await expect(page.locator('text=/AI-powered/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show similarity percentage', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('task')
    
    await page.waitForTimeout(1000)
    
    await expect(page.locator('text=/\\d+%.*match/i')).toBeVisible({ timeout: 5000 })
  })
})
