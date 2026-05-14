import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { publicGetLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const decision = await publicGetLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const doctorId = req.nextUrl.searchParams.get('doctorId')
    if (!doctorId) return errorResponse('doctorId is required', 400)

    const now = new Date()
    const horizon = new Date(now.getTime() + FOURTEEN_DAYS_MS)

    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, isActive: true },
      select: {
        id: true,
        slug: true,
        photo: true,
        designation: true,
        type: true,
        specialization: true,
        qualification: true,
        experience: true,
        bio: true,
        sessionPrice: true,
        user: { select: { name: true } },
      },
    })

    if (!doctor) return errorResponse('Doctor not found', 404)

    const slots = await prisma.availableSlot.findMany({
      where: {
        doctorId,
        isBooked: false,
        date: { gte: now, lt: horizon },
      },
      select: { id: true, date: true, isBooked: true },
      orderBy: { date: 'asc' },
    })

    return successResponse({ ...doctor, slots })
  } catch (error) {
    console.error('[DOCTORS_LOOKUP]', error)
    return serverErrorResponse()
  }
}
