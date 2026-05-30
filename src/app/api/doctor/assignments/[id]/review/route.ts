import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { encryptField, decryptField } from '@/lib/encryption'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    const assignment = await prisma.assignment.findUnique({ where: { id } })
    if (!assignment) return errorResponse('Assignment not found', 404)
    if (assignment.doctorId !== doctor.id) {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote : undefined

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        status: 'REVIEWED',
        reviewNote,
        ...(reviewNote !== undefined
          ? { reviewNoteEncrypted: encryptField(reviewNote) }
          : {}),
      },
      select: {
        id: true,
        doctorId: true,
        userId: true,
        type: true,
        title: true,
        descriptionEncrypted: true,
        instructionsEncrypted: true,
        reviewNoteEncrypted: true,
        fileUrl: true,
        submissionUrl: true,
        status: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const { descriptionEncrypted, instructionsEncrypted, reviewNoteEncrypted, ...rest } = updated
    return successResponse({
      ...rest,
      description: decryptField(descriptionEncrypted),
      instructions: decryptField(instructionsEncrypted) ?? '',
      reviewNote: decryptField(reviewNoteEncrypted),
    })
  } catch {
    return serverErrorResponse()
  }
}
