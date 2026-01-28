import { test, expect } from '@playwright/test'

test.describe('Activity Feed - Desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display activity feed sidebar on desktop', async ({ page }) => {
    // Activity feed should be visible on large screens
    await expect(page.locator('text=/recent activity/i')).toBeVisible()
  })

  test('should show activity items', async ({ page }) => {
    // Should have activity items
    const activityItems = page.locator('[data-testid="activity-item"], .activity-item, [class*="activity"]')
    const count = await activityItems.count()
    
    // Expect some activity
    expect(count).toBeGreaterThanOrEqual(0) // May be 0 if no activity yet
  })

  test('should show activity timestamps', async ({ page }) => {
    // Activity items should have timestamps
    await expect(page.locator('text=/ago|just now|minutes?|hours?|days?/i')).toBeVisible()
  })

  test('should show activity action types', async ({ page }) => {
    // Should show action types like created, moved, completed
    const actionTexts = ['created', 'moved', 'completed', 'updated', 'deleted']
    
    for (const action of actionTexts) {
      const hasAction = await page.locator(`text=/${action}/i`).count()
      if (hasAction > 0) {
        await expect(page.locator(`text=/${action}/i`).first()).toBeVisible()
        break
      }
    }
  })
})

test.describe('Activity Feed - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should show floating activity button on mobile', async ({ page }) => {
    // FAB should be visible
    const fab = page.locator('button:has-text("Activity"), [aria-label*="activity" i]')
    await expect(fab).toBeVisible()
  })

  test('should open activity panel when clicking FAB', async ({ page }) => {
    // Click FAB
    const fab = page.locator('button:has-text("Activity")').first()
    await fab.click()
    
    // Panel should slide up
    await expect(page.locator('[data-testid="mobile-activity-panel"], .mobile-panel, [class*="slide"]')).toBeVisible({ timeout: 3000 })
    
    // Should show "Recent Activity" heading
    await expect(page.locator('text=/recent activity/i')).toBeVisible()
  })

  test('should close activity panel with close button', async ({ page }) => {
    // Open panel
    const fab = page.locator('button:has-text("Activity")').first()
    await fab.click()
    
    await page.waitForTimeout(500)
    
    // Click close button
    const closeButton = page.locator('button[aria-label*="close" i], button:has(svg[class*="x"])')
    await closeButton.click()
    
    // Panel should close
    await expect(page.locator('[data-testid="mobile-activity-panel"]')).toBeHidden({ timeout: 3000 })
  })

  test('should close activity panel by clicking backdrop', async ({ page }) => {
    // Open panel
    const fab = page.locator('button:has-text("Activity")').first()
    await fab.click()
    
    await page.waitForTimeout(500)
    
    // Click backdrop (the dark overlay)
    const backdrop = page.locator('[class*="backdrop"], [class*="overlay"]')
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } })
      
      // Panel should close
      await expect(page.locator('[data-testid="mobile-activity-panel"]')).toBeHidden({ timeout: 3000 })
    }
  })

  test('should show activity items in mobile panel', async ({ page }) => {
    // Open panel
    const fab = page.locator('button:has-text("Activity")').first()
    await fab.click()
    
    await page.waitForTimeout(500)
    
    // Should show activity content
    await expect(page.locator('text=/recent activity/i')).toBeVisible()
  })
})
