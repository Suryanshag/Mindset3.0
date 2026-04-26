import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createShipmentForOrder } from '@/lib/create-shipment-for-order'
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
        paymentStatus: true,
        shiprocketOrderId: true,
      },
    })

    if (!order) return errorResponse('Order not found', 404)

    if (order.paymentStatus !== 'PAID') {
      return errorResponse('Order is not paid yet', 400)
    }

    if (order.shiprocketOrderId) {
      return errorResponse('Shipment already exists', 400)
    }

    await createShipmentForOrder(id)

    return successResponse({ message: 'Shipment creation initiated' })
  } catch (error) {
    console.error('[ADMIN] Retry shipment failed:', error)
    return serverErrorResponse()
  }
}
