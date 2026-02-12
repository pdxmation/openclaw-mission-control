// Agent types for the Mission Control dashboard

export type AgentStatus = 'online' | 'busy' | 'idle' | 'offline'

export interface Agent {
  id: string              // R2D2, C3PO, etc.
  name: string            // R2-D2, C-3PO
  emoji: string           // 🤖, 🤖✨
  description: string     // Role description
  status: AgentStatus
  totalTasks: number
  inProgressTasks: number
  completedToday: number
  lastActivity: string | null  // ISO date string
  currentTask?: {
    id: string
    title: string
  }
}

export interface AgentStats {
  agents: Agent[]
  updatedAt: string
}

export interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  agentEmoji: string
  action: 'started' | 'completed' | 'moved' | 'created' | 'blocked' | 'updated'
  taskTitle: string
  taskId: string
  timestamp: string
  details?: string
}

// Agent configuration
export const AGENTS_CONFIG: Record<string, Omit<Agent, 'status' | 'totalTasks' | 'inProgressTasks' | 'completedToday' | 'lastActivity' | 'currentTask'>> = {
  R2D2: {
    id: 'R2D2',
    name: 'R2-D2',
    emoji: '🤖',
    description: 'Primary coordinator, development work, system operations',
  },
  C3PO: {
    id: 'C3PO',
    name: 'C-3PO',
    emoji: '🤖✨',
    description: 'Communication, emails, protocol, client outreach',
  },
  SABINE: {
    id: 'SABINE',
    name: 'Sabine',
    emoji: '🎨',
    description: 'Creative, design, visuals, branding',
  },
  K2SO: {
    id: 'K2SO',
    name: 'K-2SO',
    emoji: '🤖⚔️',
    description: 'Polymarket trading agent operator',
  },
  CHOPPER: {
    id: 'CHOPPER',
    name: 'Chopper',
    emoji: '🔧',
    description: 'Developer, NextCRM project maintainer',
  },
}
