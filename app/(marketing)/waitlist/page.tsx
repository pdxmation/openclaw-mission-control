'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { waitingListSubmitSchema, type WaitingListSubmitInput } from '@/lib/waiting-list/schemas'
import { submitWaitingListApplication } from '@/lib/waiting-list/actions'

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitingListSubmitInput>({
    resolver: zodResolver(waitingListSubmitSchema),
  })

  const onSubmit = async (data: WaitingListSubmitInput) => {
    setServerError('')

    const result = await submitWaitingListApplication(data)

    if (result.success) {
      setSubmitted(true)
    } else {
      setServerError(result.error || 'Something went wrong')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re on the list!</h2>
            <p className="text-muted-foreground mb-4">
              Thanks for your interest in Mission Control. We&apos;ll review your application
              and send you an invite link when it&apos;s your turn.
            </p>
            <p className="text-sm text-muted-foreground">
              Check your email inbox (and spam folder) for updates.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
          <CardDescription>
            Be among the first to try Mission Control. Get early access and exclusive pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-2">
                Company <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="company"
                type="text"
                {...register('company')}
                placeholder="Acme Inc."
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            <div>
              <label htmlFor="useCase" className="block text-sm font-medium mb-2">
                How will you use Mission Control? <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="useCase"
                {...register('useCase')}
                placeholder="Tell us about your workflow..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              />
              {errors.useCase && (
                <p className="text-sm text-red-500 mt-1">{errors.useCase.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-500">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            By joining, you agree to receive email updates about Mission Control.
            We respect your privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
