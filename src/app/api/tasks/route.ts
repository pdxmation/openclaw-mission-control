import { NextResponse } from 'next/server'
import { parseMissionControl } from '@/lib/parse-mission-control'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = parseMissionControl()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error parsing MISSION_CONTROL.md:', error)
    return NextResponse.json(
      { error: 'Failed to parse mission control data' },
      { status: 500 }
    )
  }
}
