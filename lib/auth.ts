import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

const TRIAL_DURATION_DAYS = 7

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
      disableSignUp: false, // Allow signup for approved waitlist users
      async sendVerificationOTP({ email, otp, type }) {
        // Log to console in dev, send email in production
        if (process.env.NODE_ENV === "development") {
          console.log(`\n📧 OTP for ${email}: ${otp} (type: ${type})\n`)
        }

        // Send via Resend if configured
        if (process.env.RESEND_API_KEY) {
          const isVerification = type === "email-verification"
          const subject = isVerification
            ? `Verify your Mission Control account: ${otp}`
            : `Your Mission Control login code: ${otp}`

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Mission Control <noreply@example.com>",
              to: email,
              subject,
              text: `Your one-time code is: ${otp}\n\nThis code expires in 5 minutes.`,
              html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
                  <h2>Mission Control</h2>
                  <p>Your one-time ${isVerification ? "verification" : "login"} code is:</p>
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
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
      },
      subscriptionTier: {
        type: "string",
        defaultValue: "trial",
      },
      trialStartDate: {
        type: "date",
        defaultValue: null,
      },
      trialEndDate: {
        type: "date",
        defaultValue: null,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Set up trial when user is created
        before: async (user) => {
          const trialStartDate = new Date()
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS)

          // Check if user should be admin based on ADMIN_EMAIL
          const adminEmail = process.env.ADMIN_EMAIL
          const isAdmin = adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()

          return {
            data: {
              ...user,
              isAdmin: isAdmin || false,
              subscriptionTier: "trial",
              trialStartDate,
              trialEndDate,
            }
          }
        }
      }
    }
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
  },
})

export type Session = typeof auth.$Infer.Session
