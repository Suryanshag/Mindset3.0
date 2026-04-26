import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        createdAt: true,
        session: {
          select: {
            id: true,
            date: true,
            status: true,
            meetLink: true,
            doctor: {
              select: {
                user: { select: { name: true } },
                designation: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            shippingStatus: true,
            awbCode: true,
            orderItems: {
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        studyMaterialId: true,
      },
    })

    if (!payment) return errorResponse('Payment not found', 404)
    if (payment.type !== 'EBOOK') {
      // For SESSION and PRODUCT, verify ownership through relations
      // handled by userId check below
    }

    // Verify ownership
    const paymentWithUser = await prisma.payment.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (paymentWithUser?.userId !== session.user.id) {
      return errorResponse('Forbidden', 403)
    }

    // If EBOOK, fetch study material title
    let studyMaterial = null
    if (payment.type === 'EBOOK' && payment.studyMaterialId) {
      studyMaterial = await prisma.studyMaterial.findUnique({
        where: { id: payment.studyMaterialId },
        select: {
          title: true,
          fileUrl: payment.status === 'PAID' ? true : false,
        },
      })
    }

    return successResponse({
      ...payment,
      studyMaterial,
    })
  } catch (error) {
    console.error('[PAYMENT_DETAIL_ERROR]', error)
    return serverErrorResponse()
  }
}
