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

    const search = req.nextUrl.searchParams.get('search') ?? ''

    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { sessions: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(users)
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return serverErrorResponse()
  }
}
