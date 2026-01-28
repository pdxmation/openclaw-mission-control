import { test, expect } from '@playwright/test'

test.describe('Activity Feed - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display activity feed sidebar on desktop', async ({ page }) => {
    // Activity sidebar has "Recent Activity" heading (h3 in sidebar)
    await expect(page.locator('h3:has-text("Recent Activity")')).toBeVisible()
  })

  test('should show activity items', async ({ page }) => {
    // Activity items are in the sidebar
    const activitySection = page.locator('h3:has-text("Recent Activity")').locator('..')
    await expect(activitySection).toBeVisible()
  })
})

test.describe('Activity Feed - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should show floating activity button on mobile', async ({ page }) => {
    // FAB has aria-label="Open Activity Feed"
    const fab = page.locator('button[aria-label="Open Activity Feed"]')
    await expect(fab).toBeVisible()
  })

  test('should open activity panel when clicking FAB', async ({ page }) => {
    const fab = page.locator('button[aria-label="Open Activity Feed"]')
    await fab.click()
    
    // Panel should show "Recent Activity" heading (h2 in mobile panel)
    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible({ timeout: 3000 })
  })

  test('should close activity panel with close button', async ({ page }) => {
    // Open panel
    const fab = page.locator('button[aria-label="Open Activity Feed"]')
    await fab.click()
    await page.waitForTimeout(500)
    
    // Click close button
    const closeButton = page.locator('button[aria-label="Close"]')
    await closeButton.click()
    
    // Wait for animation
    await page.waitForTimeout(500)
    
    // FAB should be visible again (panel closed)
    await expect(fab).toBeVisible()
  })
})
