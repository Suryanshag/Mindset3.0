import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const updateStudyMaterialSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  type: z.enum(['FREE', 'PAID']).optional(),
  price: z.number().positive().optional(),
  fileUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  isPublished: z.boolean().optional(),
})

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
    const material = await prisma.studyMaterial.findUnique({ where: { id } })
    if (!material) return errorResponse('Study material not found', 404)

    return successResponse(material)
  } catch (error) {
    console.error('[ADMIN_STUDY_MATERIAL_GET]', error)
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

    const parsed = updateStudyMaterialSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.studyMaterial.findUnique({ where: { id } })
    if (!existing) return errorResponse('Study material not found', 404)

    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: parsed.data,
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_STUDY_MATERIAL_PATCH]', error)
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
    const material = await prisma.studyMaterial.findUnique({ where: { id } })
    if (!material) return errorResponse('Study material not found', 404)

    await prisma.studyMaterial.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('[ADMIN_STUDY_MATERIAL_DELETE]', error)
    return serverErrorResponse()
  }
}
