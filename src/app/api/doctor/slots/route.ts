import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createSlotSchema } from '@/lib/validations/slot'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const slots = await prisma.availableSlot.findMany({
      where: { doctorId: doctor.id },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, isBooked: true },
    })

    return successResponse(slots)
  } catch {
    return serverErrorResponse()
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const body = await req.json()
    const parsed = createSlotSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const now = new Date()
    const validDates = parsed.data.dates
      .map(d => new Date(d))
      .filter(d => d > now)

    if (validDates.length === 0) {
      return errorResponse('All dates are in the past')
    }

    const result = await prisma.availableSlot.createMany({
      data: validDates.map(date => ({
        doctorId: doctor.id,
        date,
      })),
      skipDuplicates: true,
    })

    return successResponse({ created: result.count }, 201)
  } catch {
    return serverErrorResponse()
  }
}
