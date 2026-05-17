import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

/**
 * Polled by the client after a Razorpay capture to wait for the webhook
 * to flip Payment.status. Returns the current status only — the client
 * decides when to stop polling (timeout, success, or hard failure).
 *
 * Auth-gated on Payment.userId === current user so a user can't peek at
 * someone else's payment status by id-guessing.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const { paymentId } = await ctx.params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { userId: true, status: true, type: true, workshopId: true },
    })

    if (!payment) return errorResponse('Payment not found', 404)
    if (payment.userId !== session.user.id) return errorResponse('Forbidden', 403)

    return successResponse({
      status: payment.status,
      type: payment.type,
      workshopId: payment.workshopId,
    })
  } catch (error) {
    console.error('[PAYMENT_STATUS]', error)
    return serverErrorResponse()
  }
}
