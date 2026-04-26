import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createProductSchema } from '@/lib/validations/product'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return errorResponse('Product not found', 404)

    return successResponse(product)
  } catch (error) {
    console.error('[ADMIN_PRODUCT_GET]', error)
    return serverErrorResponse()
  }
}

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

    const schema = createProductSchema.partial()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    })

    return successResponse(updated)
  } catch (error) {
    console.error('[ADMIN_PRODUCT_PATCH]', error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    })
    if (!product) return errorResponse('Product not found', 404)

    if (product._count.orderItems > 0) {
      return errorResponse('Cannot delete product with existing orders. Deactivate it instead.', 400)
    }

    await prisma.product.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('[ADMIN_PRODUCT_DELETE]', error)
    return serverErrorResponse()
  }
}
