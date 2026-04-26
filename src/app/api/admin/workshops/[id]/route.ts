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
    const workshop = await prisma.workshop.findUnique({ where: { id } })
    if (!workshop) {
      return errorResponse('Workshop not found', 404)
    }

    // Return both new and legacy field names for admin UI compat
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
    if (!existing) {
      return errorResponse('Workshop not found', 404)
    }

    // Build update payload, accepting legacy or new field names
    const d = parsed.data
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
    if (d.published !== undefined || d.isPublished !== undefined) {
      data.published = d.published ?? d.isPublished
    }

    const updated = await prisma.workshop.update({
      where: { id },
      data,
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

    const workshop = await prisma.workshop.findUnique({ where: { id } })
    if (!workshop) {
      return errorResponse('Workshop not found', 404)
    }

    await prisma.workshop.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('[ADMIN_WORKSHOP_DELETE]', error)
    return serverErrorResponse()
  }
}
