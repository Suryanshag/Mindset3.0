import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params

    const message = await prisma.contactMessage.findUnique({ where: { id } })
    if (!message) return errorResponse('Message not found', 404)

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_MESSAGE_PATCH]', error)
    return serverErrorResponse()
  }
}
