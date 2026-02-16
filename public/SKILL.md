# Mission Control Skill for OpenClaw

**Version:** 1.0.0  
**Last Updated:** 2026-02-16  
**API Base URL:** `https://moltmc.app/api`

---

## Overview

Mission Control is an AI-powered task management system with Kanban boards, project organization, document management (Second Brain), and agent activity tracking. This skill enables OpenClaw bots to create, manage, and organize tasks while maintaining context about the user's profile and goals.

### Key Features for Bots

- **Task Management** - Create, update, move, and complete tasks
- **Semantic Search** - Find similar tasks using AI embeddings
- **Project Organization** - Group tasks into projects with color coding
- **Document Management** - Create and manage notes, journals, and research
- **User Profile Context** - Access user goals, focus areas, and preferences
- **Duplicate Prevention** - Agent source tracking prevents duplicate tasks

---

## Authentication

### API Key Format

```
mc_<64_hex_characters>
```

Example: `mc_a1b2c3d4e5f6...` (68 characters total)

### Required Headers

```http
Authorization: Bearer mc_your_api_key_here
Content-Type: application/json
```

### Agent Source Header (CRITICAL)

Always include the `X-Agent-Source` header to identify your bot and prevent duplicate tasks:

```http
X-Agent-Source: openclaw-main
```

**Why this matters:** When multiple agents use the same account, tasks with the same title and source won't be duplicated. The source appears in the UI for filtering.

### Complete Example Request

```bash
curl -X POST https://moltmc.app/api/tasks \
  -H "Authorization: Bearer mc_your_key" \
  -H "X-Agent-Source: openclaw-main" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review codebase for security issues",
    "status": "BACKLOG",
    "priority": "HIGH"
  }'
```

---

## Core Concepts

### Task Statuses

Tasks flow through these columns on the Kanban board:

| Status | Description | Use Case |
|--------|-------------|----------|
| `RECURRING` | Repeating tasks | Daily standups, weekly reviews |
| `IN_PROGRESS` | Currently being worked on | Active development |
| `BACKLOG` | Planned but not started | Future work, ideas |
| `REVIEW` | Ready for review | Code review, QA testing |
| `COMPLETED` | Done | Finished tasks |
| `BLOCKED` | Cannot proceed | Waiting on dependencies |

### Task Priorities

- `LOW` - Nice to have
- `MEDIUM` - Normal priority
- `HIGH` - Important, should do soon
- `CRITICAL` - Urgent, blocking other work

### Document Types

- `note` - General notes and ideas
- `journal` - Daily logs and reflections
- `concept` - Concepts and definitions
- `research` - Research findings and analysis

---

## User Profile

Access user context to create personalized tasks.

### Get User Profile

```http
GET /api/user/profile
```

**Response:**

```json
{
  "id": "clxxx123",
  "name": "Pavel",
  "email": "pavel@example.com",
  "telegram": "@pavel",
  "github": "pdxmation",
  "timezone": "America/Los_Angeles",
  "wakeTime": "07:00",
  "location": "San Francisco",
  "company": "Mission Control Inc",
  "companyLegal": "Mission Control LLC",
  "product": "AI Task Management",
  "stage": "beta",
  "communicationStyle": "concise",
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "preferences": { "theme": "dark", "notifications": true },
  "shortTermGoals": ["Launch beta", "Get 100 users"],
  "mediumTermGoals": ["Series A funding", "10k users"],
  "longTermGoals": ["Industry standard tool", "IPO"],
  "techStack": ["Next.js", "Prisma", "PostgreSQL", "OpenAI"],
  "currentFocus": "User onboarding flow",
  "notes": "Prefers async communication",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-02-16T14:30:00.000Z"
}
```

### Update Profile

```http
PATCH /api/user/profile
```

**Request Body:** (partial update)

```json
{
  "currentFocus": "API optimization",
  "shortTermGoals": ["Launch beta", "Get 100 users", "Fix bugs"]
}
```

---

## API Reference

### Tasks

#### List All Tasks

