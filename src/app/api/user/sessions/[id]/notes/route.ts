import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const schema = z.object({
  userNotes: z.string().max(2000),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const { id } = await params

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const result = await prisma.session.updateMany({
      where: { id, userId: session.user.id },
      data: { userNotes: parsed.data.userNotes },
    })

    if (result.count === 0) return errorResponse('Session not found', 404)

    return successResponse({ saved: true })
  } catch (error) {
    console.error('[USER_SESSION_NOTES_PATCH]', error)
    return serverErrorResponse()
  }
}
