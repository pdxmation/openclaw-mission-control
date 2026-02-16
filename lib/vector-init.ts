import { prisma } from './prisma'

const EMBEDDING_DIMENSIONS = 1536
const EMBEDDING_MODEL = 'text-embedding-ada-002'

/**
 * Check if vector table exists
 */
async function tableExists(): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task_embedding'
      )`
    )
    return result[0]?.exists === true
  } catch {
    return false
  }
}

/**
 * Initialize pgvector extension and create embeddings table
 * Checks if table exists each time (handles multiple workers)
 */
export async function ensureVectorStore(): Promise<void> {
  // Quick check if table already exists
  if (await tableExists()) return
  
  try {
    // Enable pgvector extension
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
    
    // Create embeddings table if not exists (explicit public schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.task_embedding (
        id TEXT PRIMARY KEY,
        task_id TEXT UNIQUE NOT NULL,
        embedding vector(${EMBEDDING_DIMENSIONS}),
        model TEXT DEFAULT '${EMBEDDING_MODEL}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    // Add foreign key if not exists (separate statement to handle existing tables)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE public.task_embedding 
        ADD CONSTRAINT task_embedding_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.task(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    
    console.log('✓ Vector store ready')
  } catch (error) {
    // Log but don't crash - pgvector might not be available
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('Vector store init warning:', errorMessage)
  }
}
