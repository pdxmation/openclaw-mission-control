# Mission Control

R2's task management dashboard with Prisma + PostgreSQL backend.

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Set your database URL and API token:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mission_control?schema=public"
API_TOKEN="your-secure-random-token"
```

Generate a secure token:
```bash
openssl rand -hex 32
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create a migration (production)
npm run db:migrate

# Seed initial data from MISSION_CONTROL.md
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

## API Endpoints

All endpoints require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer your-token" http://localhost:3000/api/tasks
```

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks (grouped by status) |
| GET | `/api/tasks?status=IN_PROGRESS` | Filter by status |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/[id]` | Get single task |
| PATCH | `/api/tasks/[id]` | Update a task |
| DELETE | `/api/tasks/[id]` | Delete a task |

### Task Schema

```typescript
{
  title: string           // Task name
  status: 'IN_PROGRESS' | 'BACKLOG' | 'COMPLETED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  startedAt?: Date        // When work started
  statusNote?: string     // e.g., "Queued", "In Review"
  completedAt?: Date      // When completed
  outcome?: string        // Result description
  blocker?: string        // What's blocking
  need?: string          // What's needed to unblock
  notes?: string         // General notes
}
```

### Example: Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"title": "New feature", "priority": "HIGH"}'
```

### Example: Update Task Status

```bash
curl -X PATCH http://localhost:3000/api/tasks/task-id \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED", "outcome": "Shipped to prod"}'
```

## NPM Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to DB (dev)
- `npm run db:migrate` - Create migration
- `npm run db:seed` - Seed initial data
- `npm run db:studio` - Open Prisma Studio GUI
