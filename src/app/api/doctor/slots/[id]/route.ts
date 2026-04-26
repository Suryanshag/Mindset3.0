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
    if (role !== 'DOCTOR' && role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const { id } = await params

    const slot = await prisma.availableSlot.findUnique({ where: { id } })
    if (!slot) return errorResponse('Slot not found', 404)
    if (slot.doctorId !== doctor.id) {
      return errorResponse('Forbidden', 403)
    }
    if (slot.isBooked) {
      return errorResponse('Cannot delete a booked slot')
    }

    await prisma.availableSlot.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch {
    return serverErrorResponse()
  }
}
