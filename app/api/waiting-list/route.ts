import { NextRequest, NextResponse } from 'next/server'
import { submitWaitingListApplication } from '@/lib/waiting-list/actions'
import { waitingListSubmitSchema } from '@/lib/waiting-list/schemas'

/**
 * POST /api/waiting-list
 * Submit a waitlist application (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parseResult = waitingListSubmitSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const result = await submitWaitingListApplication(parseResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, id: result.data?.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in waitlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
