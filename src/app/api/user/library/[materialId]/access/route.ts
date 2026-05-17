import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ materialId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const { materialId } = await ctx.params

    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId, isPublished: true },
      select: { id: true },
    })
    if (!material) return errorResponse('Material not found', 404)

    const access = await prisma.studyMaterialAccess.upsert({
      where: { userId_materialId: { userId: session.user.id, materialId } },
      update: { lastOpenedAt: new Date() },
      create: { userId: session.user.id, materialId, lastOpenedAt: new Date() },
      select: { lastOpenedAt: true },
    })

    return successResponse({ lastOpenedAt: access.lastOpenedAt })
  } catch (error) {
    console.error('[LIBRARY_ACCESS]', error)
    return serverErrorResponse()
  }
}
