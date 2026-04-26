import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 20)))

    const [requests, total] = await Promise.all([
      prisma.ngoJoinRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ngoJoinRequest.count(),
    ])

    return successResponse({ requests, total, page, limit })
  } catch (error) {
    console.error('[ADMIN_NGO_REQUESTS_GET]', error)
    return serverErrorResponse()
  }
}
