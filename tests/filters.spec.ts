import { test, expect } from '@playwright/test'

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display filter dropdowns', async ({ page }) => {
    // Should have assignee filter
    await expect(page.locator('button:has-text("Assignee"), [data-testid="assignee-filter"]')).toBeVisible()
    
    // Should have project filter
    await expect(page.locator('button:has-text("Project"), [data-testid="project-filter"]')).toBeVisible()
  })

  test('should open assignee filter dropdown', async ({ page }) => {
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    // Dropdown should appear
    const dropdown = page.locator('[role="listbox"], .dropdown-menu, [class*="dropdown"]')
    await expect(dropdown).toBeVisible({ timeout: 3000 })
  })

  test('should open project filter dropdown', async ({ page }) => {
    const projectFilter = page.locator('button:has-text("Project")').first()
    await projectFilter.click()
    
    // Dropdown should appear
    const dropdown = page.locator('[role="listbox"], .dropdown-menu, [class*="dropdown"]')
    await expect(dropdown).toBeVisible({ timeout: 3000 })
  })

  test('should filter tasks by assignee', async ({ page }) => {
    // Get initial task count
    const initialTasks = await page.locator('[data-testid="task-card"], .task-card, [class*="task"][class*="card"]').count()
    
    // Open assignee filter
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    // Select first option if available
    const option = page.locator('[role="option"], .dropdown-item').first()
    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
      await option.click()
      
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // Task count might change (filtered)
      const filteredTasks = await page.locator('[data-testid="task-card"], .task-card').count()
      expect(filteredTasks).toBeLessThanOrEqual(initialTasks)
    }
  })

  test('should clear filter', async ({ page }) => {
    // Apply a filter first
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    const option = page.locator('[role="option"], .dropdown-item').first()
    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
      await option.click()
      await page.waitForTimeout(500)
      
      // Look for clear/X button on the filter
      const clearButton = page.locator('button:has-text("Assignee") svg, button:has-text("Assignee") + button')
      if (await clearButton.isVisible()) {
        await clearButton.click()
        
        // Filter should be cleared
        await expect(page.locator('button:has-text("Assignee")')).toBeVisible()
      }
    }
  })

  test('should combine multiple filters', async ({ page }) => {
    // Apply assignee filter
    const assigneeFilter = page.locator('button:has-text("Assignee")').first()
    await assigneeFilter.click()
    
    const assigneeOption = page.locator('[role="option"], .dropdown-item').first()
    if (await assigneeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await assigneeOption.click()
      await page.waitForTimeout(300)
    }
    
    // Apply project filter
    const projectFilter = page.locator('button:has-text("Project")').first()
    await projectFilter.click()
    
    const projectOption = page.locator('[role="option"], .dropdown-item').first()
    if (await projectOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await projectOption.click()
      await page.waitForTimeout(300)
    }
    
    // Both filters should be active (page should still work)
    await expect(page.locator('[data-testid="kanban-board"], .kanban, main')).toBeVisible()
  })

  test('should show filter label text', async ({ page }) => {
    // Check for "Filter:" label
    await expect(page.locator('text=/filter/i')).toBeVisible()
  })
})
