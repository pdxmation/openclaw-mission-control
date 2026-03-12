# PRD: Cron Jobs Calendar Dashboard

**Status:** APPROVED  
**Created:** 2026-03-12  
**Updated:** 2026-03-12 (simplified: read-only, central sync)  
**Route:** `/cron-jobs`  
**Priority:** MEDIUM  
**Estimated Effort:** 1-2 hours

---

## 🎯 Goal

Provide a visual calendar interface to view, manage, and monitor all OpenClaw cron jobs in one place. Currently, cron jobs are only visible via CLI or config files — no UI exists.

---

## 🏗️ Architecture

### Gateway Behind NAT — Push-Based Sync (Read-Only)

**Central Sync:** MAIN agent (R2-D2) syncs ALL cron jobs from all agents.

```
┌─────────────────────────────────────────────────────────────┐
│  OpenClaw Gateway (local, behind NAT)                       │
│  ~/openclaw/cron/jobs.json (ALL agents)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ localhost:18789
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MAIN Agent / R2-D2 (local)                                 │
│  Cron: "Cron Jobs Sync to MC" (every 5 min)                 │
│  - Calls gateway cron list (all agents)                     │
│  - POSTs to moltmc.app/api/cron-jobs/sync                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (public internet)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Mission Control (moltmc.app - Coolify)                     │
│  PostgreSQL: cron_jobs table                                │
│  UI: /cron-jobs (shadcn calendar) — READ ONLY               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

| Direction | Method | Frequency |
|-----------|--------|-----------|
| Gateway → MAIN | localhost API call | Every 5 min |
| MAIN → MC | HTTPS POST /api/cron-jobs/sync | Every 5 min |
| MC → UI | GET /api/cron-jobs | On page load |

**Note:** UI is READ-ONLY. No write operations (enable/disable/delete) are supported.

---

## 👤 User Stories

| As a... | I want to... | So that I can... |
|---------|--------------|------------------|
| Admin | See all cron jobs in a calendar view | Understand when jobs run at a glance |
| Admin | Filter by agent (chopper, sabine, main, etc.) | Focus on specific agent's scheduled tasks |
| Admin | Click a job to see details | View schedule, payload, last run status |
| Admin | Enable/disable jobs from UI | Manage jobs without CLI |
| Admin | See last run status (ok/error) | Monitor job health quickly |
| Admin | See next run time | Know when to expect the next execution |

---

## 🖥️ UI Requirements

### Page Layout

```
┌─────────────────────────────────────────────┐
│ Cron Jobs                    [+ New Job]    │
├─────────────────────────────────────────────┤
│ [All Agents ▼]  [Active/Disabled ▼]         │
├─────────────────────────────────────────────┤
│                                             │
│     📅 Full Calendar View (shadcn/calendar) │
│     - Month/Week/Day toggle                 │
│     - Dots/badges on dates with jobs        │
│     - Click date → show jobs running then   │
│                                             │
├─────────────────────────────────────────────┤
│ Job List (sidebar or below)                 │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟢 GitHub issue monitor                 │ │
│ │    9:00 AM & 3:00 PM daily              │ │
│ │    Last: ✅ Today 9:00 AM               │ │
│ │    Next: Today 3:00 PM                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Components (shadcn/ui)

- `calendar` — Main calendar view
- `badge` — Status indicators (ok/error/disabled)
- `dialog` — Job details modal
- `switch` — Enable/disable toggle
- `select` — Agent filter
- `card` — Job list items
- `tooltip` — Show job name on calendar hover

### Color Coding

| Status | Color |
|--------|-------|
| Active (next run today) | 🟢 Green |
| Active (no run today) | 🔵 Blue |
| Disabled | ⚪ Gray |
| Last run error | 🔴 Red |
| Currently running | 🟡 Yellow pulse |

---

## 🔌 API Requirements

### Database Schema (PostgreSQL)

```prisma
model CronJob {
  id              String   @id
  agentId         String
  name            String
  enabled         Boolean
  scheduleKind    String   // cron | every | at
  scheduleExpr    String?  // cron expression
  scheduleEveryMs Int?
  scheduleAt      DateTime?
  scheduleTz      String?
  payloadKind     String
  payloadMessage  String?
  deliveryMode    String?
  deliveryTo      String?
  nextRunAt       DateTime
  lastRunAt       DateTime?
  lastRunStatus   String?
  lastDurationMs  Int?
  consecutiveErrors Int
  pendingChange   String?  // queued enable/disable
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([agentId])
  @@index([enabled])
}
```

