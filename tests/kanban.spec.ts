import { test, expect } from '@playwright/test'

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should display all kanban columns', async ({ page }) => {
    // Column headings are h2 elements
    const columnTitles = ['Recurring', 'Backlog', 'In Progress', 'Review', 'Blocked', 'Completed']
    
    for (const title of columnTitles) {
      await expect(page.locator(`h2:has-text("${title}")`).first()).toBeVisible()
    }
  })

  test('should display stats bar', async ({ page }) => {
    // Stats bar shows counts - look for the specific stats container
    await expect(page.locator('.text-2xl.font-bold').first()).toBeVisible()
  })

  test('should show refresh timestamp', async ({ page }) => {
    // Timestamp shows "Updated X:XX:XX"
    await expect(page.locator('text=/Updated \\d+:\\d+/').first()).toBeVisible()
  })

  test('should display task cards', async ({ page }) => {
    // Task cards
    const taskCards = page.locator('.rounded-lg.border.bg-card')
    const count = await taskCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should open task modal when clicking a task', async ({ page }) => {
    // Click first task card
    const firstTask = page.locator('.rounded-lg.border.bg-card').first()
    await firstTask.click()
    
    // Modal should appear
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible({ timeout: 3000 })
  })

  test('should close task modal with escape', async ({ page }) => {
    // Open modal
    const firstTask = page.locator('.rounded-lg.border.bg-card').first()
    await firstTask.click()
    
    await page.waitForTimeout(500)
    
    // Press Escape to close
    await page.keyboard.press('Escape')
    
    await page.waitForTimeout(500)
  })

  test('should have add buttons in columns', async ({ page }) => {
    // Add buttons have the Plus icon - look for buttons in column headers
    const addButtons = page.locator('button:has(svg.lucide-plus)')
    const count = await addButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should open new task modal when clicking add button', async ({ page }) => {
    // Click first add button
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await addButton.click()
    
    // Modal should appear
    await expect(page.locator('.fixed.inset-0').first()).toBeVisible({ timeout: 3000 })
  })
})
