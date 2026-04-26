import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function mapShippingStatus(
  srStatus: string
): 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' {
  const status = srStatus.toLowerCase()

  if (status.includes('picked up') || status.includes('pickup')) {
    return 'PROCESSING'
  }
  if (
    status.includes('in transit') ||
    status.includes('out for delivery') ||
    status.includes('shipped')
  ) {
    return 'SHIPPED'
  }
  if (status.includes('delivered')) {
    return 'DELIVERED'
  }
  if (
    status.includes('rto') ||
    status.includes('returned') ||
    status.includes('cancelled')
  ) {
    return 'RETURNED'
  }
  return 'PROCESSING'
}

export async function POST(req: NextRequest) {
  console.log('[SR_WEBHOOK] Received Shiprocket webhook')

  try {
    const body = await req.json()

    console.log('[SR_WEBHOOK] Event:', body.event)
    console.log('[SR_WEBHOOK] AWB:', body.awb)
    console.log('[SR_WEBHOOK] Status:', body.current_status)

    const awbCode = body.awb
    const currentStatus = body.current_status
    const trackingUrl = body.tracking_url || null

    if (!awbCode) {
      console.log('[SR_WEBHOOK] No AWB code, skipping')
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findFirst({
      where: { awbCode },
      select: { id: true, shippingStatus: true },
    })

    if (!order) {
      console.log('[SR_WEBHOOK] No order found for AWB:', awbCode)
      return NextResponse.json({ received: true })
    }

    const newStatus = mapShippingStatus(currentStatus ?? '')

    if (order.shippingStatus === newStatus) {
      console.log('[SR_WEBHOOK] Status unchanged, skipping')
      return NextResponse.json({ received: true })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingStatus: newStatus,
        ...(trackingUrl ? { trackingUrl } : {}),
      },
    })

    console.log(
      `[SR_WEBHOOK] Order ${order.id} status: ${order.shippingStatus} → ${newStatus}`
    )

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[SR_WEBHOOK] Error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
