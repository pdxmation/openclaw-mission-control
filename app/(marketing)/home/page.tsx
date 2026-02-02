import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  LayoutGrid,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: LayoutGrid,
    title: 'Kanban Board',
    description: 'Visual task management with drag-and-drop. Organize work the way that makes sense to you.',
  },
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Smart task suggestions, automated categorization, and intelligent search.',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Your data is encrypted and isolated. Multi-tenant architecture keeps everything private.',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Streamlined workflows and keyboard shortcuts help you focus on what matters.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your AI-Powered{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Mission Control
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Task management reimagined. Organize projects, track progress, and ship faster
              with intelligent workflows designed for modern teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/waitlist">
                <Button size="lg" className="gap-2">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              7-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to stay organized</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you manage tasks, collaborate with your team,
              and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/50 border-border/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Built for focus, designed for results
              </h2>
              <ul className="space-y-4">
                {[
                  'Intuitive kanban boards with customizable workflows',
                  'Smart search and filtering to find anything instantly',
                  'Document management for notes and knowledge',
                  'Activity tracking to see what\'s happening',
                  'API access for integrations and automation',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <LayoutGrid className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Product screenshot</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to take control?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the waitlist and be among the first to experience Mission Control.
            Early adopters get exclusive pricing.
          </p>
          <Link href="/waitlist">
            <Button size="lg" className="gap-2">
              Get Early Access
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
