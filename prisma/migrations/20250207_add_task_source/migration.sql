-- Migration: Add source field to Task model for agent separation
-- Created: 2025-02-07

-- Add source column to task table
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "source" TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "task_userId_source_idx" ON "task"("user_id", "source");
CREATE INDEX IF NOT EXISTS "task_userId_title_source_status_idx" ON "task"("user_id", "title", "source", "status");

-- Add comment explaining the field
COMMENT ON COLUMN "task"."source" IS 'Agent source identifier (e.g., agent-main, agent-worker-1) for preventing duplicate tasks across multiple agents';
