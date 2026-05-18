import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import {
  sendWorkshopRegistrationConfirmation,
  sendSessionBookingConfirmation,
  sendDoctorNewBookingNotification,
} from '@/lib/email-service'
import { formatSessionDateLong } from '@/lib/format-date'

/**
 * Client-side payment confirmation. The Razorpay checkout handler
 * POSTs here as soon as the user completes payment, so the user sees
 * a confirmed state in ~200ms instead of waiting up to 30s for the
 * webhook. The webhook still runs as a BACKUP — both paths are
 * idempotent (PAID → no-op).
 *
 * Dispatch by Payment.type (read from the DB row, not the request
 * body — so the client can't lie about the type):
 *   PRODUCT  → flip Order.paymentStatus
 *   WORKSHOP → upsert WorkshopRegistration + notification + email
 *   SESSION  → flip Session.paymentStatus + status (Task 4)
 *   EBOOK    → no-op beyond the Payment flip
 *
 * Field convention matches existing EBOOK + PRODUCT callers
 * (ebook-actions.tsx, library-detail-actions.tsx) — camelCase keys.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return errorResponse('Missing payment fields', 400)
    }

    // Razorpay's recommended signature verification for order payments
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      console.warn('[VERIFY] signature mismatch for', razorpayOrderId)
      return errorResponse('Invalid payment signature', 400)
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    })

    if (!payment) {
      console.warn('[VERIFY] no Payment row for', razorpayOrderId)
      return errorResponse('Payment not found', 404)
    }
    if (payment.userId !== session.user.id) {
      return errorResponse('Forbidden', 403)
    }

    // Idempotent — webhook may have arrived first; return success without
    // double-firing emails or duplicate downstream rows.
    if (payment.status === 'PAID') {
      console.log('[VERIFY] payment', payment.id, 'already PAID — no-op')
      return successResponse({ alreadyPaid: true })
    }

    // Edge case: Razorpay's signature says captured (authoritative) but
    // our row was marked FAILED by a prior stale failure webhook. Trust
    // the signature, revive the row, log loudly.
    if (payment.status === 'FAILED') {
      console.error(
        '[VERIFY] [PAYMENT_REVIVED_FROM_FAILED]',
        payment.id,
        'signature-verified after earlier failure flag — proceeding'
      )
    }

    // Promote Payment + downstream side-effects in one transaction so
    // a PAID Payment never coexists with a missing WorkshopRegistration.
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpaySignature,
        },
      })

      if (payment.type === 'PRODUCT' && payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'PAID' },
        })
      }

      if (payment.type === 'WORKSHOP' && payment.workshopId) {
        // upsert vs create so a webhook that raced ahead doesn't make
        // us hit a uniqueness violation. PK is composite [userId,
        // workshopId] so the second arrival is a no-op (or updates
        // paymentId — fine).
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

    // Post-transaction: email + notification (fire-and-forget). Webhook
    // also tries to send these — the alreadyPaid short-circuit above
    // means whichever path arrives second is a no-op AND skips the
    // email send. So in steady state each captured payment sends ONE
    // confirmation email + creates ONE notification.
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
          }).catch((err) => {
            console.error('[VERIFY] Workshop notification create failed:', err)
          })
        }
      } catch (err) {
        console.error(
          '[VERIFY] Workshop confirmation post-processing failed for',
          payment.workshopId,
          err
        )
      }
    }

    // Mirror webhook's SESSION post-tx: confirmation email to user,
    // "please add a Meet link" email to doctor, in-app notification.
    // Fire-and-forget. Webhook's same block is gated on the alreadyPaid
    // early-return so it doesn't double-fire.
    if (payment.type === 'SESSION' && payment.sessionId) {
      try {
        const fullSession = await prisma.session.findUnique({
          where: { id: payment.sessionId },
          include: {
            user: { select: { name: true, email: true } },
            doctor: {
              select: {
                user: { select: { name: true, email: true } },
              },
            },
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
          }).catch((err) => {
            console.error('[VERIFY] Session notification create failed:', err)
          })
        }
      } catch (err) {
        console.error(
          '[VERIFY] Session confirmation post-processing failed for',
          payment.sessionId,
          err
        )
      }
    }

    console.log('[VERIFY] processed payment', payment.id, 'type:', payment.type)
    return successResponse({ verified: true })
  } catch (error) {
    console.error('[VERIFY_PAYMENT_ERROR]', error)
    return serverErrorResponse()
  }
}
