import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { startOfDayIST, startOfNextDayIST } from '@/lib/format-date'
import { NextRequest } from 'next/server'
import { decryptField } from '@/lib/encryption'

export async function GET(req: NextRequest) {
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

    const view = req.nextUrl.searchParams.get('view') ?? 'all'
    const now = new Date()
    // IST calendar day — server runs UTC on Vercel, so we can't use
    // getDate/setHours-based math without shifting the bucket 5h30m.
    const startOfDay = startOfDayIST(now)
    const endOfDay = startOfNextDayIST(now)

    type SessionWhere = {
      doctorId: string
      date?: object
      status?: object
      OR?: object[]
    }

    const where: SessionWhere = { doctorId: doctor.id }
    let orderBy: { date: 'asc' | 'desc' } = { date: 'desc' }

    switch (view) {
      case 'today':
        where.date = { gte: startOfDay, lt: endOfDay }
        orderBy = { date: 'asc' }
        break
      case 'upcoming':
        where.date = { gte: now }
        where.status = { in: ['PENDING', 'CONFIRMED'] }
        orderBy = { date: 'asc' }
        break
      case 'past':
        where.OR = [
          { date: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED'] } },
        ]
        orderBy = { date: 'desc' }
        break
    }

    const rows = await prisma.session.findMany({
      where,
      orderBy,
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        paymentStatus: true,
        notesEncrypted: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    const sessions = rows.map(({ notesEncrypted, ...rest }) => ({
      ...rest,
      notes: decryptField(notesEncrypted),
    }))

    return successResponse(sessions)
  } catch {
    return serverErrorResponse()
  }
}
