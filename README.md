# Mission Control

AI agent task management dashboard with Second Brain document viewer. Built with Next.js, Prisma, and PostgreSQL.

**Live:** https://moltmc.app

## Features

- 📋 **Kanban Board** — Drag-and-drop task management (Backlog → In Progress → Review → Completed)
- 📄 **Second Brain** — Document viewer for notes, journals, research (Obsidian + Linear inspired)
- 🔍 **Semantic Search** — Vector embeddings for intelligent task/document search
- 🤖 **API-First** — Full REST API for Clawdbot integration
- 📱 **Responsive** — Mobile-friendly design

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database (with pgvector extension for search)

### 2. Environment Variables

```bash
cp .env.example .env
```

See `.env.example` for all required variables.

Generate secure tokens:
```bash
# API Token
openssl rand -hex 32

# Auth Secret
openssl rand -base64 32
```

### 3. Install & Run

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## API Reference

All endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer $API_TOKEN" https://moltmc.app/api/tasks
```

### Tasks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks (grouped by status) |
| GET | `/api/tasks?status=IN_PROGRESS` | Filter by status |
| GET | `/api/tasks?priority=HIGH` | Filter by priority |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/[id]` | Get single task |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |
| GET | `/api/tasks/search?q=query` | Semantic search |

#### Task Schema

```typescript
{
  title: string           // Required
  description?: string    // Details
  status: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  outcome?: string        // Result when completed
  blocker?: string        // What's blocking
  notes?: string          // Additional context
}
```

#### Examples

```bash
# Create task
curl -X POST "https://moltmc.app/api/tasks" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "New feature", "priority": "HIGH", "status": "BACKLOG"}'

# Update status
curl -X PATCH "https://moltmc.app/api/tasks/{id}" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED", "outcome": "Shipped to production"}'

# Delete task
curl -X DELETE "https://moltmc.app/api/tasks/{id}" \
  -H "Authorization: Bearer $API_TOKEN"
```

### Documents API (Second Brain)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| GET | `/api/documents?type=journal` | Filter by type |
| GET | `/api/documents?tag=research` | Filter by tag |
| GET | `/api/documents?search=query` | Text search |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/[id]` | Get single document |
| PATCH | `/api/documents/[id]` | Update document |
| DELETE | `/api/documents/[id]` | Delete document |

#### Document Schema

```typescript
{
  title: string           // Required
  content: string         // Markdown content
  type: 'note' | 'journal' | 'concept' | 'research'
  tags: string[]          // For organization
}
```

#### Examples

```bash
# Create document
curl -X POST "https://moltmc.app/api/documents" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Journal - 2026-01-29",
    "content": "# Summary\n\nWorked on...",
    "type": "journal",
    "tags": ["daily", "january"]
  }'

# List research documents
curl "https://moltmc.app/api/documents?type=research" \
  -H "Authorization: Bearer $API_TOKEN"
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:backup` | Create database backup |
| `npm run db:migrate` | **Backup + migrate** (dev) |
| `npm run db:migrate:deploy` | **Backup + migrate** (prod) |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio GUI |

## Database Backup & Restore

### Automatic Backups

Backups run **automatically before every migration** (`db:migrate` and `db:migrate:deploy`). No manual intervention needed.

### Manual Backup

```bash
npm run db:backup
# or
./scripts/backup.sh
```

Backups are saved to `backups/backup-YYYYMMDD-HHMMSS.sql.gz` (compressed, ~10x smaller).

### Restore from Backup

```bash
# Load DATABASE_URL from .env
export $(grep DATABASE_URL .env | xargs)

# Restore (pick your backup file)
gunzip -c backups/backup-20260615-143022.sql.gz | psql "$DATABASE_URL"
```

### Backup Retention

Only the last 10 backups are kept automatically. Older backups are cleaned up after each new backup.

## Clawdbot Integration

Add to your Clawdbot's `TOOLS.md`:

```markdown
### Mission Control
- **Dashboard:** https://moltmc.app
- **API:** https://moltmc.app/api/tasks
- **Docs API:** https://moltmc.app/api/documents
- **Token:** mission-control/.env → API_TOKEN
```

See `skills/mission-control/SKILL.md` for full Clawdbot skill documentation.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma
- **Search:** pgvector + OpenAI embeddings
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Better Auth
- **Hosting:** Coolify (self-hosted)

## License

MIT
