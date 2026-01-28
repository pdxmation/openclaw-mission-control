import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: false // Disabled - using OTP only
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      disableSignUp: true, // Only allow existing users
      async sendVerificationOTP({ email, otp, type }) {
        // Log to console in dev, send email in production
        if (process.env.NODE_ENV === "development") {
          console.log(`\n📧 OTP for ${email}: ${otp} (type: ${type})\n`)
        }
        
        // Send via Resend if configured
        if (process.env.RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Mission Control <noreply@example.com>",
              to: email,
              subject: `Your Mission Control login code: ${otp}`,
              text: `Your one-time login code is: ${otp}\n\nThis code expires in 5 minutes.`,
              html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
                  <h2>Mission Control Login</h2>
                  <p>Your one-time login code is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px;">
                    ${otp}
                  </div>
                  <p style="color: #666; margin-top: 20px;">This code expires in 5 minutes.</p>
                </div>
              `
            })
          })
        }
      }
    })
  ],
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BETTER_AUTH_URL || ""
  ].filter(Boolean)
})

export type Session = typeof auth.$Infer.Session
