'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { sendSessionCancelled } from '@/lib/email-service'
import { revalidatePath } from 'next/cache'
import { formatSessionDate } from '@/lib/format-date'

// Refund policy (canonical, mirrors docs/refund-policy-audit.md):
//   > 24h before session start  → 100% refund
//   ≤ 24h, > 0                  →  50% refund
//   ≤ 0 (after start time)      →   0% refund (no-show / already happened)
//
// The 50% within-24h tier is a policy CHANGE from the previous behavior
// (cancellation within 24h was outright blocked). The audit ratified the
// canonical policy that allows late cancellation at a partial-refund
// tier to compensate the therapist's reserved time. Terms-of-use copy
// update is a separate follow-up sprint item (audit §C2).

type RefundDecision = {
  percent: number
  reason: string
}

function refundDecisionFor(hoursUntilSession: number): RefundDecision {
  if (hoursUntilSession > 24) {
    return { percent: 100, reason: 'Cancelled more than 24 hours in advance' }
  }
  if (hoursUntilSession > 0) {
    return { percent: 50, reason: 'Cancelled within 24 hours of session start' }
  }
  return { percent: 0, reason: 'Cancelled after session start time' }
}

export async function cancelSession(sessionId: string) {
  const authSession = await auth()
  if (!authSession?.user?.id) return { error: 'Unauthorized' }
  const userId = authSession.user.id
  const userEmail = authSession.user.email
  const userName = authSession.user.name ?? 'there'

  // Phase 1: DB-only work inside a transaction. The Razorpay API call
  // happens AFTER the transaction commits so a hung HTTP request can't
  // wedge a Postgres connection from the small Neon pool.
  const txResult = await prisma.$transaction(
    async (tx) => {
      const session = await tx.session.findFirst({
        where: { id: sessionId, userId },
        include: {
          doctor: { include: { user: { select: { id: true, name: true } } } },
          payment: true,
        },
      })

      if (!session) return { error: 'Session not found' as const }
      if (session.status === 'CANCELLED') return { error: 'Already cancelled' as const }
      if (session.status === 'COMPLETED') return { error: 'Cannot cancel a completed session' as const }

      const hoursUntilSession =
        (session.date.getTime() - Date.now()) / (1000 * 60 * 60)
      const decision = refundDecisionFor(hoursUntilSession)
      const now = new Date()

      // Flip the session to CANCELLED with the audit fields set.
      await tx.session.update({
        where: { id: sessionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: decision.reason,
        },
      })

      await tx.notification
        .create({
          data: {
            userId: session.doctor.user.id,
            kind: 'SESSION_CANCELLED_BY_USER',
            title: 'Session cancelled',
            body: `${userName} cancelled their session scheduled for ${formatSessionDate(session.date)}`,
            link: `/doctor/calendar`,
          },
        })
        .catch(() => {})

      // Determine whether a refund is due. A refund requires:
      //   - a Payment row attached to the session
      //   - payment.status === 'PAID' (we never captured otherwise)
      //   - a razorpayPaymentId to refund against
      //   - decision.percent > 0
      // Free sessions and never-captured payments skip the refund leg
      // entirely; the session is still cancelled.
      const payment = session.payment
      const eligible =
        payment != null &&
        payment.status === 'PAID' &&
        !!payment.razorpayPaymentId &&
        decision.percent > 0

      if (!eligible) {
        return {
          success: true as const,
          refundPercent: 0,
          refundAmountPaise: 0,
          refundReason: decision.reason,
          paymentId: null,
          razorpayPaymentId: null,
          sessionDate: session.date,
          doctorName: session.doctor.user.name ?? 'your doctor',
        }
      }

      const refundAmountPaise = Math.floor(
        Number(payment.amount) * 100 * (decision.percent / 100)
      )

      // Mark the payment as refund-PENDING in DB; refundId fills in
      // after the Razorpay API call below; refundStatus flips to
      // PROCESSED via the refund.processed webhook (Task 3).
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundStatus: 'PENDING',
          refundAmount: refundAmountPaise,
        },
      })

      return {
        success: true as const,
        refundPercent: decision.percent,
        refundAmountPaise,
        refundReason: decision.reason,
        paymentId: payment.id,
        razorpayPaymentId: payment.razorpayPaymentId,
        sessionDate: session.date,
        doctorName: session.doctor.user.name ?? 'your doctor',
      }
    },
    { maxWait: 8000, timeout: 15000 }
  )

  if ('error' in txResult) return { error: txResult.error }

  // Phase 2: out-of-transaction Razorpay refund call. If this throws,
  // the DB session is already CANCELLED (correct from the user's POV)
  // and the Payment is in refundStatus='PENDING' awaiting admin retry
  // via the Razorpay dashboard. We mark FAILED so admin can find it.
  if (txResult.paymentId && txResult.razorpayPaymentId && txResult.refundAmountPaise > 0) {
    try {
      const refund = await razorpay.payments.refund(txResult.razorpayPaymentId, {
        amount: txResult.refundAmountPaise,
        speed: 'normal',
        notes: {
          sessionId,
          cancellationReason: txResult.refundReason,
        },
      })

      await prisma.payment.update({
        where: { id: txResult.paymentId },
        data: {
          refundId: refund.id,
          refundStatus: 'PROCESSING',
        },
      })
    } catch (err) {
      console.error('[RAZORPAY_REFUND_FAILED]', {
        sessionId,
        paymentId: txResult.paymentId,
        razorpayPaymentId: txResult.razorpayPaymentId,
        err,
      })
      await prisma.payment
        .update({
          where: { id: txResult.paymentId },
          data: { refundStatus: 'FAILED' },
        })
        .catch(() => {})
      // Do NOT bubble the error to the user — the session is already
      // cancelled. Admin can manually refund from the Razorpay dashboard
      // and flip refundStatus to PROCESSED.
    }
  }

  // Phase 3: out-of-transaction notification + email. Both are best-
  // effort; a failure here doesn't change the cancellation outcome.
  const refundNote =
    txResult.refundAmountPaise > 0
      ? `${txResult.refundPercent}% refund (₹${(txResult.refundAmountPaise / 100).toFixed(0)}) processing — expect 5-7 business days.`
      : 'No refund due — cancellation was after session start time.'

  prisma.notification
    .create({
      data: {
        userId,
        kind: 'SESSION_CANCELLED',
        title: 'Session cancelled',
        body: refundNote,
        link: '/user/sessions',
      },
    })
    .catch((err) => console.error('[NOTIFICATION_FAILED]', err))

  if (userEmail) {
    try {
      sendSessionCancelled(userEmail, {
        userName,
        doctorName: txResult.doctorName,
        sessionDate: txResult.sessionDate,
        cancelledBy: 'USER',
        // Structured props let the template render a richer refund block
        // with policy-derived reason copy + correct success/no-refund tinting.
        refundAmount: txResult.refundAmountPaise / 100,
        refundPercent: txResult.refundPercent,
        cancellationReason: txResult.refundReason,
      })
    } catch (err) {
      console.error('[EMAIL_FAILED]', err)
    }
  }

  revalidatePath('/user/sessions')
  revalidatePath(`/user/sessions/${sessionId}`)
  revalidatePath('/user')

  return {
    success: true,
    refundPercent: txResult.refundPercent,
    refundAmountRupees: txResult.refundAmountPaise / 100,
    refundReason: txResult.refundReason,
  }
}
