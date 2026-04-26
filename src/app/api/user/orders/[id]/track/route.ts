import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trackShipment } from '@/lib/shiprocket'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const { id } = await params

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        shippingStatus: true,
        awbCode: true,
        courierName: true,
        trackingUrl: true,
        shiprocketOrderId: true,
      },
    })

    if (!order) return errorResponse('Order not found', 404)

    if (!order.awbCode) {
      return successResponse({
        shippingStatus: order.shippingStatus,
        awbCode: null,
        courierName: null,
        trackingActivities: [],
        message: 'Shipment is being prepared',
      })
    }

    try {
      const tracking = await trackShipment(order.awbCode)
      return successResponse({
        shippingStatus: order.shippingStatus,
        awbCode: order.awbCode,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
        currentStatus: tracking.current_status,
        estimatedDelivery: tracking.etd,
        deliveredDate: tracking.delivered_date,
        trackingActivities: tracking.shipment_track_activities.slice(0, 10),
      })
    } catch (err) {
      console.error('[TRACK] Failed to fetch live tracking:', err)
      return successResponse({
        shippingStatus: order.shippingStatus,
        awbCode: order.awbCode,
        courierName: order.courierName,
        trackingActivities: [],
        message: 'Live tracking temporarily unavailable',
      })
    }
  } catch (error) {
    console.error('[TRACK_ERROR]', error)
    return serverErrorResponse()
  }
}
