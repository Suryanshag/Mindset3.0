import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ngoJoinSchema } from '@/lib/validations/ngo'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { sendNgoJoinConfirmation } from '@/lib/email-service'
import { formLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function POST(req: NextRequest) {
  try {
    const decision = await formLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()

    const parsed = ngoJoinSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const { name, email, phone, city, age, interest } = parsed.data

    await prisma.ngoJoinRequest.create({
      data: { name, email, phone, city, age, interest },
    })

    const whatsappLink = await prisma.whatsappLink.findFirst({
      select: { link: true, label: true },
    })

    // Send confirmation email (non-blocking)
    // NGO join is a public form — use the submitted email/name
    try {
      // Get a recent upcoming NGO visit for context
      const upcomingVisit = await prisma.ngoVisit.findFirst({
        where: { isPublished: true },
        orderBy: { visitDate: 'desc' },
      })
      if (upcomingVisit) {
        sendNgoJoinConfirmation(email, {
          userName: name,
          ngoName: upcomingVisit.ngoName,
          visitDate: upcomingVisit.visitDate,
          location: upcomingVisit.location,
          whatsappLink: whatsappLink?.link ?? null,
        })
      }
    } catch (err) {
      console.error('[NGO] Join email failed:', err)
    }

    return successResponse({
      message: 'Registration successful',
      whatsappLink: whatsappLink?.link ?? null,
      whatsappLabel: whatsappLink?.label ?? null,
    }, 201)
  } catch (error) {
    console.error('[NGO_JOIN_ERROR]', error)
    return serverErrorResponse()
  }
}
