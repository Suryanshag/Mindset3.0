import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createWorkshopSchema } from '@/lib/validations/workshop'

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
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        presenter: { select: { id: true, name: true, title: true, tier: true } },
      },
    })
    if (!workshop) return errorResponse('Workshop not found', 404)

    return successResponse({
      ...workshop,
      date: workshop.startsAt,
      image: workshop.coverImageUrl,
      isPublished: workshop.published,
    })
  } catch (error) {
    console.error('[ADMIN_WORKSHOP_GET]', error)
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

    const schema = createWorkshopSchema.partial()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.workshop.findUnique({ where: { id } })
    if (!existing) return errorResponse('Workshop not found', 404)

    const updated = await prisma.$transaction(async (tx) => {
      const d = parsed.data

      let presenterId: string | undefined = d.presenterId
      if (!presenterId && d.newPresenter) {
        const created = await tx.presenter.create({ data: d.newPresenter })
        presenterId = created.id
      }

      const data: Record<string, unknown> = {}
      if (d.title !== undefined) data.title = d.title
      if (d.subtitle !== undefined) data.subtitle = d.subtitle
      if (d.description !== undefined) data.description = d.description
      if (d.coverImageUrl ?? d.image) data.coverImageUrl = d.coverImageUrl ?? d.image
      if (d.instructorName !== undefined) data.instructorName = d.instructorName
      if (d.startsAt ?? d.date) data.startsAt = new Date((d.startsAt ?? d.date)!)
      if (d.durationMin !== undefined) data.durationMin = d.durationMin
      if (d.priceCents !== undefined) data.priceCents = d.priceCents
      if (d.capacity !== undefined) data.capacity = d.capacity
      if (d.whatsappGroupUrl !== undefined) data.whatsappGroupUrl = d.whatsappGroupUrl
      if (d.published !== undefined || d.isPublished !== undefined) {
        data.published = d.published ?? d.isPublished
      }
      if (d.type !== undefined) data.type = d.type
      if (d.status !== undefined) data.status = d.status
      if (d.meetLink !== undefined) data.meetLink = d.meetLink
      if (d.minCapacity !== undefined) data.minCapacity = d.minCapacity
      if (d.presenterSplitPct !== undefined) data.presenterSplitPct = d.presenterSplitPct
      if (presenterId) data.presenterId = presenterId

      return tx.workshop.update({ where: { id }, data })
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_WORKSHOP_PATCH]', error)
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
    const existing = await prisma.workshop.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    })
    if (!existing) return errorResponse('Workshop not found', 404)

    if (existing._count.registrations > 0) {
      return errorResponse('Cannot delete workshop with registrations. Cancel it instead.', 400)
    }

    await prisma.workshop.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('[ADMIN_WORKSHOP_DELETE]', error)
    return serverErrorResponse()
  }
}
