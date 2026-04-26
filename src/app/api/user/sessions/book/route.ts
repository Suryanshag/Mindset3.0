import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { bookSessionSchema } from '@/lib/validations/session'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = bookSessionSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
    }

    const { doctorId, slotId } = parsed.data

    // Verify slot exists and belongs to doctor
    const slot = await prisma.availableSlot.findUnique({
      where: { id: slotId },
    })

    if (!slot || slot.doctorId !== doctorId) {
      return errorResponse('Invalid slot', 400)
    }

    if (slot.isBooked) {
      return errorResponse('This slot is already booked', 400)
    }

    // Verify slot is in the future
    if (slot.date <= new Date()) {
      return errorResponse('This slot is in the past', 400)
    }

    // Mark slot as booked and create session atomically
    const newSession = await prisma.$transaction(async (tx) => {
      await tx.availableSlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      })

      return tx.session.create({
        data: {
          userId: session.user.id,
          doctorId,
          date: slot.date,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        select: {
          id: true,
          date: true,
          status: true,
          paymentStatus: true,
        },
      })
    })

    return successResponse(newSession, 201)
  } catch (error) {
    console.error('[BOOK_SESSION_ERROR]', error)
    return serverErrorResponse()
  }
}
