import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function serverErrorResponse() {
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
