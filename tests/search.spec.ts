import { test, expect } from '@playwright/test'

test.describe('Semantic Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await expect(searchInput).toBeVisible()
  })

  test('should focus search with keyboard shortcut', async ({ page }) => {
    // Press Cmd/Ctrl + K
    await page.keyboard.press('Meta+k')
    
    // Search input should be focused
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await expect(searchInput).toBeFocused()
  })

  test('should show results when typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    
    // Type a search query
    await searchInput.fill('email')
    
    // Wait for debounce and results
    await page.waitForTimeout(500)
    
    // Results dropdown should appear
    const resultsDropdown = page.locator('[data-testid="search-results"], .search-results, [class*="dropdown"]')
    await expect(resultsDropdown).toBeVisible({ timeout: 5000 })
  })

  test('should show similarity percentage in results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('email')
    
    await page.waitForTimeout(500)
    
    // Should show match percentage
    await expect(page.locator('text=/\\d+%\\s*match/i')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate results with keyboard', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('task')
    
    await page.waitForTimeout(500)
    
    // Press arrow down
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    
    // Should still have search open
    const resultsDropdown = page.locator('[data-testid="search-results"], .search-results, [class*="dropdown"]')
    await expect(resultsDropdown).toBeVisible()
  })

  test('should open task modal when selecting search result', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('mission')
    
    await page.waitForTimeout(500)
    
    // Press Enter to select first result
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    // Task modal should open
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible({ timeout: 5000 })
  })

  test('should close search with Escape', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('test')
    
    await page.waitForTimeout(500)
    
    // Press Escape
    await page.keyboard.press('Escape')
    
    // Results should close
    const resultsDropdown = page.locator('[data-testid="search-results"], .search-results')
    await expect(resultsDropdown).toBeHidden({ timeout: 3000 })
  })

  test('should clear search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('test query')
    
    // Find and click clear button
    const clearButton = page.locator('button[aria-label*="clear" i], button:has(svg[class*="x"])')
    if (await clearButton.isVisible()) {
      await clearButton.click()
      
      // Input should be empty
      await expect(searchInput).toHaveValue('')
    }
  })

  test('should show no results message', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    
    // Search for something that won't match
    await searchInput.fill('xyznonexistent12345')
    
    await page.waitForTimeout(500)
    
    // Should show no results message
    await expect(page.locator('text=/no.*found|no results/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show AI-powered indicator', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    await searchInput.fill('email')
    
    await page.waitForTimeout(500)
    
    // Should show AI indicator
    await expect(page.locator('text=/ai.*powered|semantic/i')).toBeVisible({ timeout: 5000 })
  })
})
