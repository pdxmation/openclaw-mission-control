import { test, expect } from '@playwright/test'

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display assignee filter button', async ({ page }) => {
    const assigneeFilter = page.locator('button:has-text("Assignee")')
    await expect(assigneeFilter).toBeVisible()
  })

  test('should display project filter button', async ({ page }) => {
    const projectFilter = page.locator('button:has-text("Project")')
    await expect(projectFilter).toBeVisible()
  })

  test('should open assignee filter dropdown', async ({ page }) => {
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    await page.waitForTimeout(300)
    
    // Dropdown appears - it's positioned absolute below the button
    const dropdown = page.locator('.absolute.top-full.left-0')
    await expect(dropdown).toBeVisible({ timeout: 3000 })
  })

  test('should open project filter dropdown', async ({ page }) => {
    const projectFilter = page.locator('button:has-text("Project")').first()
    await projectFilter.click()
    
    await page.waitForTimeout(300)
    
    const dropdown = page.locator('.absolute.top-full.left-0')
    await expect(dropdown).toBeVisible({ timeout: 3000 })
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    await page.waitForTimeout(300)
    
    // Click on the page body
    await page.locator('header').click()
    
    await page.waitForTimeout(300)
    
    // Dropdown should close
    const dropdown = page.locator('.absolute.top-full.left-0')
    await expect(dropdown).toBeHidden({ timeout: 3000 })
  })
})
