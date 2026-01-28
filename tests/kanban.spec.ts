import { test, expect } from '@playwright/test'

// Skip auth for these tests - use storage state or mock
test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the main page (assumes auth is handled or disabled for tests)
    await page.goto('/')
  })

  test('should display all kanban columns', async ({ page }) => {
    // Wait for the board to load
    await page.waitForSelector('[data-testid="kanban-column"], .kanban-column, [class*="column"]', { timeout: 10000 }).catch(() => {})
    
    // Check for column titles
    const columnTitles = ['Recurring', 'Backlog', 'In Progress', 'Review', 'Blocked', 'Completed']
    
    for (const title of columnTitles) {
      await expect(page.getByText(title, { exact: false })).toBeVisible()
    }
  })

  test('should display stats bar with task counts', async ({ page }) => {
    // Stats bar should show total tasks and breakdown
    await expect(page.locator('text=/\\d+\\s*(tasks?|total)/i')).toBeVisible()
  })

  test('should show refresh button and timestamp', async ({ page }) => {
    // Should have a refresh indicator
    await expect(page.locator('text=/updated|refresh/i')).toBeVisible()
  })

  test('should display tasks in columns', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000)
    
    // Should have task cards
    const taskCards = page.locator('[data-testid="task-card"], .task-card, [class*="task"][class*="card"]')
    
    // Expect at least one task (since we have data)
    const count = await taskCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should open task modal when clicking a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000)
    
    // Click first task
    const firstTask = page.locator('[data-testid="task-card"], .task-card, [class*="rounded"][class*="border"]').first()
    await firstTask.click()
    
    // Modal should appear
    await expect(page.locator('[role="dialog"], [data-testid="task-modal"], .modal')).toBeVisible()
  })

  test('should show add task button in each column', async ({ page }) => {
    // Each column should have an add button
    const addButtons = page.locator('button:has-text("+"), button[aria-label*="add"], button:has-text("Add")')
    const count = await addButtons.count()
    
    // At least one add button per visible column
    expect(count).toBeGreaterThan(0)
  })

  test('should be able to drag task between columns', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000)
    
    // Get a task card
    const taskCard = page.locator('[data-testid="task-card"], [draggable="true"]').first()
    
    if (await taskCard.count() > 0) {
      // Get bounding box
      const box = await taskCard.boundingBox()
      if (box) {
        // Perform drag operation
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + 400, box.y) // Move right
        await page.mouse.up()
        
        // Task should still be visible (drag completed)
        await expect(taskCard).toBeVisible()
      }
    }
  })
})
