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
    const type = url.get('type')
    const status = url.get('status')
    const page = Math.max(1, Number(url.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(url.get('limit') ?? 20)))

    const where: Prisma.PaymentWhereInput = {}
    if (type) where.type = type as Prisma.EnumPaymentTypeFilter
    if (status) where.status = status as Prisma.EnumPaymentStatusFilter

    const [payments, total, totalRevenue, pendingAmount, failedCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          razorpayPaymentId: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ])

    return successResponse({
      payments,
      total,
      page,
      limit,
      summary: {
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        pendingAmount: Number(pendingAmount._sum.amount ?? 0),
        failedCount,
      },
    })
  } catch (error) {
    console.error('[ADMIN_PAYMENTS_GET]', error)
    return serverErrorResponse()
  }
}
