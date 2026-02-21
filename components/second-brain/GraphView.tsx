'use client'

import { useEffect, useRef, useMemo, useState } from 'react'

interface Document {
  id: string
  title: string
  content: string
  type: 'note' | 'journal' | 'concept' | 'research'
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface GraphViewProps {
  documents: Document[]
  onSelectDoc: (doc: Document) => void
}

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  doc: Document
}

interface Edge {
  source: string
  target: string
}

export function GraphView({ documents, onSelectDoc }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const animationRef = useRef<number | null>(null)

  // Build nodes and edges
  const { nodes, edges } = useMemo(() => {
    const width = containerRef.current?.clientWidth || 800
    const height = containerRef.current?.clientHeight || 600
    
    const nodeList: Node[] = documents.map((doc, i) => ({
      id: doc.id,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      doc,
    }))
    
    const edgeList: Edge[] = []
    
    // Build edges based on wiki links [[Document Title]]
    const titleToId = new Map(documents.map(d => [d.title.toLowerCase(), d.id]))
    
    for (const doc of documents) {
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
      const matches = [...doc.content.matchAll(wikiLinkRegex)]
      
      for (const match of matches) {
        const linkedTitle = match[1].toLowerCase()
        const targetId = titleToId.get(linkedTitle)
        
        if (targetId && targetId !== doc.id) {
          edgeList.push({ source: doc.id, target: targetId })
        }
      }
    }
    
    return { nodes: nodeList, edges: edgeList }
  }, [documents])

  // Initialize nodes/edges
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  // Force simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    // Check if dark mode
    const isDark = document.documentElement.classList.contains('dark')
    const bgColor = isDark ? '#0f172a' : '#ffffff'
    const edgeColor = isDark ? 'rgba(148, 163, 184, 0.3)' : '#e5e7eb'
    const textColor = isDark ? '#e2e8f0' : '#374151'
    
    const simulate = () => {
      const nodeList = nodesRef.current
      const edgeList = edgesRef.current
      
      // Repulsion (nodes push apart)
      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const a = nodeList[i]
          const b = nodeList[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 2000 / (dist * dist)
          
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          a.vx -= fx
          a.vy -= fy
          b.vx += fx
          b.vy += fy
        }
      }
      
      // Attraction (edges pull together)
      for (const edge of edgeList) {
        const a = nodeList.find(n => n.id === edge.source)
        const b = nodeList.find(n => n.id === edge.target)
        if (!a || !b) continue
        
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = dist * 0.01
        
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
      
      // Center gravity
      for (const node of nodeList) {
        const dx = width / 2 - node.x
        const dy = height / 2 - node.y
        node.vx += dx * 0.001
        node.vy += dy * 0.001
        
        // Damping
        node.vx *= 0.9
        node.vy *= 0.9
        
        // Update position
        node.x += node.vx
        node.y += node.vy
        
        // Bounds
        node.x = Math.max(30, Math.min(width - 30, node.x))
        node.y = Math.max(30, Math.min(height - 30, node.y))
      }
      
      // Draw
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
      
      // Draw edges
      ctx.strokeStyle = edgeColor
      ctx.lineWidth = 1
      for (const edge of edgeList) {
        const a = nodeList.find(n => n.id === edge.source)
        const b = nodeList.find(n => n.id === edge.target)
        if (!a || !b) continue
        
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      
      // Draw nodes
      for (const node of nodeList) {
        const isHovered = hoveredNode === node.id
        
        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, isHovered ? 25 : 20, 0, Math.PI * 2)
        ctx.fillStyle = getNodeColor(node.doc.type, isHovered)
        ctx.fill()
        
        // Border
        ctx.strokeStyle = isDark ? '#1e293b' : '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Label
        ctx.fillStyle = textColor
        ctx.font = isHovered ? 'bold 12px sans-serif' : '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Truncate title
        let title = node.doc.title
        if (title.length > 15) {
          title = title.slice(0, 12) + '...'
        }
        ctx.fillText(title, node.x, node.y + 35)
      }
      
      animationRef.current = requestAnimationFrame(simulate)
    }
    
    simulate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hoveredNode])

  const getNodeColor = (type: Document['type'], isHovered: boolean): string => {
    const alpha = isHovered ? '1' : '0.85'
    switch (type) {
      case 'concept': return `rgba(251, 191, 36, ${alpha})` // amber
      case 'research': return `rgba(96, 165, 250, ${alpha})` // blue
      case 'journal': return `rgba(74, 222, 128, ${alpha})` // green
      default: return `rgba(148, 163, 184, ${alpha})` // slate
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Find hovered node
    let hovered: string | null = null
    for (const node of nodesRef.current) {
      const dx = x - node.x
      const dy = y - node.y
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        hovered = node.id
        break
      }
    }
    setHoveredNode(hovered)
    
    if (isDragging) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x) * 0.01,
        y: offset.y + (e.clientY - dragStart.y) * 0.01,
      })
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleClick = () => {
    if (hoveredNode) {
      const doc = documents.find(d => d.id === hoveredNode)
      if (doc) onSelectDoc(doc)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.5, Math.min(2, s * delta)))
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-background">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => {
          setIsDragging(true)
          setDragStart({ x: e.clientX, y: e.clientY })
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false)
          setHoveredNode(null)
        }}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-pointer"
        style={{ transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)` }}
      />
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setScale(s => Math.min(2, s * 1.2))}
          className="px-3 py-2 bg-card text-card-foreground rounded-lg shadow border border-border hover:bg-muted transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.5, s * 0.8))}
          className="px-3 py-2 bg-card text-card-foreground rounded-lg shadow border border-border hover:bg-muted transition-colors"
        >
          -
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
          className="px-3 py-2 bg-card text-card-foreground rounded-lg shadow border border-border hover:bg-muted transition-colors"
        >
          Reset
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur rounded-lg shadow border border-border p-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="text-foreground">Concepts</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
          <span className="text-foreground">Research</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-green-400"></span>
          <span className="text-foreground">Journals</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          <span className="text-foreground">Notes</span>
        </div>
      </div>
    </div>
  )
}
