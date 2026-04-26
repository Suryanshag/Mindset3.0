import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { updateDoctorProfileSchema } from '@/lib/validations/doctor'

async function getDoctorFromSession() {
  const session = await auth()
  if (!session?.user) return { error: errorResponse('Unauthorized', 401) }

  const role = session.user.role as string
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return { error: errorResponse('Forbidden', 403) }
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { name: true, email: true, phone: true, role: true },
      },
    },
  })

  if (!doctor) return { error: errorResponse('Doctor profile not found', 404) }
  return { doctor }
}

export async function GET() {
  try {
    const result = await getDoctorFromSession()
    if ('error' in result) return result.error
    return successResponse(result.doctor)
  } catch {
    return serverErrorResponse()
  }
}

export async function PATCH(req: Request) {
  try {
    const result = await getDoctorFromSession()
    if ('error' in result) return result.error

    const body = await req.json()
    const parsed = updateDoctorProfileSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const updated = await prisma.doctor.update({
      where: { id: result.doctor.id },
      data: parsed.data,
      include: {
        user: {
          select: { name: true, email: true, phone: true, role: true },
        },
      },
    })

    return successResponse(updated)
  } catch {
    return serverErrorResponse()
  }
}
