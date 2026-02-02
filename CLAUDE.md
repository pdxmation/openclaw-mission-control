# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mission Control is an AI-powered task management dashboard with Second Brain document viewer. Built with Next.js 16, Prisma, PostgreSQL, and Better Auth.

**Live:** https://moltmc.app

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

### Database Commands

```bash
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate           # Backup + migrate (dev)
pnpm db:migrate:deploy    # Backup + migrate (production)
pnpm db:seed              # Seed initial data
pnpm db:studio            # Open Prisma Studio GUI
pnpm db:backup            # Manual database backup
```

### Testing (Playwright E2E)

```bash
pnpm test                 # Run all tests
pnpm test:ui              # Run with Playwright UI
pnpm test:headed          # Run in headed browser
pnpm test:debug           # Debug tests
pnpm test:api             # API endpoint tests only
```

Tests require the dev server running. Auth state is stored in `tests/.auth/state.json`.

## Architecture

### Route Groups (App Router)

- `(auth)/` - Public authentication (login, signup, verify-email)
- `(marketing)/` - Public pages (home, pricing, waitlist)
- `(app)/` - Protected application (tasks, docs, people, settings)
- `(admin)/` - Admin-only routes (dashboard, waiting list management)
- `api/` - REST API endpoints

### Authentication (Better Auth)

- **Email OTP only** - No passwords, 6-digit codes with 5-minute expiration
- **Session cookie:** `better-auth.session_token`
- **Config:** `lib/auth.ts`

Server-side session access:
```typescript
import { getCurrentSession, getCurrentUser } from "@/lib/admin/auth"
const session = await getCurrentSession()
const user = await getCurrentUser()
```

API route authorization:
```typescript
import { authorizeAndGetUserId } from "@/lib/api-auth"
const userId = await authorizeAndGetUserId(request)
```

### Multi-Tenant Data Model

All user-scoped resources have a `userId` field. Every query must filter by the authenticated user's ID:
- Tasks, Subtasks, Projects, Labels, Documents, ActivityLog, ApiKey

### API Authentication

Three methods supported (checked in order):
1. **User API keys** - Personal tokens prefixed with `mc_` (managed in Settings)
2. **Legacy API token** - Global `API_TOKEN` env var
3. **Session cookies** - Better Auth session validation

### Middleware (proxy.ts)

Edge middleware for route protection. Cannot access database directly.
- Public routes: `/`, `/home`, `/pricing`, `/waitlist`, `/login`, `/signup`, `/api/auth`, `/api/waiting-list`
- Protected routes redirect to `/login?callbackUrl=...` if no session cookie

### Vector Embeddings

Semantic search via OpenAI embeddings (`text-embedding-3-small`) stored in pgvector.
- Auto-embeds on task creation
- Search endpoint: `GET /api/tasks/search?q=query`
- Implementation: `lib/embeddings.ts`

## Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Better Auth configuration |
| `lib/admin/auth.ts` | Session/user helpers for server components |
| `lib/api-auth.ts` | API route authorization |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/embeddings.ts` | Vector embedding generation |
| `lib/stripe/stripe.ts` | Stripe subscription service |
| `proxy.ts` | Edge middleware for route protection |
| `prisma/schema.prisma` | Database schema |

## Database

PostgreSQL 17+ with pgvector extension. Key models:

- **User** - Multi-tenant owner with subscription/trial tracking
- **Task** - Core entity with status, priority, assignments
- **Document** - Second Brain notes/journals
- **ActivityLog** - Task action audit trail
- **WaitingList** - Signup approval flow

Task statuses: `RECURRING`, `IN_PROGRESS`, `BACKLOG`, `REVIEW`, `COMPLETED`, `BLOCKED`
Priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

## Subscription System

- **7-day trial** on account creation
- **Early Adopter:** $9/mo (first 200 users)
- **Regular:** $19/mo
- **Yearly:** 20% discount

Webhook endpoint: `POST /api/stripe/webhook`

## Environment Variables

Required variables (see `.env.example`):

```bash
DATABASE_URL              # PostgreSQL with pgvector
NEXT_PUBLIC_APP_URL       # Application URL
BETTER_AUTH_SECRET        # Session encryption
BETTER_AUTH_URL           # Auth service URL
ADMIN_EMAIL               # Auto-admin user
API_TOKEN                 # Legacy API token
RESEND_API_KEY            # Email service
STRIPE_SECRET_KEY         # Payment processing
OPENAI_API_KEY            # Semantic search (optional)
```

## UI Stack

- **Tailwind CSS 4** with PostCSS
- **shadcn/ui** (new-york style) with Radix primitives
- **Lucide React** icons
- **Geist** fonts (next/font)
- **Dark mode** default

Class utility: `cn()` from `lib/utils` (clsx + tailwind-merge)

## Backup System

Automatic backups before every migration. Manual backup:
```bash
pnpm db:backup
```

Backups stored in `backups/` as compressed `.sql.gz` files. Last 10 retained.

Restore:
```bash
export $(grep DATABASE_URL .env | xargs)
gunzip -c backups/backup-YYYYMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL"
```
