import { NextResponse } from 'next/server'

// Endpoint deprecated 2026-05-19 (Sprint NGO-Dashboard). The public form
// that called this is now a redirect to the authenticated dashboard at
// /user/discover/ngo-visits. We keep the URL responding so anything still
// in flight during the deploy transition sees a clear deprecation signal
// instead of a confusing 404.
//
// New flow: the dashboard calls the registerForNgoVisit server action in
// src/lib/actions/ngo.ts — there is no public POST replacement.

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has moved. Please register from /user/discover/ngo-visits.',
    },
    { status: 410 },
  )
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has moved. Please register from /user/discover/ngo-visits.',
    },
    { status: 410 },
  )
}
