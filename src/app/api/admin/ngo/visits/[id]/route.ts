import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createNgoVisitSchema } from '@/lib/validations/ngo'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const visit = await prisma.ngoVisit.findUnique({ where: { id } })
    if (!visit) return errorResponse('Visit not found', 404)

    return successResponse(visit)
  } catch (error) {
    console.error('[ADMIN_NGO_VISIT_GET]', error)
    return serverErrorResponse()
  }
}

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

    const schema = createNgoVisitSchema.partial()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.ngoVisit.findUnique({ where: { id } })
    if (!existing) return errorResponse('Visit not found', 404)

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.visitDate) data.visitDate = new Date(parsed.data.visitDate)

    const updated = await prisma.ngoVisit.update({ where: { id }, data })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_NGO_VISIT_PATCH]', error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const visit = await prisma.ngoVisit.findUnique({ where: { id } })
    if (!visit) return errorResponse('Visit not found', 404)

    await prisma.ngoVisit.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('[ADMIN_NGO_VISIT_DELETE]', error)
    return serverErrorResponse()
  }
}
