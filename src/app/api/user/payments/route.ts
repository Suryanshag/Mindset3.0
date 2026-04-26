import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        razorpayPaymentId: true,
        session: {
          select: { date: true },
        },
        order: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(payments)
  } catch (error) {
    console.error('[USER_PAYMENTS_ERROR]', error)
    return serverErrorResponse()
  }
}
