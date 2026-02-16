-- Migration: Add Business and BusinessGoal models
-- Created: 2026-02-16

-- Create GoalStatus enum
DO $$ BEGIN
  CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Business table
CREATE TABLE IF NOT EXISTS "business" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "industry" TEXT,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "user_id" TEXT NOT NULL,
  
  CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- Create BusinessGoal table
CREATE TABLE IF NOT EXISTS "business_goal" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "target_date" TIMESTAMP(3),
  "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "business_id" TEXT NOT NULL,
  
  CONSTRAINT "business_goal_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "business" ADD CONSTRAINT "business_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_goal" ADD CONSTRAINT "business_goal_business_id_fkey" 
  FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "business_user_id_idx" ON "business"("user_id");
CREATE INDEX IF NOT EXISTS "business_goal_business_id_idx" ON "business_goal"("business_id");
CREATE INDEX IF NOT EXISTS "business_goal_status_idx" ON "business_goal"("status");
