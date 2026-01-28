import fs from 'fs'
import path from 'path'

export interface InProgressTask {
  task: string
  started: string
  status: string
  notes: string
}

export interface BacklogTask {
  task: string
  priority: string
  notes: string
}

export interface CompletedTask {
  task: string
  completed: string
  outcome: string
}

export interface BlockedTask {
  task: string
  blocker: string
  need: string
}

export interface MissionControlData {
  lastUpdated: string
  inProgress: InProgressTask[]
  backlog: BacklogTask[]
  completed: CompletedTask[]
  blocked: BlockedTask[]
}

function parseTableRows(section: string, headers: string[]): Record<string, string>[] {
  const lines = section.split('\n').filter(line => line.startsWith('|') && !line.includes('---'))
  
  // Skip header row
  const dataRows = lines.slice(1)
  
  return dataRows.map(row => {
    const cells = row.split('|').slice(1, -1).map(cell => cell.trim())
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      obj[header] = cells[i] || ''
    })
    return obj
  })
}

export function parseMissionControl(): MissionControlData {
  const filePath = path.join(process.cwd(), 'MISSION_CONTROL.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract last updated from the file
  const lastUpdatedMatch = content.match(/\*Last updated: (.+)\*/)
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toISOString()
  
  // Split into sections
  const sections = content.split(/^## /m)
  
  let inProgress: InProgressTask[] = []
  let backlog: BacklogTask[] = []
  let completed: CompletedTask[] = []
  let blocked: BlockedTask[] = []
  
  for (const section of sections) {
    if (section.startsWith('🔥 IN PROGRESS')) {
      const rows = parseTableRows(section, ['task', 'started', 'status', 'notes'])
      inProgress = rows.map(r => ({
        task: r.task || '',
        started: r.started || '',
        status: r.status || '',
        notes: r.notes || ''
      }))
    } else if (section.startsWith('📋 BACKLOG')) {
      const rows = parseTableRows(section, ['task', 'priority', 'notes'])
      backlog = rows.map(r => ({
        task: r.task || '',
        priority: r.priority || '',
        notes: r.notes || ''
      }))
    } else if (section.startsWith('✅ COMPLETED')) {
      const rows = parseTableRows(section, ['task', 'completed', 'outcome'])
      completed = rows.map(r => ({
        task: r.task || '',
        completed: r.completed || '',
        outcome: r.outcome || ''
      }))
    } else if (section.startsWith('🚧 BLOCKED')) {
      const rows = parseTableRows(section, ['task', 'blocker', 'need'])
      blocked = rows.map(r => ({
        task: r.task || '',
        blocker: r.blocker || '',
        need: r.need || ''
      }))
    }
  }
  
  return {
    lastUpdated,
    inProgress,
    backlog,
    completed,
    blocked
  }
}
