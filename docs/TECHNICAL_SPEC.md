# Mission Control SaaS - Technical Specification

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Multi-Tenancy Model](#multi-tenancy-model)
4. [Database Schema Changes](#database-schema-changes)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Design](#api-design)
7. [Security Considerations](#security-considerations)
8. [Infrastructure & Deployment](#infrastructure--deployment)
9. [Monitoring & Observability](#monitoring--observability)
10. [Migration Strategy](#migration-strategy)

---

## Executive Summary

Mission Control is currently a single-user task management dashboard built with Next.js, Prisma, and PostgreSQL. This specification outlines the transformation into a multi-tenant SaaS platform where each Clawdbot user receives their own isolated workspace with API access.

### Key Objectives

- **Multi-tenancy:** Complete data isolation between users
- **API-first:** Full API access for Clawdbot integration
- **Self-service:** Users can sign up, manage API keys, and configure their workspace
- **Scalable:** Architecture supports growth from 10 to 10,000+ users

### Current State

| Component | Technology | Status |
|-----------|------------|--------|
| Framework | Next.js 16 (App Router) | ✅ Production |
| Database | PostgreSQL + Prisma 7 | ✅ Production |
| Auth | Better Auth (Email OTP) | ✅ Production |
| API | REST (token-based) | ✅ Basic |
| UI | React 19 + Tailwind 4 | ✅ Production |

### Target State

| Component | Technology | Status |
|-----------|------------|--------|
| Multi-tenant DB | Row-level security | 🔄 Planned |
| API Keys | Per-user, scoped tokens | 🔄 Planned |
| Billing | Stripe integration | 🔄 Planned |
| Teams | Workspace sharing | 🔄 Future |

---

## Architecture Overview

### Current Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Prisma ORM    │────▶│   PostgreSQL    │
│   (Frontend +   │     │   (Data Layer)  │     │   (Single DB)   │
│    API Routes)  │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │ Better Auth
        ▼
┌─────────────────┐
│   Email OTP     │
│   (Resend)      │
└─────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Next.js     │     │   Next.js     │     │   Next.js     │
│   Instance 1  │     │   Instance 2  │     │   Instance N  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Prisma + RLS Middleware                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │ PostgreSQL│   │   Redis   │   │   Stripe  │
       │ (Primary) │   │  (Cache)  │   │ (Billing) │
       └───────────┘   └───────────┘   └───────────┘
```

---

## Multi-Tenancy Model

### Approach: Single Database with Row-Level Isolation

We use a **single database with userId-based row isolation**. This approach balances simplicity, cost, and sufficient isolation for our use case.

#### Why Not Schema-per-Tenant?

| Factor | Row-Level | Schema-per-Tenant |
|--------|-----------|-------------------|
| Complexity | Low | High |
| Migrations | Single | Per-tenant |
| Cost | Lower | Higher |
| Isolation | Logical | Logical + Physical |
| Query Performance | Good (indexed) | Good |
| Cross-tenant queries | Possible (admin) | Complex |

For our scale (< 10,000 tenants initially), row-level isolation is the pragmatic choice.

### Isolation Strategy

1. **Every tenant-owned table gets a `userId` column**
2. **All queries filtered by authenticated user's ID**
3. **Database indexes on `userId` for performance**
4. **Application-layer enforcement (Prisma middleware)**

#### Tables Requiring User Scoping

| Table | Isolation | Notes |
|-------|-----------|-------|
| `task` | `userId` (owner) | Core entity |
| `project` | `userId` | Groups tasks |
| `label` | `userId` | Tags/categories |
| `api_key` | `userId` | API access tokens |
| `activity_log` | via `task.userId` | Inherits from task |
| `task_label` | via `task.userId` | Junction table |

---

## Database Schema Changes

### New Models

#### ApiKey Model

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String    @default("Default")
  keyPrefix   String    // "mc_abc123" - displayed to user
  keyHash     String    @unique // SHA-256 hash of full key
  permissions String[]  @default(["read", "write"]) // Future: granular permissions
  lastUsedAt  DateTime?
  lastUsedIp  String?
  expiresAt   DateTime? // Optional expiration
  createdAt   DateTime  @default(now())
  revokedAt   DateTime? // Soft delete

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@index([userId])
  @@map("api_key")
}
```

#### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // NEW: Tier/billing info
  tier          String    @default("free") // free, pro, team
  stripeId      String?   @unique
  
  // NEW: Ownership relations
  apiKeys       ApiKey[]
  ownedTasks    Task[]    @relation("TaskOwner")
  projects      Project[]
  labels        Label[]
  
  @@map("user")
}
```

#### Task Model Updates

```prisma
model Task {
  // ... existing fields ...
  
  // NEW: Owner (required)
  userId        String
  user          User      @relation("TaskOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("task")
}
```

#### Project Model Updates

```prisma
model Project {
  // ... existing fields ...
  
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("project")
}
```

#### Label Model Updates

```prisma
model Label {
  // ... existing fields ...
  
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("label")
}
```

### Future: Team/Workspace Model (Phase 2)

```prisma
// FUTURE - Not implemented in v1
model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  ownerId     String
  createdAt   DateTime @default(now())
  
  owner       User     @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members     WorkspaceMember[]
  tasks       Task[]
  
  @@map("workspace")
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        String   @default("member") // owner, admin, member, viewer
  joinedAt    DateTime @default(now())
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([workspaceId, userId])
  @@map("workspace_member")
}
```

---

## Authentication & Authorization

### Authentication Layers

1. **Session-based (UI):** Better Auth with email OTP
2. **API Key (External):** Bearer token for API access

### API Key Design

#### Key Format

```
mc_live_cuid1234567890abcdef
│   │    └── 24-character random suffix
│   └── Environment (live/test)
└── Prefix (mission control)
```

#### Key Generation Flow

```typescript
import { createId } from '@paralleldrive/cuid2'
import { createHash } from 'crypto'

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const suffix = createId() + createId() // 48 chars
  const key = `mc_live_${suffix}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = `mc_live_${suffix.slice(0, 8)}` // First 8 chars
  
  return { key, hash, prefix }
}
```

#### Key Storage

- **Store:** SHA-256 hash only (irreversible)
- **Display:** Full key shown ONCE on creation
- **List:** Show only prefix (`mc_live_abc12345...`)

#### Key Validation

```typescript
async function validateApiKey(token: string): Promise<User | null> {
  const hash = createHash('sha256').update(token).digest('hex')
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash, revokedAt: null },
    include: { user: true }
  })
  
  if (!apiKey) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
  
  // Update last used (async, don't block)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date(), lastUsedIp: getClientIp() }
  }).catch(() => {})
  
  return apiKey.user
}
```

### Permission Model (Future)

```typescript
enum Permission {
  READ_TASKS = 'tasks:read',
  WRITE_TASKS = 'tasks:write',
  DELETE_TASKS = 'tasks:delete',
  READ_PROJECTS = 'projects:read',
  WRITE_PROJECTS = 'projects:write',
  // ... etc
}

// v1: All keys have full access
// v2: Granular permissions
```

---

## API Design

### API Versioning

```
/api/v1/tasks     # Versioned (stable)
/api/tasks        # Unversioned (current, may change)
```

For v1 launch, we'll keep unversioned endpoints but design for future versioning.

### Authentication

All API requests require authentication:

```http
Authorization: Bearer mc_live_xxxxxxxxxxxxx
```

### Endpoints

#### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (paginated) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/search` | Semantic search |

#### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

#### Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/labels` | List labels |
| POST | `/api/labels` | Create label |
| PATCH | `/api/labels/:id` | Update label |
| DELETE | `/api/labels/:id` | Delete label |

#### API Keys (Self-service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | List user's API keys |
| POST | `/api/keys` | Create new key |
| DELETE | `/api/keys/:id` | Revoke key |

#### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get current user |
| PATCH | `/api/me` | Update profile |
| GET | `/api/me/usage` | Get usage stats |

### Response Format

```typescript
// Success
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-28T12:00:00Z"
  }
}

// Error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired API key",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-28T12:00:00Z"
  }
}
```

### Rate Limiting

| Tier | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Team | 1,000 | 100,000 |

Implementation: Redis-based sliding window counter.

---

## Security Considerations

### Data Isolation

1. **Query-level:** All Prisma queries include `userId` filter
2. **Middleware:** Automatic injection of user context
3. **Validation:** Ownership check on all mutations

```typescript
// Prisma middleware for automatic user scoping
prisma.$use(async (params, next) => {
  if (params.model && ['Task', 'Project', 'Label'].includes(params.model)) {
    const userId = getCurrentUserId() // From request context
    
    if (['findMany', 'findFirst', 'count'].includes(params.action)) {
      params.args.where = { ...params.args.where, userId }
    }
    
    if (['update', 'delete'].includes(params.action)) {
      // Ensure user owns the resource
      params.args.where = { ...params.args.where, userId }
    }
    
    if (params.action === 'create') {
      params.args.data = { ...params.args.data, userId }
    }
  }
  
  return next(params)
})
```

### API Key Security

1. **Hashing:** Keys stored as SHA-256 hashes only
2. **Rotation:** Users can revoke and regenerate keys
3. **Expiration:** Optional TTL on keys
4. **Audit:** `lastUsedAt` and `lastUsedIp` tracking

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented by Prisma parameterization
- XSS prevented by React's default escaping

### HTTPS

- All traffic over HTTPS (enforced)
- HSTS headers enabled

### Audit Logging

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // api.tasks.create, auth.login, etc.
  resource  String?  // task:cuid123
  ip        String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
  @@map("audit_log")
}
```

---

## Infrastructure & Deployment

### Current Setup

- **Hosting:** Vercel (assumed)
- **Database:** Neon/Supabase PostgreSQL
- **Domain:** moltmc.app

### Production Requirements

#### Database

- PostgreSQL 15+ with connection pooling
- Recommend: Neon, Supabase, or PlanetScale
- Connection limit: 100+ concurrent

#### Caching (Optional)

- Redis for rate limiting and session caching
- Recommend: Upstash (serverless Redis)

#### Email

- Resend for transactional email (already configured)

#### Monitoring

- Vercel Analytics (built-in)
- Sentry for error tracking
- PostHog for product analytics (optional)

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_URL="https://moltmc.app"
BETTER_AUTH_SECRET="..."

# Email
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="Mission Control <noreply@moltmc.app>"

# Billing (future)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."

# Redis (future)
REDIS_URL="..."

# Monitoring
SENTRY_DSN="..."
```

---

## Monitoring & Observability

### Metrics to Track

#### Business Metrics

- Daily/Monthly Active Users (DAU/MAU)
- API calls per user
- Task creation rate
- Conversion rate (free → paid)

#### Technical Metrics

- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Rate limit hits

### Logging Strategy

```typescript
// Structured logging
logger.info('api.tasks.created', {
  userId: user.id,
  taskId: task.id,
  duration: ms,
  requestId: req.id
})
```

### Alerting

- API error rate > 1%
- P95 latency > 500ms
- Rate limit errors > 100/hour
- Failed auth attempts > 50/hour per IP

---

## Migration Strategy

### Phase 1: Schema Migration (Non-breaking)

1. Add nullable `userId` columns
2. Deploy code that writes `userId` on new records
3. Backfill existing data
4. Make `userId` non-nullable
5. Deploy user scoping

### Migration Script

```sql
-- Step 1: Add nullable columns
ALTER TABLE task ADD COLUMN "userId" TEXT;
ALTER TABLE project ADD COLUMN "userId" TEXT;
ALTER TABLE label ADD COLUMN "userId" TEXT;

-- Step 2: Backfill (assign to first user)
UPDATE task SET "userId" = (SELECT id FROM "user" LIMIT 1) WHERE "userId" IS NULL;
UPDATE project SET "userId" = (SELECT id FROM "user" LIMIT 1) WHERE "userId" IS NULL;
UPDATE label SET "userId" = (SELECT id FROM "user" LIMIT 1) WHERE "userId" IS NULL;

-- Step 3: Make non-nullable
ALTER TABLE task ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE project ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE label ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add indexes
CREATE INDEX task_userId_idx ON task("userId");
CREATE INDEX project_userId_idx ON project("userId");
CREATE INDEX label_userId_idx ON label("userId");

-- Step 5: Add foreign keys
ALTER TABLE task ADD CONSTRAINT task_userId_fkey FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE project ADD CONSTRAINT project_userId_fkey FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE label ADD CONSTRAINT label_userId_fkey FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
```

### Rollback Plan

If issues arise:
1. Revert code to ignore `userId` filtering
2. `userId` columns remain (no data loss)
3. Investigate and fix
4. Re-deploy

---

## Appendix

### A. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind 4 |
| API | Next.js API Routes (REST) |
| Database | PostgreSQL 15+, Prisma 7 |
| Auth | Better Auth (Email OTP) |
| Email | Resend |
| Hosting | Vercel |
| Billing | Stripe (future) |
| Caching | Redis/Upstash (future) |

### B. Related Documents

- [MULTI_TENANT_PLAN.md](./MULTI_TENANT_PLAN.md) - Original planning document
- [ROADMAP.md](./ROADMAP.md) - Product roadmap with milestones
- [API_REFERENCE.md](./API_REFERENCE.md) - Full API documentation

### C. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-28 | Row-level isolation | Simpler than schema-per-tenant, sufficient for scale |
| 2026-01-28 | SHA-256 key hashing | Industry standard, irreversible |
| 2026-01-28 | Defer teams to v2 | Focus on single-user experience first |

---

*Last updated: 2026-01-28*
