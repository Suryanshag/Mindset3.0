import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createStudyMaterialSchema } from '@/lib/validations/study-material'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(materials)
  } catch (error) {
    console.error('[ADMIN_STUDY_MATERIALS_GET]', error)
    return serverErrorResponse()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = createStudyMaterialSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const material = await prisma.studyMaterial.create({ data: parsed.data })
    return successResponse(material, 201)
  } catch (error) {
    console.error('[ADMIN_STUDY_MATERIALS_POST]', error)
    return serverErrorResponse()
  }
}
