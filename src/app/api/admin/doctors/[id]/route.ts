import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { adminUpdateDoctorSchema } from '@/lib/validations/doctor'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const body = await req.json()

    const parsed = adminUpdateDoctorSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 404)
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_DOCTOR_PATCH]', error)
    return serverErrorResponse()
  }
}
