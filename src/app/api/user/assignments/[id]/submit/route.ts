import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { submitAssignmentSchema } from '@/lib/validations/assignment'
import { sendAssignmentSubmitted } from '@/lib/email-service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    // Verify assignment belongs to user
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    })

    if (!assignment) return errorResponse('Assignment not found', 404)
    if (assignment.userId !== session.user.id) return errorResponse('Unauthorized', 401)

    const body = await req.json()
    const parsed = submitAssignmentSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        submissionUrl: parsed.data.submissionUrl,
        status: 'SUBMITTED',
      },
      select: {
        id: true,
        title: true,
        submissionUrl: true,
        status: true,
      },
    })

    // Send email to doctor (non-blocking)
    try {
      const submittedAssignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          doctor: {
            select: {
              user: { select: { name: true, email: true } },
            },
          },
          user: { select: { name: true } },
        },
      })
      if (submittedAssignment) {
        sendAssignmentSubmitted(
          submittedAssignment.doctor.user.email,
          {
            doctorName: submittedAssignment.doctor.user.name ?? 'Doctor',
            userName: submittedAssignment.user.name ?? 'Your patient',
            assignmentTitle: submittedAssignment.title,
            submittedAt: new Date(),
          }
        )
      }
    } catch (err) {
      console.error('[ASSIGNMENT] Submit email failed:', err)
    }

    return successResponse(updated)
  } catch (error) {
    console.error('[ASSIGNMENT_SUBMIT_ERROR]', error)
    return serverErrorResponse()
  }
}
