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

    const isRead = req.nextUrl.searchParams.get('isRead')

    const where: { isRead?: boolean } = {}
    if (isRead === 'true') where.isRead = true
    if (isRead === 'false') where.isRead = false

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(messages)
  } catch (error) {
    console.error('[ADMIN_MESSAGES_GET]', error)
    return serverErrorResponse()
  }
}
