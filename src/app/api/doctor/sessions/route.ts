import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { NextRequest } from 'next/server'

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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

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

    const sessions = await prisma.session.findMany({
      where,
      orderBy,
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

    return successResponse(sessions)
  } catch {
    return serverErrorResponse()
  }
}
