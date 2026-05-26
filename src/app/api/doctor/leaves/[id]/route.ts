import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN') return errorResponse('Forbidden', 403)

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const { id } = await params

    const leave = await prisma.doctorLeave.findUnique({ where: { id } })
    if (!leave) return errorResponse('Leave not found', 404)
    if (leave.doctorId !== doctor.id) return errorResponse('Forbidden', 403)

    await prisma.doctorLeave.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch {
    return serverErrorResponse()
  }
}