### API Endpoints

#### Sync Endpoint (MAIN → MC)
```
POST /api/cron-jobs/sync
Authorization: Bearer <token>
X-Agent-Source: MAIN

Body: {
  jobs: CronJob[]
}
```

#### List Endpoint (UI → MC)
```
GET /api/cron-jobs
GET /api/cron-jobs?agent=chopper
GET /api/cron-jobs?enabled=true

Response: {
  jobs: CronJob[]
}
```

**Note:** No PATCH/DELETE endpoints — UI is read-only.

---

## 🔄 Sync Mechanism

### New MAIN (R2-D2) Cron Job

```json
{
  "name": "Cron Jobs Sync to MC",
  "agentId": "main",
  "schedule": {
    "kind": "every",
    "everyMs": 300000
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Sync ALL cron jobs to Mission Control:\n1. Call gateway cron list (localhost:18789) - fetches all agents\n2. POST results to https://moltmc.app/api/cron-jobs/sync\n3. Include MC_API_KEY from .env\n4. Handle errors gracefully",
    "model": "minimax",
    "thinking": "minimal",
    "timeoutSeconds": 60
  }
}
```

### Sync Payload

```typescript
interface SyncPayload {
  jobs: {
    id: string
    agentId: string
    name: string
    enabled: boolean
    schedule: {
      kind: 'cron' | 'every' | 'at'
      expr?: string
      everyMs?: number
      at?: string
      tz?: string
    }
    payload: {
      kind: 'agentTurn' | 'systemEvent'
      message?: string
    }
    delivery?: {
      mode: 'announce' | 'webhook' | 'none'
      channel?: string
      to?: string
    }
    state: {
      nextRunAtMs: number
      lastRunAtMs?: number
      lastRunStatus?: 'ok' | 'error'
      lastDurationMs?: number
      consecutiveErrors: number
    }
  }[]
}
```

---

## ✅ Acceptance Criteria

- [ ] Calendar displays all cron jobs (all agents)
- [ ] Jobs are color-coded by status
- [ ] Clicking a job opens detail modal with:
  - [ ] Full schedule info
  - [ ] Last run status + duration
  - [ ] Next run time
  - [ ] Agent ID badge
- [ ] Agent filter works correctly (all agents)
- [ ] Calendar shows current month by default
- [ ] Responsive design (mobile-friendly)
- [ ] Loading state while fetching jobs
- [ ] Error state if API fails
- [ ] Sync runs every 5 minutes (MAIN agent)
- [ ] UI is READ-ONLY (no modifications)

---

## 📦 Dependencies

- `shadcn/ui` — calendar, badge, dialog, switch, select, card
- `date-fns` — date manipulation
- OpenClaw Gateway cron API access (local)
- Mission Control API token

---

## 🚀 Out of Scope

- Create new cron job from UI
- Edit cron schedule from UI
- Enable/disable jobs from UI
- Delete jobs from UI
- Job run history graph
- Manual trigger ("Run Now" button)
- Real-time sync (< 5 min)

**This is a READ-ONLY viewer.** All modifications must be done via CLI or Gateway config.
- Real-time sync (< 5 min)

---

## 📝 Implementation Checklist

### Phase 1: Backend
- [ ] Create Prisma schema migration
- [ ] Create POST /api/cron-jobs/sync endpoint
- [ ] Create GET /api/cron-jobs endpoint
- [ ] Add API key validation for sync endpoint

### Phase 2: MAIN Sync Cron
- [ ] Create new cron job "Cron Jobs Sync to MC" (MAIN agent)
- [ ] Test gateway cron API call (all agents)
- [ ] Test POST to MC sync endpoint
- [ ] Add error handling + logging

### Phase 3: Frontend
- [ ] Create /cron-jobs page
- [ ] Add shadcn calendar component
- [ ] Build job list sidebar
- [ ] Build job detail dialog
- [ ] Add agent filter dropdown (all agents)
- [ ] Add status badges + color coding
- [ ] Add loading/error states
- [ ] Test responsive design
- [ ] Remove all write operations (read-only)

---

## 🔐 Security Notes

- Sync endpoint requires valid Bearer token
- X-Agent-Source header validates sender (MAIN)
- Rate limit sync endpoint (max 1 call/min)
- UI is read-only — no write operations exposed

---

*Last updated: 2026-03-12*
