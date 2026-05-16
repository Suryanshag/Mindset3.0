import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const url = req.nextUrl.searchParams
    const status = url.get('status')
    const paymentStatus = url.get('paymentStatus')
    const page = Math.max(1, Number(url.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(url.get('limit') ?? 20)))

    const where: Prisma.OrderWhereInput = {}
    if (status) where.shippingStatus = status as Prisma.EnumShippingStatusFilter
    if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          deliveryCharge: true,
          paymentStatus: true,
          shippingStatus: true,
          awbCode: true,
          courierName: true,
          shiprocketOrderId: true,
          shippingAddress: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          orderItems: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return successResponse({ orders, total, page, limit })
  } catch (error) {
    console.error('[ADMIN_ORDERS_GET]', error)
    return serverErrorResponse()
  }
}
