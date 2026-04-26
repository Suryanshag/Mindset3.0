import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createNgoVisitSchema } from '@/lib/validations/ngo'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const visits = await prisma.ngoVisit.findMany({
      orderBy: { visitDate: 'desc' },
    })

    return successResponse(visits)
  } catch (error) {
    console.error('[ADMIN_NGO_VISITS_GET]', error)
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
    const parsed = createNgoVisitSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const visit = await prisma.ngoVisit.create({
      data: {
        ngoName: parsed.data.ngoName,
        location: parsed.data.location,
        description: parsed.data.description,
        photos: parsed.data.photos,
        visitDate: new Date(parsed.data.visitDate),
        isPublished: parsed.data.isPublished,
      },
    })

    return successResponse(visit, 201)
  } catch (error) {
    console.error('[ADMIN_NGO_VISITS_POST]', error)
    return serverErrorResponse()
  }
}
