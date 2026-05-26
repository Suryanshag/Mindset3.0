/**
 * INTERNAL ADMIN ENDPOINT — no UI yet (Sprint 1D scope).
 *
 * To create a payout, POST to /api/admin/payouts as an ADMIN user.
 *
 * Body:
 * {
 *   "doctorId": "ckxxx...",
 *   "earningIds": ["ck1...", "ck2..."],
 *   "method": "UPI" | "BANK_TRANSFER" | "OTHER",
 *   "transactionRef": "412345678901" (optional),
 *   "note": "weekly payout Aug 15" (optional),
 *   "paidAt": "2026-08-15T14:30:00Z" (optional, defaults to now)
 * }
 *
 * The endpoint:
 * 1. Verifies all earningIds belong to doctorId
 * 2. Verifies all earnings are PENDING and unlinked
 * 3. Creates a Payout row in a transaction
 * 4. Sets earnings.status = PAID and earnings.payoutId
 * 5. Writes an EARNING_PAID notification for the doctor
 *
 * Use cURL or Postman until admin UI is built.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const createPayoutSchema = z.object({
  doctorId: z.string(),
  earningIds: z.array(z.string()).min(1),
  method: z.enum(['UPI', 'BANK_TRANSFER', 'OTHER']),
  transactionRef: z.string().optional(),
  note: z.string().max(500).optional(),
  paidAt: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = createPayoutSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const { doctorId, earningIds, method, transactionRef, note, paidAt } = parsed.data

    const earnings = await prisma.doctorEarning.findMany({
      where: { id: { in: earningIds } },
      select: { id: true, doctorId: true, status: true, doctorAmount: true, payoutId: true },
    })

    if (earnings.length !== earningIds.length) {
      return errorResponse('One or more earnings not found', 404)
    }
    for (const e of earnings) {
      if (e.doctorId !== doctorId) {
        return errorResponse(`Earning ${e.id} doesn't belong to this doctor`, 400)
      }
      if (e.status !== 'PENDING') {
        return errorResponse(`Earning ${e.id} is already ${e.status}`, 400)
      }
      if (e.payoutId) {
        return errorResponse(`Earning ${e.id} is already linked to a payout`, 400)
      }
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true, user: { select: { name: true, email: true } } },
    })
    if (!doctor) return errorResponse('Doctor not found', 404)

    const totalAmount = earnings.reduce((sum, e) => sum + Number(e.doctorAmount), 0)

    const payout = await prisma.$transaction(async (tx) => {
      const newPayout = await tx.payout.create({
        data: {
          doctorId,
          amount: totalAmount.toFixed(2),
          method,
          transactionRef,
          note,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      })

      await tx.doctorEarning.updateMany({
        where: { id: { in: earningIds } },
        data: {
          status: 'PAID',
          payoutId: newPayout.id,
        },
      })

      await tx.notification
        .create({
          data: {
            userId: doctor.userId,
            kind: 'EARNING_PAID',
            title: 'Payout received',
            body: `₹${totalAmount.toLocaleString('en-IN')} settled via ${method.replace('_', ' ').toLowerCase()} for ${earnings.length} session(s).`,
            link: '/doctor/payouts',
          },
        })
        .catch(() => {})

      return newPayout
    }, { maxWait: 8000, timeout: 15000 })

    return successResponse({
      payout: {
        id: payout.id,
        amount: Number(payout.amount),
        method: payout.method,
        earningCount: earnings.length,
      },
    })
  } catch (err) {
    console.error('[ADMIN_PAYOUTS_POST]', err)
    return serverErrorResponse()
  }
}
