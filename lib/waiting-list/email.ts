const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Mission Control <noreply@example.com>'

export interface ApprovalEmailData {
  email: string
  name: string
  token: string
}

/**
 * Send approval email with signup link
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
  const signupUrl = `${APP_URL}/signup?token=${data.token}`

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📧 Approval email for ${data.email}`)
    console.log(`   Signup URL: ${signupUrl}\n`)
  }

  // Send via Resend if configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email not sent')
    return process.env.NODE_ENV === 'development' // Return true in dev for testing
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.email,
        subject: 'You\'re in! Complete your Mission Control signup',
        text: `Hi ${data.name},

Great news! Your application to Mission Control has been approved.

Click the link below to complete your signup and start your 7-day free trial:

${signupUrl}

This link will expire in 7 days.

Welcome aboard!
The Mission Control Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin-bottom: 16px;">
      <span style="color: white; font-weight: bold; font-size: 20px; line-height: 48px;">MC</span>
    </div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">You're in!</h1>
  </div>

  <p style="margin-bottom: 16px;">Hi ${data.name},</p>

  <p style="margin-bottom: 16px;">Great news! Your application to Mission Control has been approved.</p>

  <p style="margin-bottom: 24px;">Click the button below to complete your signup and start your <strong>7-day free trial</strong>:</p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Complete Signup
    </a>
  </div>

  <p style="margin-bottom: 16px; color: #666; font-size: 14px;">
    Or copy this link: <a href="${signupUrl}" style="color: #6366f1;">${signupUrl}</a>
  </p>

  <p style="margin-bottom: 16px; color: #666; font-size: 14px;">This link will expire in 7 days.</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">

  <p style="color: #666; font-size: 14px; margin: 0;">
    Welcome aboard!<br>
    The Mission Control Team
  </p>
</body>
</html>
`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send approval email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending approval email:', error)
    return false
  }
}

export interface RejectionEmailData {
  email: string
  name: string
}

/**
 * Send rejection email
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<boolean> {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📧 Rejection email for ${data.email}\n`)
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email not sent')
    return process.env.NODE_ENV === 'development'
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.email,
        subject: 'Mission Control Waitlist Update',
        text: `Hi ${data.name},

Thank you for your interest in Mission Control.

Unfortunately, we're unable to approve your application at this time. This may be due to capacity limits or other factors.

We appreciate your understanding and wish you the best.

The Mission Control Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin-bottom: 16px;">
      <span style="color: white; font-weight: bold; font-size: 20px; line-height: 48px;">MC</span>
    </div>
  </div>

  <p style="margin-bottom: 16px;">Hi ${data.name},</p>

  <p style="margin-bottom: 16px;">Thank you for your interest in Mission Control.</p>

  <p style="margin-bottom: 16px;">Unfortunately, we're unable to approve your application at this time. This may be due to capacity limits or other factors.</p>

  <p style="margin-bottom: 16px;">We appreciate your understanding and wish you the best.</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">

  <p style="color: #666; font-size: 14px; margin: 0;">
    The Mission Control Team
  </p>
</body>
</html>
`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send rejection email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return false
  }
}
