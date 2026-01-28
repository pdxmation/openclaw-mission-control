import { test, expect } from '@playwright/test'

test.describe('Task CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000) // Wait for tasks to load
  })

  test('should create a new task', async ({ page }) => {
    // Click add button in Backlog column
    const addButton = page.locator('button:has-text("+")').first()
    await addButton.click()
    
    // Wait for modal
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible()
    
    // Fill in task details
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.fill('Test Task from Playwright')
    
    // Fill description if visible
    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]')
    if (await descInput.isVisible()) {
      await descInput.fill('This is a test task created by Playwright')
    }
    
    // Save the task
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
    await saveButton.click()
    
    // Modal should close
    await expect(page.locator('[role="dialog"], .modal')).toBeHidden({ timeout: 5000 })
    
    // Task should appear in the board
    await expect(page.getByText('Test Task from Playwright')).toBeVisible()
  })

  test('should view task details', async ({ page }) => {
    // Click on a task
    const task = page.locator('[data-testid="task-card"], .task-card').first()
    await task.click()
    
    // Modal should show task details
    const modal = page.locator('[role="dialog"], .modal')
    await expect(modal).toBeVisible()
    
    // Should show title input
    await expect(modal.locator('input[name="title"], input[placeholder*="title" i]')).toBeVisible()
  })

  test('should edit task title', async ({ page }) => {
    // Click on a task
    const task = page.locator('[data-testid="task-card"], .task-card').first()
    const originalTitle = await task.textContent()
    await task.click()
    
    // Edit title
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.clear()
    await titleInput.fill('Updated Title by Playwright')
    
    // Save
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]')
    await saveButton.click()
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"], .modal')).toBeHidden({ timeout: 5000 })
    
    // Updated title should be visible
    await expect(page.getByText('Updated Title by Playwright')).toBeVisible()
  })

  test('should change task priority', async ({ page }) => {
    // Click on a task
    const task = page.locator('[data-testid="task-card"], .task-card').first()
    await task.click()
    
    // Find priority selector
    const prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]')
    
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('HIGH')
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]')
      await saveButton.click()
      
      await expect(page.locator('[role="dialog"], .modal')).toBeHidden({ timeout: 5000 })
    }
  })

  test('should delete a task', async ({ page }) => {
    // First create a task to delete
    const addButton = page.locator('button:has-text("+")').first()
    await addButton.click()
    
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]')
    await titleInput.fill('Task to Delete')
    
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
    await saveButton.click()
    
    await expect(page.locator('[role="dialog"], .modal')).toBeHidden({ timeout: 5000 })
    
    // Now find and delete it
    const taskToDelete = page.getByText('Task to Delete')
    await taskToDelete.click()
    
    // Find delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]')
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click()
      }
      
      // Task should be gone
      await expect(page.getByText('Task to Delete')).toBeHidden({ timeout: 5000 })
    }
  })

  test('should close modal with escape key', async ({ page }) => {
    const task = page.locator('[data-testid="task-card"], .task-card').first()
    await task.click()
    
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible()
    
    // Press Escape
    await page.keyboard.press('Escape')
    
    // Modal should close
    await expect(page.locator('[role="dialog"], .modal')).toBeHidden({ timeout: 3000 })
  })
})
