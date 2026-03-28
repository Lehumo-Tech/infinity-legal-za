import { NextResponse } from 'next/server'
import { submitIntake } from '@/lib/modules/intake'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await submitIntake(body)

    if (result.success) {
      return NextResponse.json(
        { success: true, caseId: result.caseId },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
