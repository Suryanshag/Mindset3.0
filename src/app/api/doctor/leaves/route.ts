import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createLeaveSchema } from '@/lib/validations/doctor'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN') return errorResponse('Forbidden', 403)

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: doctor.id },
      orderBy: { startDate: 'desc' },
    })

    return successResponse(leaves)
  } catch {
    return serverErrorResponse()
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN') return errorResponse('Forbidden', 403)

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const body = await req.json()
    const parsed = createLeaveSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const start = new Date(parsed.data.startDate)
    const end = new Date(parsed.data.endDate)

    if (end < start) return errorResponse('End date must be on or after start date')

    const overlap = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctor.id,
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
    })
    if (overlap) {
      return errorResponse('This range overlaps with an existing leave period')
    }

    // Booked-session warning — inclusive of leave's end day.
    const endOfEndDate = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1)
    const bookedInRange = await prisma.session.count({
      where: {
        doctorId: doctor.id,
        date: { gte: start, lte: endOfEndDate },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: doctor.id,
        startDate: start,
        endDate: end,
        reason: parsed.data.reason || null,
      },
    })

    return successResponse({ leave, bookedSessionsInRange: bookedInRange })
  } catch {
    return serverErrorResponse()
  }
}
