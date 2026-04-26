import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { updateSessionSchema } from '@/lib/validations/session'
import { cancelCalendarEvent } from '@/lib/google-calendar'
import { sendSessionCancelled } from '@/lib/email-service'

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

    const parsed = updateSessionSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Session not found', 404)
    }

    const updated = await prisma.session.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        date: true,
        status: true,
        paymentStatus: true,
        meetLink: true,
        notes: true,
        user: { select: { name: true } },
        doctor: { select: { user: { select: { name: true } } } },
      },
    })

    // Cancel Google Calendar event if session was cancelled
    if (updated.status === 'CANCELLED' && existing.calendarEventId) {
      cancelCalendarEvent(existing.calendarEventId).catch((error) => {
        console.error('[ADMIN_SESSION_CANCEL] Calendar event cancellation failed:', error)
      })
    }

    // Send cancellation email (non-blocking)
    if (updated.status === 'CANCELLED') {
      try {
        const cancelledSession = await prisma.session.findUnique({
          where: { id },
          include: {
            user: { select: { name: true, email: true } },
            doctor: { select: { user: { select: { name: true } } } },
          },
        })
        if (cancelledSession) {
          sendSessionCancelled(cancelledSession.user.email, {
            userName: cancelledSession.user.name ?? 'there',
            doctorName: cancelledSession.doctor.user.name ?? 'your doctor',
            sessionDate: cancelledSession.date,
            cancelledBy: 'ADMIN',
            refundNote: existing.paymentStatus === 'PAID'
              ? 'Your refund will be processed within 5-7 business days.'
              : undefined,
          })
        }
      } catch (err) {
        console.error('[ADMIN_SESSION_CANCEL] Email failed:', err)
      }
    }

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_SESSION_PATCH]', error)
    return serverErrorResponse()
  }
}
