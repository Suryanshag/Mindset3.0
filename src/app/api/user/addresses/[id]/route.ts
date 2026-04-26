import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { addressSchema } from '@/lib/validations/address'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'USER') {
      return errorResponse('Unauthorized', 401)
    }

    const address = await prisma.address.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!address) return errorResponse('Address not found', 404)
    return successResponse({ address })
  } catch (error) {
    console.error('[ADDRESS_GET]', error)
    return serverErrorResponse()
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'USER') {
      return errorResponse('Unauthorized', 401)
    }

    const existing = await prisma.address.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) return errorResponse('Address not found', 404)

    const body = await req.json()
    const parsed = addressSchema.partial().safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: session.user.id,
            id: { not: params.id },
          },
          data: { isDefault: false },
        })
      }
      return tx.address.update({
        where: { id: params.id },
        data: parsed.data,
      })
    })

    return successResponse({ address })
  } catch (error) {
    console.error('[ADDRESS_PATCH]', error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'USER') {
      return errorResponse('Unauthorized', 401)
    }

    const address = await prisma.address.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!address) return errorResponse('Address not found', 404)

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: params.id } })

      if (address.isDefault) {
        const oldest = await tx.address.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'asc' },
        })
        if (oldest) {
          await tx.address.update({
            where: { id: oldest.id },
            data: { isDefault: true },
          })
        }
      }
    })

    return successResponse({ message: 'Address deleted' })
  } catch (error) {
    console.error('[ADDRESS_DELETE]', error)
    return serverErrorResponse()
  }
}
