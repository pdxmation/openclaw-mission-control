'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { validateApprovalToken, markTokenAsUsed } from '@/lib/waiting-list/actions'
import { authClient } from '@/lib/auth-client'

type SignupStep = 'validating' | 'invalid' | 'form' | 'otp' | 'success'

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [step, setStep] = useState<SignupStep>('validating')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // From token validation
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  // OTP state
  const [otp, setOtp] = useState('')

  useEffect(() => {
    if (!token) {
      setStep('invalid')
      setError('No signup token provided. Please use the link from your approval email.')
      return
    }

    const doValidate = async () => {
      const result = await validateApprovalToken(token)

      if (result.success && result.data) {
        setEmail(result.data.email)
        setName(result.data.name)
        setStep('form')
      } else {
        setStep('invalid')
        setError(result.error || 'Invalid or expired token')
      }
    }

    doValidate()
  }, [token])

  const validateToken = async () => {
    const result = await validateApprovalToken(token!)

    if (result.success && result.data) {
      setEmail(result.data.email)
      setName(result.data.name)
      setStep('form')
    } else {
      setStep('invalid')
      setError(result.error || 'Invalid or expired token')
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Send OTP for verification
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification'
      })

      if (otpError) {
        setError(otpError.message || 'Failed to send verification code')
        return
      }

      setStep('otp')
    } catch {
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify OTP and create account
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email,
        otp
      })

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code')
        return
      }

      // Mark the token as used
      if (token) {
        await markTokenAsUsed(token)
      }

      setStep('success')

      // Redirect to app after short delay
      setTimeout(() => {
        router.push('/tasks')
      }, 2000)
    } catch {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'validating') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Validating your invitation...</p>
        </CardContent>
      </Card>
    )
  }

  if (step === 'invalid') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Invalid Invitation</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <Link href="/waitlist">
              <Button className="w-full">Join Waitlist</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full">Already have an account? Log in</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to Mission Control!</h2>
          <p className="text-muted-foreground mb-4">
            Your account is ready. You have a 7-day free trial.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  if (step === 'otp') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full px-3 py-2 border rounded-md bg-background text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Complete Signup'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleCreateAccount}
              disabled={loading}
            >
              Resend code
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Form step
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete your signup</CardTitle>
        <CardDescription>
          Just one more step to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the email from your waitlist application
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our Terms of Service.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
