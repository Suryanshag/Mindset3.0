import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const updateWhatsappSchema = z.object({
  link: z.string().url().startsWith('https://chat.whatsapp.com/',
    'Must be a valid WhatsApp group invite link'),
  label: z.string().min(2).max(100).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const link = await prisma.whatsappLink.findFirst()
    return successResponse(link)
  } catch (error) {
    console.error('[ADMIN_WHATSAPP_GET]', error)
    return serverErrorResponse()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = updateWhatsappSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.whatsappLink.findFirst()

    let link
    if (existing) {
      link = await prisma.whatsappLink.update({
        where: { id: existing.id },
        data: {
          link: parsed.data.link,
          ...(parsed.data.label ? { label: parsed.data.label } : {}),
          updatedBy: session.user.id,
        },
      })
    } else {
      link = await prisma.whatsappLink.create({
        data: {
          link: parsed.data.link,
          label: parsed.data.label ?? 'NGO Drive',
          updatedBy: session.user.id,
        },
      })
    }

    return successResponse(link)
  } catch (error) {
    console.error('[ADMIN_WHATSAPP_PATCH]', error)
    return serverErrorResponse()
  }
}
