import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const updateOrderSchema = z.object({
  shippingStatus: z.enum([
    'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED',
  ]).optional(),
  awbCode: z.string().max(100).optional(),
  courierName: z.string().max(100).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const body = await req.json()

    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return errorResponse('Order not found', 404)

    const updated = await prisma.order.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        shippingStatus: true,
        awbCode: true,
        courierName: true,
        shiprocketOrderId: true,
        updatedAt: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_ORDER_PATCH]', error)
    return serverErrorResponse()
  }
}
