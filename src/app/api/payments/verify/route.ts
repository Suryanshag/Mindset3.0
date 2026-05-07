import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return errorResponse('Missing payment fields', 400)
    }

    // Razorpay's recommended signature verification for order payments
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return errorResponse('Invalid payment signature', 400)
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    })

    if (!payment) return errorResponse('Payment not found', 404)
    if (payment.userId !== session.user.id) return errorResponse('Forbidden', 403)

    // Idempotent — already PAID is fine
    if (payment.status === 'PAID') return successResponse({ alreadyPaid: true })

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
      },
    })

    // Mirror what the webhook does for PRODUCT payments
    if (payment.type === 'PRODUCT' && payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'PAID' },
      })
    }

    return successResponse({ verified: true })
  } catch (error) {
    console.error('[VERIFY_PAYMENT_ERROR]', error)
    return serverErrorResponse()
  }
}
