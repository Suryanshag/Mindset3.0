import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createAssignmentSchema } from '@/lib/validations/assignment'
import { sendAssignmentCreated } from '@/lib/email-service'
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

    const status = req.nextUrl.searchParams.get('status')

    const assignments = await prisma.assignment.findMany({
      where: {
        doctorId: doctor.id,
        ...(status ? { status: status as 'PENDING' | 'SUBMITTED' | 'REVIEWED' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return successResponse(assignments)
  } catch {
    return serverErrorResponse()
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const parsed = createAssignmentSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    // Verify user is a patient of this doctor
    const hasSession = await prisma.session.count({
      where: { doctorId: doctor.id, userId: parsed.data.userId },
    })
    if (hasSession === 0) {
      return errorResponse('This user is not your patient', 403)
    }

    const assignment = await prisma.assignment.create({
      data: {
        doctorId: doctor.id,
        userId: parsed.data.userId,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description ?? '',
        instructions: parsed.data.instructions ?? '',
        fileUrl: parsed.data.fileUrl,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // In-app notification to user
    await prisma.notification.create({
      data: {
        userId: parsed.data.userId,
        kind: 'ASSIGNMENT_NEW',
        title: 'New assignment',
        body: `${session.user.name ?? 'Your therapist'} assigned "${parsed.data.title}"`,
        link: `/user/practice/assignments/${assignment.id}`,
      },
    })

    // Send email notification (non-blocking)
    try {
      if (assignment.user.email) {
        sendAssignmentCreated(assignment.user.email, {
          userName: assignment.user.name ?? 'there',
          doctorName: session.user.name ?? 'your doctor',
          assignmentTitle: assignment.title,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          description: parsed.data.description ?? '',
        })
      }
    } catch (err) {
      console.error('[ASSIGNMENT] Email notification failed:', err)
    }

    return successResponse(assignment, 201)
  } catch {
    return serverErrorResponse()
  }
}
