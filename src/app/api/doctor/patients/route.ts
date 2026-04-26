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
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const sessions = await prisma.session.findMany({
      where: { doctorId: doctor.id },
      select: {
        userId: true,
        date: true,
        status: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    const now = new Date()
    const patientMap = new Map<string, {
      id: string
      name: string
      email: string
      phone: string | null
      totalSessions: number
      lastSessionDate: Date | null
      nextSessionDate: Date | null
    }>()

    for (const s of sessions) {
      const existing = patientMap.get(s.userId)
      if (!existing) {
        patientMap.set(s.userId, {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
          phone: s.user.phone,
          totalSessions: 1,
          lastSessionDate: s.date <= now ? s.date : null,
          nextSessionDate: s.date > now && (s.status === 'PENDING' || s.status === 'CONFIRMED') ? s.date : null,
        })
      } else {
        existing.totalSessions++
        if (s.date <= now && (!existing.lastSessionDate || s.date > existing.lastSessionDate)) {
          existing.lastSessionDate = s.date
        }
        if (s.date > now && (s.status === 'PENDING' || s.status === 'CONFIRMED')) {
          if (!existing.nextSessionDate || s.date < existing.nextSessionDate) {
            existing.nextSessionDate = s.date
          }
        }
      }
    }

    const patients = Array.from(patientMap.values()).sort((a, b) => {
      const aDate = a.lastSessionDate?.getTime() ?? 0
      const bDate = b.lastSessionDate?.getTime() ?? 0
      return bDate - aDate
    })

    return successResponse(patients)
  } catch {
    return serverErrorResponse()
  }
}
