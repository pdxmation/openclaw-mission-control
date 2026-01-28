import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
    
    // Should show login form
    await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
  })

  test('should show email input and submit button', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByPlaceholder(/email/i)
    const submitButton = page.getByRole('button', { name: /login|sign in|send|continue/i })
    
    await expect(emailInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByPlaceholder(/email/i)
    
    // Enter invalid email
    await emailInput.fill('invalid-email')
    await emailInput.press('Enter')
    
    // Should still be on login page (validation failed)
    await expect(page).toHaveURL(/.*login/)
  })

  test('should accept valid email and show OTP input', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByPlaceholder(/email/i)
    await emailInput.fill('test@example.com')
    
    const submitButton = page.getByRole('button', { name: /login|sign in|send|continue/i })
    await submitButton.click()
    
    // Should show OTP input or success message
    // Note: Actual OTP flow depends on backend setup
    await expect(page.locator('body')).toContainText(/code|otp|sent|check/i)
  })
})
