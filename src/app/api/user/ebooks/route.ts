import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const materialSelect = {
      id: true,
      title: true,
      type: true,
      price: true,
      coverImage: true,
    }

    // Free materials — always accessible
    const free = await prisma.studyMaterial.findMany({
      where: { isPublished: true, type: 'FREE' },
      select: materialSelect,
    })

    // Paid materials user has purchased
    const paidPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        type: 'EBOOK',
        status: 'PAID',
        studyMaterialId: { not: null },
      },
      select: { studyMaterialId: true },
    })

    const purchasedIds = paidPayments
      .map((p) => p.studyMaterialId)
      .filter((id): id is string => id !== null)

    const purchased = purchasedIds.length > 0
      ? await prisma.studyMaterial.findMany({
          where: { id: { in: purchasedIds }, isPublished: true },
          select: materialSelect,
        })
      : []

    return successResponse({ free, purchased })
  } catch (error) {
    console.error('[USER_EBOOKS_ERROR]', error)
    return serverErrorResponse()
  }
}
