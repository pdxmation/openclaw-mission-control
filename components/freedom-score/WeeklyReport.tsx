'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WeeklyReport {
  score: {
    overall: number
    financial: number
    time: number
    health: number
    systems: number
    trend: number
    runwayMonths: number
    hoursWorked: number
    sleepAvg: number
    aiPrsMerged: number
  }
  label: string
  wins: string[]
  focusAreas: string[]
}

export function WeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/freedom-score/report', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch (err) {
      console.error('Failed to load report')
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return null
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">
          📊 Weekly Freedom Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${getScoreColor(report.score.overall)}`}>
            {report.score.overall}
          </div>
          <div>
            <div className="text-xl font-medium">{report.label}</div>
            {report.score.trend !== 0 && (
              <div className={`text-sm ${report.score.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {report.score.trend > 0 ? '↑' : '↓'} {Math.abs(report.score.trend)} from last week
              </div>
            )}
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <span className="flex items-center gap-2">💰 Financial</span>
            <span className="font-medium">{report.score.financial}/100</span>
          </div>
          <div className="text-sm text-muted-foreground pl-3">
            Runway: {report.score.runwayMonths} months
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="flex items-center gap-2">⏱️ Time</span>
            <span className="font-medium">{report.score.time}/100</span>
          </div>
          <div className="text-sm text-muted-foreground pl-3">
            Hours worked: {report.score.hoursWorked}
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="flex items-center gap-2">😴 Health</span>
            <span className="font-medium">{report.score.health}/100</span>
          </div>
          <div className="text-sm text-muted-foreground pl-3">
            Sleep avg: {report.score.sleepAvg} hrs
          </div>

          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="flex items-center gap-2">🤖 Systems</span>
            <span className="font-medium">{report.score.systems}/100</span>
          </div>
          <div className="text-sm text-muted-foreground pl-3">
            AI PRs merged: {report.score.aiPrsMerged}
          </div>
        </div>

        {/* Wins */}
        {report.wins.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">🏆 Wins this week</h4>
            <ul className="space-y-2">
              {report.wins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span>•</span>
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Focus Areas */}
        <div>
          <h4 className="font-medium mb-3">⚠️ Focus this week</h4>
          <ul className="space-y-2">
            {report.focusAreas.map((focus, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-600">
                <span>•</span>
                <span>{focus}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
