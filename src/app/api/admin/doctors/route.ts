import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const doctors = await prisma.doctor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: { select: { sessions: true } },
      },
    })

    // Batch-resolve verifier names so the admin edit page can show
    // "Verified on {date} by {name}" without an extra request per row.
    // `licenseVerifiedBy` is a raw User.id (no FK) so the admin-deleted
    // path lands here as a null verifier; the UI falls back to "Admin
    // (deleted)" when the map miss happens.
    const verifierIds = [
      ...new Set(
        doctors
          .map((d) => d.licenseVerifiedBy)
          .filter((v): v is string => !!v),
      ),
    ]
    const verifiers = verifierIds.length
      ? await prisma.user.findMany({
          where: { id: { in: verifierIds } },
          select: { id: true, name: true },
        })
      : []
    const verifierMap = new Map(verifiers.map((u) => [u.id, u.name]))

    const data = doctors.map((d) => ({
      ...d,
      licenseVerifierName: d.licenseVerifiedBy
        ? verifierMap.get(d.licenseVerifiedBy) ?? null
        : null,
    }))

    return successResponse(data)
  } catch (error) {
    console.error('[ADMIN_DOCTORS_GET]', error)
    return serverErrorResponse()
  }
}
