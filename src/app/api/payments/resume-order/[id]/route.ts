import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const { id: orderId } = await params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        paymentStatus: 'PENDING',
      },
      include: {
        payment: true,
      },
    })

    if (!order) {
      return errorResponse('Order not found or already paid', 404)
    }

    // Check not older than 24 hours
    const ageMs = Date.now() - order.createdAt.getTime()
    if (ageMs > 24 * 60 * 60 * 1000) {
      return errorResponse(
        'This order has expired. Please start a new checkout.',
        400
      )
    }

    // Create a new Razorpay order for same amount
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100),
      currency: 'INR',
      receipt: `resume_${order.id.slice(-8)}`.substring(0, 40),
      notes: { orderId: order.id, userId: session.user.id },
    })

    // Update existing Payment or create new one
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          status: 'PENDING',
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          orderId: order.id,
          amount: Number(order.totalAmount),
          type: 'PRODUCT',
          razorpayOrderId: razorpayOrder.id,
          status: 'PENDING',
        },
      })
    }

    return successResponse({
      razorpayOrderId: razorpayOrder.id,
      amount: Math.round(Number(order.totalAmount) * 100),
      orderId: order.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })

  } catch (error) {
    console.error('[RESUME_ORDER_ERROR]', error)
    return serverErrorResponse()
  }
}
