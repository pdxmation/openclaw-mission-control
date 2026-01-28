# Mission Control API Reference

**Base URL:** `https://moltmc.app/api`  
**Version:** v1 (current)

---

## Authentication

All API requests require authentication using a Bearer token.

### Request Header

```http
Authorization: Bearer mc_live_xxxxxxxxxxxxxxxx
```

### Getting an API Key

1. Log in to Mission Control at https://moltmc.app
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy and securely store your key (shown only once)

### Example Request

```bash
curl -X GET https://moltmc.app/api/tasks \
  -H "Authorization: Bearer mc_live_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json"
```

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123def",
    "timestamp": "2026-01-28T12:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "constraint": "required"
    }
  },
  "meta": {
    "requestId": "req_abc123def",
    "timestamp": "2026-01-28T12:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Key valid but lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Team | 1,000 | 100,000 |

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1706443200
```

---

## Endpoints

### Tasks

#### List Tasks

```http
GET /api/tasks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (optional) |
| `priority` | string | Filter by priority (optional) |
| `projectId` | string | Filter by project (optional) |
| `limit` | number | Max results (default: 100, max: 500) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**

```json
{
  "data": {
    "all": [...],
    "recurring": [...],
    "inProgress": [...],
    "backlog": [...],
    "review": [...],
    "completed": [...],
    "blocked": [...]
  },
  "meta": { ... }
}
```

---

#### Create Task

```http
POST /api/tasks
```

**Request Body:**

```json
{
  "title": "Build new feature",
  "description": "Implement the payment flow",
  "status": "BACKLOG",
  "priority": "HIGH",
  "projectId": "clxxx123",
  "isRecurring": false,
  "notes": "Check Stripe docs first"
}
```

**Required Fields:** `title`

**Optional Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | null | Task description |
| `status` | enum | `BACKLOG` | Task status |
| `priority` | enum | `MEDIUM` | Task priority |
| `projectId` | string | null | Associated project |
| `isRecurring` | boolean | false | Recurring task flag |
| `notes` | string | null | Additional notes |
| `blocker` | string | null | What's blocking |
| `need` | string | null | What's needed |

**Status Values:** `RECURRING`, `IN_PROGRESS`, `BACKLOG`, `REVIEW`, `COMPLETED`, `BLOCKED`

**Priority Values:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Response:** (201 Created)

```json
{
  "data": {
    "id": "clxxx789",
    "title": "Build new feature",
    "status": "BACKLOG",
    "priority": "HIGH",
    "createdAt": "2026-01-28T12:00:00.000Z",
    ...
  },
  "meta": { ... }
}
```

---

#### Get Task

```http
GET /api/tasks/:id
```

**Response:**

```json
{
  "data": {
    "id": "clxxx789",
    "title": "Build new feature",
    "description": "Implement the payment flow",
    "status": "BACKLOG",
    "priority": "HIGH",
    "position": 1,
    "isRecurring": false,
    "project": {
      "id": "clxxx123",
      "name": "Mission Control",
      "color": "#6366f1"
    },
    "labels": [
      {
        "label": {
          "id": "clxxx456",
          "name": "feature",
          "color": "#10b981"
        }
      }
    ],
    "assignee": null,
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2026-01-28T12:00:00.000Z",
    "updatedAt": "2026-01-28T12:00:00.000Z"
  },
  "meta": { ... }
}
```

---

#### Update Task

```http
PATCH /api/tasks/:id
```

**Request Body:** (partial update - only include fields to change)

```json
{
  "status": "IN_PROGRESS",
  "startedAt": "2026-01-28T12:00:00.000Z"
}
```

**Behavior Notes:**

- Setting `status` to `IN_PROGRESS` auto-sets `startedAt` if not provided
- Setting `status` to `COMPLETED` auto-sets `completedAt` if not provided

**Response:** (200 OK)

```json
{
  "data": {
    "id": "clxxx789",
    "status": "IN_PROGRESS",
    "startedAt": "2026-01-28T12:00:00.000Z",
    ...
  },
  "meta": { ... }
}
```

---

#### Delete Task

```http
DELETE /api/tasks/:id
```

**Response:** (200 OK)

```json
{
  "data": {
    "success": true,
    "deleted": {
      "id": "clxxx789",
      "title": "Build new feature"
    }
  },
  "meta": { ... }
}
```

---

#### Search Tasks

```http
GET /api/tasks/search?q=payment
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |
| `limit` | number | Max results (default: 10) |

Uses semantic search (embeddings) for intelligent matching.

**Response:**

```json
{
  "data": {
    "results": [
      {
        "id": "clxxx789",
        "title": "Build new feature",
        "score": 0.89,
        ...
      }
    ],
    "query": "payment"
  },
  "meta": { ... }
}
```

---

### Projects

#### List Projects

```http
GET /api/projects
```

**Response:**

```json
{
  "data": [
    {
      "id": "clxxx123",
      "name": "Mission Control",
      "description": "Task management app",
      "color": "#6366f1",
      "taskCount": 15,
      "createdAt": "2026-01-28T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

#### Create Project

```http
POST /api/projects
```

**Request Body:**

```json
{
  "name": "New Project",
  "description": "Project description",
  "color": "#f59e0b"
}
```

**Required Fields:** `name`

---

#### Update Project

```http
PATCH /api/projects/:id
```

---

#### Delete Project

```http
DELETE /api/projects/:id
```

**Note:** Deleting a project sets `projectId` to null on associated tasks (doesn't delete tasks).

---

### Labels

#### List Labels

```http
GET /api/labels
```

---

#### Create Label

```http
POST /api/labels
```

**Request Body:**

```json
{
  "name": "urgent",
  "color": "#ef4444"
}
```

---

#### Update Label

```http
PATCH /api/labels/:id
```

---

#### Delete Label

```http
DELETE /api/labels/:id
```

---

### API Keys

#### List API Keys

```http
GET /api/keys
```

**Response:**

```json
{
  "data": [
    {
      "id": "clxxx456",
      "name": "Clawdbot",
      "keyPrefix": "mc_live_abc12345...",
      "lastUsedAt": "2026-01-28T12:00:00.000Z",
      "createdAt": "2026-01-28T10:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

**Note:** Full key is never returned after creation.

---

#### Create API Key

```http
POST /api/keys
```

**Request Body:**

```json
{
  "name": "Clawdbot"
}
```

**Response:** (201 Created)

```json
{
  "data": {
    "id": "clxxx456",
    "name": "Clawdbot",
    "key": "mc_live_xxxxxxxxxxxxxxxxxxxxxxxx",
    "keyPrefix": "mc_live_xxxxxxxx...",
    "createdAt": "2026-01-28T12:00:00.000Z"
  },
  "message": "Store this key securely. It won't be shown again.",
  "meta": { ... }
}
```

**⚠️ Important:** The full `key` is only returned on creation. Store it securely.

---

#### Revoke API Key

```http
DELETE /api/keys/:id
```

**Response:** (200 OK)

```json
{
  "data": {
    "success": true,
    "revoked": {
      "id": "clxxx456",
      "name": "Clawdbot"
    }
  },
  "meta": { ... }
}
```

---

### Account

#### Get Current User

```http
GET /api/me
```

**Response:**

```json
{
  "data": {
    "id": "clxxx789",
    "name": "Pavel",
    "email": "pavel@example.com",
    "tier": "pro",
    "createdAt": "2026-01-28T10:00:00.000Z"
  },
  "meta": { ... }
}
```

---

#### Get Usage Stats

```http
GET /api/me/usage
```

**Response:**

```json
{
  "data": {
    "tasks": {
      "total": 45,
      "limit": null,
      "remaining": null
    },
    "apiCalls": {
      "today": 156,
      "limit": 10000,
      "remaining": 9844
    },
    "period": {
      "start": "2026-01-01T00:00:00.000Z",
      "end": "2026-01-31T23:59:59.000Z"
    }
  },
  "meta": { ... }
}
```

---

### Activity

#### Get Activity Feed

```http
GET /api/activity
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 50) |
| `taskId` | string | Filter by task (optional) |

**Response:**

```json
{
  "data": [
    {
      "id": "clxxx111",
      "action": "moved",
      "details": "{\"from\":\"BACKLOG\",\"to\":\"IN_PROGRESS\"}",
      "task": {
        "id": "clxxx789",
        "title": "Build new feature"
      },
      "createdAt": "2026-01-28T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

**Action Types:** `created`, `updated`, `moved`, `completed`, `deleted`

---

## Webhooks (Coming Soon)

### Events

| Event | Trigger |
|-------|---------|
| `task.created` | New task created |
| `task.updated` | Task modified |
| `task.completed` | Task marked complete |
| `task.deleted` | Task deleted |

### Payload Example

```json
{
  "event": "task.completed",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "data": {
    "task": {
      "id": "clxxx789",
      "title": "Build new feature",
      "status": "COMPLETED",
      "completedAt": "2026-01-28T12:00:00.000Z"
    }
  }
}
```

---

## SDKs & Libraries

### Clawdbot Integration

Add to your Clawdbot config:

```yaml
tools:
  mission-control:
    url: https://moltmc.app
    apiKey: mc_live_xxxxxxxxxxxxxxxx
```

### cURL Examples

```bash
# List all tasks
curl -H "Authorization: Bearer $MC_API_KEY" \
  https://moltmc.app/api/tasks

# Create a task
curl -X POST https://moltmc.app/api/tasks \
  -H "Authorization: Bearer $MC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "New task", "priority": "HIGH"}'

# Update task status
curl -X PATCH https://moltmc.app/api/tasks/clxxx789 \
  -H "Authorization: Bearer $MC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Delete a task
curl -X DELETE https://moltmc.app/api/tasks/clxxx789 \
  -H "Authorization: Bearer $MC_API_KEY"
```

### JavaScript/TypeScript

```typescript
const MC_API_KEY = 'mc_live_xxxxxxxxxxxxxxxx'
const BASE_URL = 'https://moltmc.app/api'

async function listTasks() {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${MC_API_KEY}` }
  })
  return res.json()
}

async function createTask(title: string, priority = 'MEDIUM') {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, priority })
  })
  return res.json()
}
```

### Python

```python
import requests

MC_API_KEY = 'mc_live_xxxxxxxxxxxxxxxx'
BASE_URL = 'https://moltmc.app/api'

headers = {'Authorization': f'Bearer {MC_API_KEY}'}

# List tasks
tasks = requests.get(f'{BASE_URL}/tasks', headers=headers).json()

# Create task
new_task = requests.post(
    f'{BASE_URL}/tasks',
    headers=headers,
    json={'title': 'New task', 'priority': 'HIGH'}
).json()
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-01-28 | Initial release |

---

*Questions? Contact support@moltmc.app*
