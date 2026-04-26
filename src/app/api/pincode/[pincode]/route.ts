import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { pincode: string } }
) {
  const { pincode } = params

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: 'Invalid pincode' },
      { status: 400 }
    )
  }

  try {
    console.log('[PINCODE] Fetching:', pincode)

    const res = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      }
    )

    console.log('[PINCODE] Response status:', res.status)

    if (!res.ok) throw new Error('India Post API failed')

    const data = await res.json()
    console.log('[PINCODE] Data:', JSON.stringify(data))

    if (
      !data?.[0] ||
      data[0].Status !== 'Success' ||
      !data[0].PostOffice?.length
    ) {
      return NextResponse.json(
        { success: false, error: 'Pincode not found' },
        { status: 404 }
      )
    }

    const postOffice = data[0].PostOffice[0]

    return NextResponse.json({
      success: true,
      data: {
        city: postOffice.District,
        state: postOffice.State,
        region: postOffice.Region,
        postOfficeName: postOffice.Name,
      },
    })
  } catch (error) {
    console.error('[PINCODE]', error)
    return NextResponse.json(
      { success: false, error: 'Could not fetch pincode data' },
      { status: 500 }
    )
  }
}
