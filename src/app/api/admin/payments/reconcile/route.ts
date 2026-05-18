import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import {
  sendWorkshopRegistrationConfirmation,
  sendSessionBookingConfirmation,
  sendDoctorNewBookingNotification,
} from '@/lib/email-service'
import { formatSessionDateLong } from '@/lib/format-date'

/**
 * Admin-only: forcibly mark a Payment as PAID using the Razorpay-side
 * captured payment id, then create the same downstream rows that
 * /api/payments/verify and /api/payments/webhook would have created.
 *
 * Used by /admin/reconcile-payments to clean up the silent-drop cases
 * where the webhook fired but the Payment row was missing, or the
 * webhook just never arrived.
 *
 * Idempotent: if Payment is already PAID, returns success without
 * re-firing the email or duplicating downstream rows.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { paymentId } = await req.json()
    if (!paymentId) return errorResponse('Missing paymentId', 400)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })
    if (!payment) return errorResponse('Payment not found', 404)
    if (!payment.razorpayOrderId) {
      return errorResponse('Payment has no razorpayOrderId — cannot reconcile', 400)
    }

    if (payment.status === 'PAID') {
      console.log('[ADMIN_RECONCILE] payment', payment.id, 'already PAID — no-op')
      return successResponse({ alreadyPaid: true })
    }

    // Fetch Razorpay-side payments on this order. Reconcile only if at
    // least one shows captured.
    const list = await razorpay.orders.fetchPayments(payment.razorpayOrderId)
    const captured = (list.items as unknown as Array<Record<string, unknown>>).find(
      (p) => p.status === 'captured' || p.captured === true
    )
    if (!captured) {
      return errorResponse(
        'Razorpay reports no captured payment on this order — refuse to reconcile',
        400
      )
    }

    const razorpayPaymentId = captured.id as string
    console.log(
      '[ADMIN_RECONCILE]',
      session.user.email,
      'reconciling Payment',
      payment.id,
      '→',
      razorpayPaymentId
    )

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          // No signature for admin reconcile path — captured event was
          // validated by querying Razorpay directly (server-to-server),
          // not by an incoming signed webhook.
        },
      })

      if (payment.type === 'PRODUCT' && payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'PAID' },
        })
      }

      if (payment.type === 'WORKSHOP' && payment.workshopId) {
        await tx.workshopRegistration.upsert({
          where: {
            userId_workshopId: {
              userId: payment.userId,
              workshopId: payment.workshopId,
            },
          },
          create: {
            userId: payment.userId,
            workshopId: payment.workshopId,
            paymentId: payment.id,
          },
          update: { paymentId: payment.id },
        })
      }

      if (payment.type === 'SESSION' && payment.sessionId) {
        await tx.session.update({
          where: { id: payment.sessionId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          },
        })
      }
    }, { maxWait: 8000, timeout: 15000 })

    // Mirror verify's post-tx emails + notification. Fire-and-forget.
    if (payment.type === 'WORKSHOP' && payment.workshopId) {
      try {
        const [workshop, userRow] = await Promise.all([
          prisma.workshop.findUnique({
            where: { id: payment.workshopId },
            include: { presenter: { select: { name: true } } },
          }),
          prisma.user.findUnique({
            where: { id: payment.userId },
            select: { name: true, email: true },
          }),
        ])
        if (workshop && userRow) {
          const presenterName =
            workshop.presenter?.name ?? workshop.instructorName ?? 'Mindset'
          sendWorkshopRegistrationConfirmation(userRow.email, {
            userName: userRow.name ?? 'there',
            workshopTitle: workshop.title,
            startsAt: workshop.startsAt,
            durationMin: workshop.durationMin,
            presenterName,
            amount: Number(payment.amount),
            workshopId: workshop.id,
          })
          await prisma.notification.create({
            data: {
              userId: payment.userId,
              kind: 'WORKSHOP_REGISTRATION_CONFIRMED',
              title: 'Workshop registration confirmed',
              body: `You're in for "${workshop.title}" on ${formatSessionDateLong(workshop.startsAt)}. We'll send a meeting link before the session.`,
              link: `/user/discover/workshops/${workshop.id}`,
            },
          }).catch((err) =>
            console.error('[ADMIN_RECONCILE] Workshop notif failed:', err)
          )
        }
      } catch (err) {
        console.error('[ADMIN_RECONCILE] Workshop email failed:', err)
      }
    }

    if (payment.type === 'SESSION' && payment.sessionId) {
      try {
        const fullSession = await prisma.session.findUnique({
          where: { id: payment.sessionId },
          include: {
            user: { select: { name: true, email: true } },
            doctor: { select: { user: { select: { name: true, email: true } } } },
          },
        })
        if (fullSession) {
          sendSessionBookingConfirmation(fullSession.user.email, {
            userName: fullSession.user.name ?? 'there',
            doctorName: fullSession.doctor.user.name ?? 'your doctor',
            sessionDate: fullSession.date,
            durationMin: 60,
            meetLink: fullSession.meetLink,
            sessionId: fullSession.id,
          })
          sendDoctorNewBookingNotification(fullSession.doctor.user.email, {
            doctorName: fullSession.doctor.user.name ?? 'Doctor',
            userName: fullSession.user.name ?? 'A patient',
            sessionDate: fullSession.date,
            durationMin: 60,
            sessionId: fullSession.id,
          })
          await prisma.notification.create({
            data: {
              userId: payment.userId,
              kind: 'SESSION_REMINDER',
              title: 'Session confirmed',
              body: `Your session with ${fullSession.doctor.user.name ?? 'your therapist'} is booked. We'll remind you 24 hours before.`,
              link: `/user/sessions/${fullSession.id}`,
            },
          }).catch((err) =>
            console.error('[ADMIN_RECONCILE] Session notif failed:', err)
          )
        }
      } catch (err) {
        console.error('[ADMIN_RECONCILE] Session email failed:', err)
      }
    }

    return successResponse({ reconciled: true, razorpayPaymentId })
  } catch (error) {
    console.error('[ADMIN_RECONCILE_ERROR]', error)
    return serverErrorResponse()
  }
}
