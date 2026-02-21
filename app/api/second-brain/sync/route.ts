import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

const SECOND_BRAIN_DIR = process.env.SECOND_BRAIN_DIR || '/Users/pavel-clawdbot/2nd-brain'

/**
 * GET /api/second-brain/sync
 * Sync local ~/2nd-brain/ files with Mission Control documents
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    // Ensure 2nd-brain directory exists
    if (!existsSync(SECOND_BRAIN_DIR)) {
      await fs.mkdir(SECOND_BRAIN_DIR, { recursive: true })
    }

    // Get all markdown files from 2nd-brain directory
    const files = await getMarkdownFiles(SECOND_BRAIN_DIR)
    
    const synced: string[] = []
    const errors: string[] = []

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const relativePath = path.relative(SECOND_BRAIN_DIR, filePath)
        const title = path.basename(filePath, '.md')
        
        // Parse frontmatter if exists
        const { frontmatter, body } = parseFrontmatter(content)
        
        // Determine document type from path or frontmatter
        const type = frontmatter.type || 
          (relativePath.includes('journal') ? 'journal' :
           relativePath.includes('concept') ? 'concept' :
           relativePath.includes('research') ? 'research' : 'note')
        
        // Check if document already exists
        const existingDoc = await prisma.document.findFirst({
          where: {
            userId,
            title,
          },
        })

        if (existingDoc) {
          // Update if content changed
          if (existingDoc.content !== body) {
            await prisma.document.update({
              where: { id: existingDoc.id },
              data: {
                content: body,
                type,
                tags: frontmatter.tags || [],
                updatedAt: new Date(),
              },
            })
            synced.push(`Updated: ${relativePath}`)
          }
        } else {
          // Create new document
          await prisma.document.create({
            data: {
              userId,
              title,
              content: body,
              type,
              tags: frontmatter.tags || [],
            },
          })
          synced.push(`Created: ${relativePath}`)
        }
      } catch (err) {
        errors.push(`Failed: ${filePath} - ${err}`)
      }
    }

    return NextResponse.json({
      synced,
      errors,
      totalFiles: files.length,
    })
  } catch (error) {
    console.error('Error syncing 2nd brain:', error)
    return NextResponse.json(
      { error: 'Failed to sync files' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/second-brain/sync
 * Export Mission Control documents to ~/2nd-brain/
 */
export async function POST(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    // Get all user's documents
    const documents = await prisma.document.findMany({
      where: { userId },
    })

    const exported: string[] = []
    const errors: string[] = []

    for (const doc of documents) {
      try {
        // Create file path based on type
        const typeDir = path.join(SECOND_BRAIN_DIR, doc.type + 's')
        if (!existsSync(typeDir)) {
          await fs.mkdir(typeDir, { recursive: true })
        }

        const filePath = path.join(typeDir, `${sanitizeFilename(doc.title)}.md`)
        
        // Create frontmatter
        const frontmatter = `---
title: ${doc.title}
type: ${doc.type}
tags: [${doc.tags.join(', ')}]
created: ${doc.createdAt.toISOString()}
updated: ${doc.updatedAt.toISOString()}
---

`
        
        await fs.writeFile(filePath, frontmatter + doc.content, 'utf-8')
        exported.push(filePath)
      } catch (err) {
        errors.push(`Failed: ${doc.title} - ${err}`)
      }
    }

    return NextResponse.json({
      exported,
      errors,
      totalDocuments: documents.length,
    })
  } catch (error) {
    console.error('Error exporting documents:', error)
    return NextResponse.json(
      { error: 'Failed to export documents' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }
  
  await walk(dir)
  return files
}

function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  if (!match) {
    return { frontmatter: {}, body: content }
  }
  
  const frontmatterText = match[1]
  const body = match[2]
  
  // Simple YAML-like parsing
  const frontmatter: Record<string, any> = {}
  for (const line of frontmatterText.split('\n')) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim()
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
      } else {
        frontmatter[key.trim()] = value.replace(/^["']|["']$/g, '')
      }
    }
  }
  
  return { frontmatter, body }
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100)
}
