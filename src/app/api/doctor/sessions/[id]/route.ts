import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { updateSessionSchema } from '@/lib/validations/session'
import { cancelCalendarEvent } from '@/lib/google-calendar'
import { sendSessionCancelled } from '@/lib/email-service'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        earning: { select: { id: true } },
      },
    })
    if (!existingSession) return errorResponse('Session not found', 404)
    if (existingSession.doctorId !== doctor.id) {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = updateSessionSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    // Handle COMPLETED status with 45-min rule + earnings
    if (parsed.data.status === 'COMPLETED') {
      if (existingSession.status !== 'CONFIRMED') {
        return errorResponse('Only confirmed sessions can be marked complete', 400)
      }

      // Enforce 45 minute rule server-side
      const sessionStart = new Date(existingSession.date)
      const fortyFiveMinAfter = new Date(sessionStart.getTime() + 45 * 60 * 1000)
      if (new Date() < fortyFiveMinAfter) {
        return errorResponse('Session cannot be marked complete before 45 minutes have passed', 400)
      }

      // Don't create duplicate earning
      if (existingSession.earning) {
        return errorResponse('Session already marked as complete', 400)
      }

      // Find associated PAID payment
      const payment = await prisma.payment.findFirst({
        where: {
          sessionId: id,
          status: 'PAID',
          type: 'SESSION',
        },
        select: { id: true, amount: true },
      })

      // Transaction: update session + create earning
      const updated = await prisma.$transaction(async (tx) => {
        const updatedSession = await tx.session.update({
          where: { id },
          data: { status: 'COMPLETED' },
          select: {
            id: true,
            date: true,
            meetLink: true,
            status: true,
            paymentStatus: true,
            notes: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        })

        if (payment) {
          const grossAmount = Number(payment.amount)
          const doctorAmount = (grossAmount * 0.5).toFixed(2)
          const platformAmount = (grossAmount * 0.5).toFixed(2)

          await tx.doctorEarning.create({
            data: {
              doctorId: doctor.id,
              sessionId: id,
              paymentId: payment.id,
              grossAmount: payment.amount,
              doctorAmount,
              platformAmount,
              status: 'PENDING',
            },
          })
        }

        return updatedSession
      })

      return successResponse({ ...updated, earningCreated: !!payment })
    }

    // Standard update for notes/meetLink/cancel
    const updated = await prisma.session.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        paymentStatus: true,
        notes: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    // Cancel Google Calendar event if session was cancelled
    if (updated.status === 'CANCELLED' && existingSession.calendarEventId) {
      cancelCalendarEvent(existingSession.calendarEventId).catch((error) => {
        console.error('[SESSION_CANCEL] Calendar event cancellation failed:', error)
      })
    }

    // Send cancellation email (non-blocking)
    if (updated.status === 'CANCELLED') {
      try {
        const doctorUser = await prisma.user.findUnique({
          where: { id: doctor.userId },
          select: { name: true },
        })
        sendSessionCancelled(updated.user.email, {
          userName: updated.user.name ?? 'there',
          doctorName: doctorUser?.name ?? 'your doctor',
          sessionDate: updated.date,
          cancelledBy: 'DOCTOR',
          refundNote: existingSession.paymentStatus === 'PAID'
            ? 'Your refund will be processed within 5-7 business days.'
            : undefined,
        })
      } catch (err) {
        console.error('[SESSION_CANCEL] Email failed:', err)
      }
    }

    return successResponse(updated)
  } catch {
    return serverErrorResponse()
  }
}
