import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { NextRequest } from 'next/server'

const doctorSelect = {
  designation: true,
  type: true,
  photo: true,
  slug: true,
  user: { select: { name: true } },
}

const sessionSelect = {
  id: true,
  date: true,
  meetLink: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
  doctor: { select: doctorSelect },
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const userId = session.user.id
    const status = req.nextUrl.searchParams.get('status') ?? 'all'
    const now = new Date()

    if (status === 'upcoming') {
      const upcoming = await prisma.session.findMany({
        where: {
          userId,
          date: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: sessionSelect,
        orderBy: { date: 'asc' },
      })
      return successResponse({ upcoming, past: [] })
    }

    if (status === 'past') {
      const past = await prisma.session.findMany({
        where: {
          userId,
          OR: [
            { date: { lt: now } },
            { status: { in: ['COMPLETED', 'CANCELLED'] } },
          ],
        },
        select: sessionSelect,
        orderBy: { date: 'desc' },
      })
      return successResponse({ upcoming: [], past })
    }

    // status === 'all'
    const [upcoming, past] = await Promise.all([
      prisma.session.findMany({
        where: {
          userId,
          date: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: sessionSelect,
        orderBy: { date: 'asc' },
      }),
      prisma.session.findMany({
        where: {
          userId,
          OR: [
            { date: { lt: now } },
            { status: { in: ['COMPLETED', 'CANCELLED'] } },
          ],
        },
        select: sessionSelect,
        orderBy: { date: 'desc' },
      }),
    ])

    return successResponse({ upcoming, past })
  } catch (error) {
    console.error('[USER_SESSIONS_ERROR]', error)
    return serverErrorResponse()
  }
}
