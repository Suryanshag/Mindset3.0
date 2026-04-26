import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { createProductSchema } from '@/lib/validations/product'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orderItems: true } } },
    })

    return successResponse(products)
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_GET]', error)
    return serverErrorResponse()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const product = await prisma.product.create({ data: parsed.data })
    return successResponse(product, 201)
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_POST]', error)
    return serverErrorResponse()
  }
}
