import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params

    // Verify this patient has sessions with this doctor
    const sessionCount = await prisma.session.count({
      where: { doctorId: doctor.id, userId },
    })
    if (sessionCount === 0) {
      return errorResponse('Patient not found', 404)
    }

    const [patient, patientSessions, assignments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      }),
      prisma.session.findMany({
        where: { doctorId: doctor.id, userId },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          meetLink: true,
          status: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.assignment.findMany({
        where: { doctorId: doctor.id, userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          submissionUrl: true,
          status: true,
          reviewNote: true,
          dueDate: true,
          createdAt: true,
        },
      }),
    ])

    if (!patient) return errorResponse('Patient not found', 404)

    return successResponse({ patient, sessions: patientSessions, assignments })
  } catch {
    return serverErrorResponse()
  }
}
