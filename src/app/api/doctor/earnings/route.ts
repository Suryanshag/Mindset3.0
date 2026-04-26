import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

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
      select: { id: true },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const [earnings, totalAgg, pendingAgg, paidAgg] = await Promise.all([
      prisma.doctorEarning.findMany({
        where: { doctorId: doctor.id },
        include: {
          session: {
            select: {
              date: true,
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctorEarning.aggregate({
        where: { doctorId: doctor.id },
        _sum: { doctorAmount: true },
        _count: true,
      }),
      prisma.doctorEarning.aggregate({
        where: { doctorId: doctor.id, status: 'PENDING' },
        _sum: { doctorAmount: true },
      }),
      prisma.doctorEarning.aggregate({
        where: { doctorId: doctor.id, status: 'PAID' },
        _sum: { doctorAmount: true },
      }),
    ])

    return successResponse({
      earnings: earnings.map((e) => ({
        id: e.id,
        sessionDate: e.session.date,
        patientName: e.session.user.name,
        grossAmount: Number(e.grossAmount),
        doctorAmount: Number(e.doctorAmount),
        platformAmount: Number(e.platformAmount),
        status: e.status,
        createdAt: e.createdAt,
      })),
      summary: {
        totalEarned: Number(totalAgg._sum.doctorAmount ?? 0),
        totalPending: Number(pendingAgg._sum.doctorAmount ?? 0),
        totalPaid: Number(paidAgg._sum.doctorAmount ?? 0),
        sessionCount: totalAgg._count,
      },
    })
  } catch {
    return serverErrorResponse()
  }
}
