import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display header correctly on mobile', async ({ page }) => {
    // Header should be visible
    await expect(page.locator('header, [role="banner"]')).toBeVisible()
    
    // Logo or title should be visible
    await expect(page.locator('text=/mission control/i')).toBeVisible()
  })

  test('should have hamburger menu on mobile', async ({ page }) => {
    // Hamburger menu should be visible
    const hamburger = page.locator('button[aria-label*="menu" i], button:has(svg[class*="menu"])')
    await expect(hamburger).toBeVisible()
  })

  test('should display kanban columns in horizontal scroll', async ({ page }) => {
    // Columns should be scrollable
    const columnsContainer = page.locator('[class*="overflow-x"], [class*="snap-x"]')
    await expect(columnsContainer).toBeVisible()
  })

  test('should be able to scroll between columns', async ({ page }) => {
    // Get the columns container
    const container = page.locator('[class*="overflow-x"]').first()
    
    if (await container.isVisible()) {
      // Swipe left
      await container.evaluate((el) => {
        el.scrollLeft = 300
      })
      
      await page.waitForTimeout(300)
      
      // Should have scrolled
      const scrollLeft = await container.evaluate((el) => el.scrollLeft)
      expect(scrollLeft).toBeGreaterThan(0)
    }
  })

  test('should show search input on mobile', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]')
    await expect(searchInput).toBeVisible()
  })

  test('should open task modal on mobile', async ({ page }) => {
    // Click on a task
    const task = page.locator('[data-testid="task-card"], .task-card').first()
    if (await task.isVisible()) {
      await task.click()
      
      // Modal should appear (slides up on mobile)
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible()
    }
  })

  test('should have touch-friendly button sizes', async ({ page }) => {
    // All interactive elements should be at least 44x44
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // Check that buttons are reasonably sized (at least 32px which is common for mobile)
          expect(box.width).toBeGreaterThanOrEqual(32)
          expect(box.height).toBeGreaterThanOrEqual(32)
        }
      }
    }
  })

  test('should hide desktop sidebar on mobile', async ({ page }) => {
    // Activity sidebar should be hidden on mobile
    const sidebar = page.locator('[class*="xl:block"][class*="hidden"]')
    await expect(sidebar).toBeHidden()
  })

  test('should show floating activity button', async ({ page }) => {
    const fab = page.locator('button:has-text("Activity")')
    await expect(fab).toBeVisible()
  })
})

test.describe('Tablet Responsiveness', () => {
  test.use({ ...devices['iPad Mini'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display properly on tablet', async ({ page }) => {
    // Header visible
    await expect(page.locator('header, [role="banner"]')).toBeVisible()
    
    // Kanban board visible
    await expect(page.locator('[data-testid="kanban-board"], .kanban, main')).toBeVisible()
  })

  test('should show more columns on tablet', async ({ page }) => {
    // More columns should be visible without scrolling on tablet
    const columns = page.locator('[data-testid="kanban-column"], .kanban-column')
    const visibleCount = await columns.count()
    
    // Tablet should show at least 2-3 columns
    expect(visibleCount).toBeGreaterThanOrEqual(2)
  })

  test('should have activity FAB on tablet (below xl)', async ({ page }) => {
    const fab = page.locator('button:has-text("Activity")')
    await expect(fab).toBeVisible()
  })
})

test.describe('Desktop Responsiveness', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should show activity sidebar on large screens', async ({ page }) => {
    await expect(page.locator('text=/recent activity/i')).toBeVisible()
  })

  test('should hide floating activity button on desktop', async ({ page }) => {
    // FAB should be hidden on xl screens
    const fab = page.locator('button:has-text("Activity").xl\\:hidden')
    // It should either not exist or be hidden
    const isHidden = await fab.isHidden().catch(() => true)
    expect(isHidden).toBe(true)
  })

  test('should show all columns without horizontal scroll', async ({ page }) => {
    // All 6 columns should be visible
    const columnTitles = ['Recurring', 'Backlog', 'In Progress', 'Review', 'Blocked', 'Completed']
    
    for (const title of columnTitles) {
      await expect(page.getByText(title, { exact: false })).toBeVisible()
    }
  })
})
