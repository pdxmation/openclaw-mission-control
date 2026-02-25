# Mission Control Discord Webhook Integration

## Overview
Sends task updates, alerts, and system events to Discord channels via webhooks.

## Webhooks Required

Create these in Discord (Server Settings → Integrations → Webhooks):

| Webhook Name | Channel | Purpose |
|--------------|---------|---------|
| `mc-tasks` | #mission-control | Task created, updated, completed |
| `mc-alerts` | #bot-alerts | Critical errors, blockers |
| `mc-status` | #system-status | Deployments, health checks |

Add URLs to `.env`:
```bash
DISCORD_WEBHOOK_MISSION_CONTROL=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_ALERTS=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_STATUS=https://discord.com/api/webhooks/...
```

## Usage

```typescript
import { sendTaskUpdate, sendAlert, sendStatus } from './discord-webhooks';

// Task notification
await sendTaskUpdate({
  action: 'created', // 'created' | 'completed' | 'blocked'
  task: { title, status, priority, assignee },
  url: 'https://moltmc.app/tasks/123'
});

// Critical alert
await sendAlert({
  level: 'critical', // 'info' | 'warning' | 'critical'
  title: 'Database connection failed',
  message: 'Retrying in 30s...',
  metadata: { service: 'api', error: err.message }
});

// Status update
await sendStatus({
  event: 'deploy', // 'deploy' | 'health-check' | 'backup'
  status: 'success', // 'success' | 'failure' | 'in-progress'
  details: 'v1.2.3 deployed to production'
});
```
