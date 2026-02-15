'use client'

interface AgentSparklineProps {
  data: number[] // Array of 7 daily completion counts
  className?: string
}

export function AgentSparkline({ data, className = '' }: AgentSparklineProps) {
  const max = Math.max(...data, 1)
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - (value / max) * 100
    return `${x},${y}`
  }).join(' ')

  const hasActivity = data.some(d => d > 0)
  
  if (!hasActivity) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground text-[10px] ${className}`}>
        —
      </div>
    )
  }

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#sparklineGradient)"
        className="opacity-50"
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Data points */}
      {data.map((value, index) => {
        if (value === 0) return null
        const x = (index / (data.length - 1)) * 100
        const y = 100 - (value / max) * 100
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill="hsl(var(--primary))"
            className="opacity-80"
          />
        )
      })}
    </svg>
  )
}
