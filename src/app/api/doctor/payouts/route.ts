import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

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

    const payouts = await prisma.payout.findMany({
      where: { doctorId: doctor.id },
      orderBy: { paidAt: 'desc' },
      include: {
        earnings: {
          select: {
            id: true,
            doctorAmount: true,
            session: {
              select: {
                date: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    // "Orphaned" = PAID earnings without a payoutId. Likely an admin error
    // (marking PAID in Prisma Studio without grouping into a Payout).
    // Surface it as "Awaiting Linkage" so the doctor sees the money instead
    // of silently losing it from the totals.
    const orphanedPaidAgg = await prisma.doctorEarning.aggregate({
      where: { doctorId: doctor.id, status: 'PAID', payoutId: null },
      _sum: { doctorAmount: true },
      _count: true,
    })

    const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.amount), 0)

    return successResponse({
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        transactionRef: p.transactionRef,
        note: p.note,
        paidAt: p.paidAt,
        sessionCount: p.earnings.length,
        earnings: p.earnings.map((e) => ({
          id: e.id,
          amount: Number(e.doctorAmount),
          sessionDate: e.session.date,
          patientName: e.session.user.name,
        })),
      })),
      summary: {
        totalPaidOut,
        payoutCount: payouts.length,
        orphanedPaidAmount: Number(orphanedPaidAgg._sum.doctorAmount ?? 0),
        orphanedPaidCount: orphanedPaidAgg._count,
      },
    })
  } catch {
    return serverErrorResponse()
  }
}
