# Mission Control → Multi-Tenant SaaS

## Overview
Transform Mission Control from single-user to multi-tenant SaaS for Clawdbot users.

---

## Phase 1: Schema Changes

### 1.1 Add ApiKey model
```prisma
model ApiKey {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  name      String    @default("Default")
  lastUsed  DateTime?
  createdAt DateTime  @default(now())
  revokedAt DateTime?
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("api_key")
}
```

### 1.2 Add userId to Project and Label
```prisma
model Project {
  // ... existing fields
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model Label {
  // ... existing fields
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

### 1.3 Add userId to Task (direct ownership)
```prisma
model Task {
  // ... existing fields
  userId    String
  user      User     @relation("TaskOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

### 1.4 Update User model
```prisma
model User {
  // ... existing fields
  apiKeys       ApiKey[]
  ownedTasks    Task[]      @relation("TaskOwner")
  projects      Project[]
  labels        Label[]
}
```

---

## Phase 2: Migration Strategy

### Step 1: Create migration with nullable userId
```bash
npx prisma migrate dev --name add_user_scoping
```

### Step 2: Backfill existing data
```sql
-- Assign all existing tasks/projects/labels to first user (you)
UPDATE task SET "userId" = (SELECT id FROM "user" LIMIT 1);
UPDATE project SET "userId" = (SELECT id FROM "user" LIMIT 1);
UPDATE label SET "userId" = (SELECT id FROM "user" LIMIT 1);
```

### Step 3: Make userId required
```bash
npx prisma migrate dev --name make_user_required
```

---

## Phase 3: API Changes

### 3.1 New API auth middleware (`src/lib/api-auth.ts`)
```typescript
import { prisma } from "./prisma"

export async function authenticateApi(request: Request) {
  const authHeader = request.headers.get("Authorization")
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  
  const token = authHeader.slice(7)
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { token, revokedAt: null },
    include: { user: true }
  })
  
  if (!apiKey) return null
  
  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() }
  })
  
  return apiKey.user
}
```

### 3.2 Update task routes
All queries add `userId` filter:
```typescript
// GET /api/tasks
const user = await authenticateApi(request)
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

const tasks = await prisma.task.findMany({
  where: { userId: user.id, ...otherFilters }
})
```

### 3.3 New API key management endpoints
```
POST   /api/keys          - Create new API key
GET    /api/keys          - List user's API keys
DELETE /api/keys/[id]     - Revoke API key
```

---

## Phase 4: UI Changes

### 4.1 Settings page (`/settings`)
- View/copy API keys
- Generate new keys
- Revoke keys
- Account settings

### 4.2 Onboarding flow
1. User signs up (email OTP)
2. Auto-create default API key
3. Show setup instructions for Clawdbot

### 4.3 Dashboard scoping
- KanbanBoard already uses API — just needs auth
- Activity feed scoped to user's tasks

---

## Phase 5: Clawdbot Integration

### 5.1 Config example for users
```yaml
# In user's Clawdbot config
tools:
  mission-control:
    url: https://moltmc.app
    apiKey: mc_xxxxxxxxxxxxxxxx
```

### 5.2 Documentation
- Setup guide for new users
- API reference
- Clawdbot skill (optional)

---

## File Changes Summary

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add ApiKey, userId to Task/Project/Label |
| `src/lib/api-auth.ts` | New API key authentication |
| `src/app/api/tasks/route.ts` | Add user scoping |
| `src/app/api/tasks/[id]/route.ts` | Add user scoping |
| `src/app/api/keys/route.ts` | New - API key management |
| `src/app/api/keys/[id]/route.ts` | New - Delete key |
| `src/app/settings/page.tsx` | New - Settings UI |
| `src/components/Settings/*` | New - Settings components |

---

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Schema | 2 hours |
| Phase 2: Migration | 1 hour |
| Phase 3: API | 4 hours |
| Phase 4: UI | 6 hours |
| Phase 5: Docs | 2 hours |
| **Total** | **~15 hours** |

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Create schema migration
3. [ ] Update API routes
4. [ ] Build settings UI
5. [ ] Test with second user
6. [ ] Deploy and document

---

*Generated: 2026-01-28*
