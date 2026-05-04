import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        totalAmount: true,
        deliveryCharge: true,
        paymentStatus: true,
        shippingStatus: true,
        awbCode: true,
        courierName: true,
        createdAt: true,
        shippingAddress: true,
        orderItems: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: { name: true, image: true, isDigital: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(orders)
  } catch (error) {
    console.error('[USER_ORDERS_ERROR]', error)
    return serverErrorResponse()
  }
}
