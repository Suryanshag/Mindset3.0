import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createWorkshopSchema, resolveWorkshopFields } from '@/lib/validations/workshop'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const workshops = await prisma.workshop.findMany({
      orderBy: { startsAt: 'desc' },
    })

    // Return both new and legacy field names for admin UI compat
    const mapped = workshops.map((w) => ({
      ...w,
      date: w.startsAt,
      image: w.coverImageUrl,
      isPublished: w.published,
    }))

    return successResponse(mapped)
  } catch (error) {
    console.error('[ADMIN_WORKSHOPS_GET]', error)
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
    const parsed = createWorkshopSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const workshop = await prisma.workshop.create({
      data: resolveWorkshopFields(parsed.data),
    })

    return successResponse(workshop, 201)
  } catch (error) {
    console.error('[ADMIN_WORKSHOPS_POST]', error)
    return serverErrorResponse()
  }
}
