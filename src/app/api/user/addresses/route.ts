import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { addressSchema } from '@/lib/validations/address'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'USER') {
      return errorResponse('Unauthorized', 401)
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return successResponse({ addresses })
  } catch (error) {
    console.error('[ADDRESSES_GET]', error)
    return serverErrorResponse()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'USER') {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const parsed = addressSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const count = await prisma.address.count({
      where: { userId: session.user.id },
    })

    if (count >= 3) {
      return errorResponse(
        'Maximum 3 addresses allowed. Delete one first.',
        400
      )
    }

    const isFirstAddress = count === 0
    const shouldBeDefault = parsed.data.isDefault || isFirstAddress

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        })
      }
      return tx.address.create({
        data: {
          ...parsed.data,
          userId: session.user.id,
          isDefault: shouldBeDefault,
        },
      })
    })

    return successResponse({ address })
  } catch (error) {
    console.error('[ADDRESSES_POST]', error)
    return serverErrorResponse()
  }
}
