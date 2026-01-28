import { NextRequest, NextResponse } from 'next/server'
import { validateApiToken, unauthorizedResponse } from '../../../../../lib/api-auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/debug
 * Debug vector store setup
 */
export async function GET(request: NextRequest) {
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  const results: any = {}

  // Check if pgvector extension exists
  try {
    const extensions = await prisma.$queryRawUnsafe<Array<{ extname: string }>>(
      `SELECT extname FROM pg_extension WHERE extname = 'vector'`
    )
    results.pgvectorInstalled = extensions.length > 0
  } catch (error: any) {
    results.pgvectorCheck = error.message
  }

  // Try to create extension
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
    results.createExtension = 'success'
  } catch (error: any) {
    results.createExtension = error.message
  }

  // Check available extensions
  try {
    const available = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM pg_available_extensions WHERE name = 'vector'`
    )
    results.vectorAvailable = available.length > 0
  } catch (error: any) {
    results.vectorAvailable = error.message
  }

  // Check if table exists
  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_embedding'`
    )
    results.tableExists = tables.length > 0
  } catch (error: any) {
    results.tableCheck = error.message
  }

  // Try to create table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.task_embedding_test (
        id TEXT PRIMARY KEY,
        task_id TEXT UNIQUE NOT NULL
      )
    `)
    results.createTestTable = 'success'
    
    // Drop test table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.task_embedding_test`)
  } catch (error: any) {
    results.createTestTable = error.message
  }

  // Check current schema
  try {
    const schema = await prisma.$queryRawUnsafe<Array<{ current_schema: string }>>(
      `SELECT current_schema()`
    )
    results.currentSchema = schema[0]?.current_schema
  } catch (error: any) {
    results.schemaCheck = error.message
  }

  return NextResponse.json(results)
}
