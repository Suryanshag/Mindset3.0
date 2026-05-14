import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelShipment } from '@/lib/shiprocket'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403)
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        shiprocketOrderId: true,
        shippingStatus: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            product: { select: { isDigital: true } },
          },
        },
      },
    })

    if (!order) return errorResponse('Order not found', 404)

    if (!order.shiprocketOrderId) {
      return errorResponse('No Shiprocket shipment found for this order', 400)
    }

    if (['DELIVERED', 'RETURNED'].includes(order.shippingStatus)) {
      return errorResponse(
        'Cannot cancel a delivered or returned order',
        400
      )
    }

    await cancelShipment([order.shiprocketOrderId])

    await prisma.$transaction(async (tx) => {
      // Restore stock for non-digital items
      for (const item of order.orderItems) {
        if (!item.product.isDigital) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }
      await tx.order.update({
        where: { id },
        data: { shippingStatus: 'RETURNED' },
      })
    }, { maxWait: 8000, timeout: 15000 })

    console.log('[ADMIN] Shipment cancelled for order:', id)

    return successResponse({ message: 'Shipment cancelled successfully' })
  } catch (error) {
    console.error('[ADMIN] Cancel shipment failed:', error)
    return serverErrorResponse()
  }
}
