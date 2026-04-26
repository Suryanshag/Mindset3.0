import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const assignments = await prisma.assignment.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        submissionUrl: true,
        status: true,
        dueDate: true,
        createdAt: true,
        doctor: {
          select: {
            designation: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(assignments)
  } catch (error) {
    console.error('[USER_ASSIGNMENTS_ERROR]', error)
    return serverErrorResponse()
  }
}
