import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { updateJoinStatusSchema } from '@/lib/validations/ngo'

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
    const parsed = updateJoinStatusSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.ngoJoinRequest.findUnique({ where: { id } })
    if (!existing) return errorResponse('Request not found', 404)

    const updated = await prisma.ngoJoinRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_NGO_REQUEST_PATCH]', error)
    return serverErrorResponse()
  }
}
