import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

/**
 * Admin-only read of a Payment row + its Razorpay-side state.
 * Used by /admin/reconcile-payments to answer "did Razorpay actually
 * capture this, even though our DB still says PENDING?"
 *
 * No mutation. No side effects. Just fetches.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const paymentId = req.nextUrl.searchParams.get('paymentId')
    if (!paymentId) return errorResponse('Missing paymentId', 400)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workshop: { select: { id: true, title: true } },
        session: { select: { id: true, date: true } },
      },
    })
    if (!payment) return errorResponse('Payment not found', 404)
    if (!payment.razorpayOrderId) {
      return errorResponse('Payment has no razorpayOrderId — nothing to check', 400)
    }

    // Pull the Razorpay-side view of this order + any captures
    let razorpayOrder: Record<string, unknown> | null = null
    let razorpayPayments: Array<Record<string, unknown>> = []
    let razorpayError: string | null = null
    try {
      razorpayOrder = await razorpay.orders.fetch(payment.razorpayOrderId) as unknown as Record<string, unknown>
      const list = await razorpay.orders.fetchPayments(payment.razorpayOrderId)
      razorpayPayments = (list.items as unknown as Array<Record<string, unknown>>) ?? []
    } catch (err) {
      const e = err as { error?: { description?: string }, message?: string }
      razorpayError = e.error?.description ?? e.message ?? String(err)
    }

    // The captured payment (if any) is what we'd use to reconcile.
    const capturedPayment = razorpayPayments.find(
      (p) => p.status === 'captured' || p.captured === true
    ) ?? null

    return successResponse({
      payment: {
        id: payment.id,
        type: payment.type,
        status: payment.status,
        amount: payment.amount.toString(),
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        createdAt: payment.createdAt,
        workshopId: payment.workshopId,
        sessionId: payment.sessionId,
        orderId: payment.orderId,
        user: payment.user,
        workshop: payment.workshop,
        session: payment.session,
      },
      razorpay: razorpayError
        ? { error: razorpayError }
        : {
            order: razorpayOrder,
            payments: razorpayPayments,
            capturedPayment,
            isCapturedButOurRowPending:
              !!capturedPayment && payment.status === 'PENDING',
          },
    })
  } catch (error) {
    console.error('[ADMIN_CHECK_RAZORPAY]', error)
    return serverErrorResponse()
  }
}
