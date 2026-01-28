import { test, expect } from '@playwright/test'

test.describe('Authentication Page', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Should show Mission Control in the card title
    await expect(page.locator('[data-slot="card-title"]')).toBeVisible()
  })

  test('should show email input on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Should have email input
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should show submit button on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Should have a submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('dashboard should be accessible with auth bypass', async ({ page }) => {
    // With BYPASS_AUTH=true, dashboard should load without login
    await page.goto('/')
    
    // Should NOT redirect to login
    await page.waitForTimeout(1000)
    expect(page.url()).not.toContain('/login')
    
    // Should show kanban board - look for column heading
    await expect(page.locator('h2:has-text("Backlog")')).toBeVisible()
  })
})