```http
GET /api/tasks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `projectId` | string | Filter by project |
| `limit` | number | Max results (default: 100) |
| `offset` | number | Pagination offset |

**Response:** Tasks grouped by status

```json
{
  "all": [...],
  "recurring": [...],
  "inProgress": [...],
  "backlog": [...],
  "review": [...],
  "completed": [...],
  "blocked": [...]
}
```

#### Create Task

```http
POST /api/tasks
```

**Request Body:**

```json
{
  "title": "Implement OAuth2 login",
  "description": "Add Google and GitHub OAuth providers",
  "status": "BACKLOG",
  "priority": "HIGH",
  "projectId": "clxxx456",
  "isRecurring": false,
  "notes": "Check NextAuth.js docs first",
  "blocker": null,
  "need": "Google Cloud credentials"
}
```

**Required:** `title`  
**Defaults:** `status: "BACKLOG"`, `priority: "MEDIUM"`

#### Get Single Task

```http
GET /api/tasks/:id
```

#### Update Task

```http
PATCH /api/tasks/:id
```

**Request Body:** (partial update)

```json
{
  "status": "IN_PROGRESS",
  "startedAt": "2026-02-16T10:00:00.000Z"
}
```

**Auto-set fields:**
- `status: "IN_PROGRESS"` → sets `startedAt` if not provided
- `status: "COMPLETED"` → sets `completedAt` if not provided

#### Delete Task

```http
DELETE /api/tasks/:id
```

#### Search Tasks (Semantic)

```http
GET /api/tasks/search?q=payment+integration
```

Uses AI embeddings to find semantically similar tasks, not just keyword matches.

**Response:**

```json
{
  "results": [
    {
      "task": { "id": "...", "title": "..." },
      "similarity": 0.89
    }
  ]
}
```

---

### Subtasks

#### List Subtasks

```http
GET /api/tasks/:taskId/subtasks
```

#### Create Subtask

```http
POST /api/tasks/:taskId/subtasks
```

**Request Body:**

```json
{
  "title": "Set up Stripe account",
  "completed": false
}
```

#### Update Subtask

```http
PATCH /api/subtasks/:id
```

#### Delete Subtask

```http
DELETE /api/subtasks/:id
```

---

### Projects

#### List Projects

```http
GET /api/projects
```

**Response:**

```json
[
  {
    "id": "clxxx123",
    "name": "Mission Control",
    "description": "Task management app",
    "color": "#6366f1",
    "taskCount": 15,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

#### Create Project

```http
POST /api/projects
```

**Request Body:**

```json
{
  "name": "Website Redesign",
  "description": "Complete overhaul of landing page",
  "color": "#f59e0b"
}
```

#### Update Project

```http
PATCH /api/projects/:id
```

#### Delete Project

```http
DELETE /api/projects/:id
```

**Note:** Deletes project but keeps tasks (sets `projectId` to null).

---

### Documents (Second Brain)

#### List Documents

```http
GET /api/documents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type (note, journal, concept, research) |
| `tag` | string | Filter by tag |
| `search` | string | Full-text search in title/content |

**Response:**

```json
{
  "documents": [...],
  "tags": ["ideas", "meeting-notes", "research"],
  "total": 42
}
```

#### Create Document

```http
POST /api/documents
```

**Request Body:**

```json
{
  "title": "API Design Decisions",
  "content": "## REST vs GraphQL\n\nWe decided to use REST because...",
  "type": "note",
  "tags": ["architecture", "api"]
}
```

#### Get Document

```http
GET /api/documents/:id
```

#### Update Document

```http
PATCH /api/documents/:id
```

#### Delete Document

```http
DELETE /api/documents/:id
```

---

### Labels

#### List Labels

```http
GET /api/labels
```

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

#### Update Label

```http
PATCH /api/labels/:id
```

#### Delete Label

```http
DELETE /api/labels/:id
```

---

### Activity Log

#### Get Activity Feed

```http
GET /api/activity
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 50) |
| `taskId` | string | Filter by specific task |

**Response:**

```json
[
  {
    "id": "clxxx111",
    "action": "moved",
    "details": "{\"from\":\"BACKLOG\",\"to\":\"IN_PROGRESS\"}",
    "task": { "id": "clxxx789", "title": "Build new feature" },
    "createdAt": "2026-02-16T12:00:00.000Z"
  }
]
```

**Actions:** `created`, `updated`, `moved`, `completed`, `deleted`

---

## Bot Best Practices

### 1. Check for Existing Tasks First

Always search before creating to avoid duplicates:

```typescript
// 1. Search for similar tasks
const searchRes = await fetch(
  `${BASE_URL}/tasks/search?q=${encodeURIComponent(title)}`,
  { headers: { Authorization: `Bearer ${API_KEY}` } }
);
const { results } = await searchRes.json();

// 2. Only create if no high-similarity matches found
if (!results.some(r => r.similarity > 0.85)) {
  // Create the task
}
```

### 2. Use Profile Context

Read the user's profile to create relevant, personalized tasks:

```typescript
const profileRes = await fetch(`${BASE_URL}/user/profile`, {
  headers: { Authorization: `Bearer ${API_KEY}` }
});
const profile = await profileRes.json();

// Use context for better task creation
if (profile.currentFocus) {
  task.notes = `Related to current focus: ${profile.currentFocus}`;
}
```

### 3. Set Appropriate Status

- Use `RECURRING` for daily/weekly tasks
- Use `BACKLOG` for ideas and future work
- Move to `IN_PROGRESS` when actively working
- Mark `BLOCKED` when waiting on external factors

### 4. Organize with Projects

Group related tasks into projects:

```typescript
// Create project if it doesn't exist
const projectRes = await fetch(`${BASE_URL}/projects`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Q1 Marketing Campaign',
    color: '#8b5cf6'
  })
});
const project = await projectRes.json();

// Create task in project
await fetch(`${BASE_URL}/tasks`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    title: 'Design landing page',
    projectId: project.id
  })
});
```

### 5. Track Progress with Subtasks

Break down complex tasks:

```typescript
// Create main task
const task = await createTask({ title: 'Launch new feature' });

// Add subtasks
await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify([
    { title: 'Design mockups' },
    { title: 'Implement frontend' },
    { title: 'Write tests' },
    { title: 'Deploy to production' }
  ])
});
```

### 6. Document Decisions

Use the Second Brain to capture important context:

```typescript
await fetch(`${BASE_URL}/documents`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    title: `Decision: ${decisionTitle}`,
    content: decisionContext,
    type: 'note',
    tags: ['decisions', 'architecture']
  })
});
```

---

## OpenClaw Integration Example

### Configuration

```yaml
# openclaw.config.yaml
tools:
  mission-control:
    name: "Mission Control"
    description: "AI-powered task management"
    baseUrl: "https://moltmc.app/api"
    headers:
      Authorization: "Bearer ${MC_API_KEY}"
      X-Agent-Source: "openclaw-main"
    endpoints:
      tasks:
        list: { method: "GET", path: "/tasks" }
        create: { method: "POST", path: "/tasks" }
        update: { method: "PATCH", path: "/tasks/:id" }
        search: { method: "GET", path: "/tasks/search?q=:query" }
      profile:
        get: { method: "GET", path: "/user/profile" }
```

### TypeScript Helper Class

```typescript
class MissionControlClient {
  private baseUrl = 'https://moltmc.app/api';
  private apiKey: string;
  private agentSource: string;

  constructor(apiKey: string, agentSource = 'openclaw-main') {
    this.apiKey = apiKey;
    this.agentSource = agentSource;
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Agent-Source': this.agentSource,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async getProfile() {
    return this.request('/user/profile');
  }

  async listTasks(filters?: { status?: string; projectId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    return this.request(`/tasks?${params}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    projectId?: string;
  }) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchTasks(query: string) {
    return this.request(`/tasks/search?q=${encodeURIComponent(query)}`);
  }

  async updateTask(id: string, data: Partial<Task>) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createDocument(data: {
    title: string;
    content: string;
    type?: string;
    tags?: string[];
  }) {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

### Usage Example

```typescript
const mc = new MissionControlClient(process.env.MC_API_KEY!);

// Get user context
const profile = await mc.getProfile();
console.log(`Working with ${profile.name}, focused on: ${profile.currentFocus}`);

// Check for existing tasks before creating
const searchResults = await mc.searchTasks('implement authentication');
if (searchResults.results.length > 0) {
  console.log('Similar tasks already exist:', searchResults.results);
} else {
  // Create new task
  const task = await mc.createTask({
    title: 'Implement JWT authentication',
    description: 'Add secure JWT-based auth to API endpoints',
    priority: 'HIGH',
    status: 'BACKLOG',
  });
  console.log('Created task:', task.id);
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Request completed |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Invalid or missing API key |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate (e.g., email exists) |
| 500 | Server Error | Retry or contact support |

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": { "field": "title", "message": "Title is required" }
}
```

---

## Rate Limits

- **Free tier:** 60 requests/minute, 1,000/day
- **Pro tier:** 300 requests/minute, 10,000/day

Rate limit headers in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1706443200
```

---

## Support

- **Documentation:** https://moltmc.app/docs
- **API Status:** https://status.moltmc.app
- **Issues:** Contact support with your `X-Agent-Source` header value

---

**Generated for Mission Control v1.0**  
**This skill file is automatically updated - check for updates at /settings/api-keys**
