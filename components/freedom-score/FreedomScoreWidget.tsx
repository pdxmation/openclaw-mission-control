'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FreedomScore {
  id: string
  overall: number
  financial: number
  time: number
  health: number
  systems: number
  trend: number
  createdAt: string
}

export function FreedomScoreWidget() {
  const [score, setScore] = useState<FreedomScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScore()
  }, [])

  const fetchScore = async () => {
    try {
      const res = await fetch('/api/freedom-score', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setScore(data)
      } else if (res.status === 404) {
        // No score yet - not an error
        setScore(null)
      } else {
        setError('Failed to load freedom score')
      }
    } catch (err) {
      setError('Failed to load freedom score')
    } finally {
      setLoading(false)
    }
  }

  const calculateScore = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/freedom-score/calculate', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setScore(data)
      }
    } catch (err) {
      setError('Failed to calculate score')
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 90) return 'text-emerald-500'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-yellow-500'
    if (score >= 30) return 'text-orange-500'
    return 'text-red-500'
  }

  function getScoreLabel(score: number): string {
    if (score >= 90) return 'Fully Free'
    if (score >= 70) return 'Building Freedom'
    if (score >= 50) return 'Surviving'
    if (score >= 30) return 'Chaos Zone'
    return 'Emergency'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Freedom Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No freedom score calculated yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Update your profile with current runway, sleep target, and deep work hours,
              then calculate your first score.
            </p>
            <button
              onClick={calculateScore}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Calculate First Score
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          📊 Freedom Score
        </CardTitle>
        <button
          onClick={calculateScore}
          disabled={loading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          Recalculate
        </button>
      </CardHeader>
      <CardContent>
        {/* Main Score */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}
          </div>
          <div className="text-2xl font-medium mt-2">{getScoreLabel(score.overall)}</div>
          {score.trend !== 0 && (
            <div className={`text-sm mt-1 ${score.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {score.trend > 0 ? '↑' : '↓'} {Math.abs(score.trend)} from last week
            </div>
          )}
        </div>

        {/* Dimension Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Dimensions</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">💰 Financial (Runway)</span>
              <span className="text-sm font-medium">{score.financial}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${score.financial}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">⏱️ Time (Work/Life)</span>
              <span className="text-sm font-medium">{score.time}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${score.time}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">😴 Health (Sleep)</span>
              <span className="text-sm font-medium">{score.health}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${score.health}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">🤖 Systems (Automation)</span>
              <span className="text-sm font-medium">{score.systems}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${score.systems}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
          Last updated: {new Date(score.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
}
