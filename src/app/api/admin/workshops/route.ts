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
      include: {
        presenter: { select: { id: true, name: true, title: true, tier: true } },
        _count: { select: { registrations: true } },
      },
    })

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

    const workshop = await prisma.$transaction(async (tx) => {
      let presenterId = parsed.data.presenterId
      if (!presenterId && parsed.data.newPresenter) {
        const created = await tx.presenter.create({ data: parsed.data.newPresenter })
        presenterId = created.id
      }

      return tx.workshop.create({
        data: {
          ...resolveWorkshopFields(parsed.data),
          presenterId,
        },
      })
    }, { maxWait: 8000, timeout: 15000 })

    return successResponse(workshop, 201)
  } catch (error) {
    console.error('[ADMIN_WORKSHOPS_POST]', error)
    return serverErrorResponse()
  }
}
