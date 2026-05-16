import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const { id } = await ctx.params

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, isDigital: true },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            status: true,
            razorpayPaymentId: true,
            createdAt: true,
          },
        },
      },
    })

    if (!order) return errorResponse('Order not found', 404)

    return successResponse(order)
  } catch (error) {
    console.error('[USER_ORDER_DETAIL]', error)
    return serverErrorResponse()
  }
}
