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
    const doctorId = url.get('doctorId')
    const userId = url.get('userId')
    const page = Math.max(1, Number(url.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(url.get('limit') ?? 20)))

    const where: Prisma.SessionWhereInput = {}
    if (status && status !== 'all') {
      where.status = status as Prisma.EnumSessionStatusFilter
    }
    if (doctorId) where.doctorId = doctorId
    if (userId) where.userId = userId

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          date: true,
          status: true,
          paymentStatus: true,
          meetLink: true,
          notes: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          doctor: {
            select: {
              id: true,
              designation: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.session.count({ where }),
    ])

    return successResponse({ sessions, total, page, limit })
  } catch (error) {
    console.error('[ADMIN_SESSIONS_GET]', error)
    return serverErrorResponse()
  }
}
