import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { updateCartItemSchema } from '@/lib/validations/order'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { productId } = await params
    const body = await req.json()
    const parsed = updateCartItemSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const { quantity } = parsed.data

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          productId,
        },
      })
      return successResponse({ removed: true })
    }

    // Verify stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, isActive: true },
    })

    if (!product || !product.isActive) {
      return errorResponse('Product not available', 404)
    }

    if (quantity > product.stock) {
      return errorResponse(`Only ${product.stock} items available in stock`, 400)
    }

    await prisma.cartItem.updateMany({
      where: {
        userId: session.user.id,
        productId,
      },
      data: { quantity },
    })

    return successResponse({ updated: true })
  } catch (error) {
    console.error('[CART_ITEM_PATCH_ERROR]', error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const { productId } = await params

    await prisma.cartItem.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    })

    return successResponse({ removed: true })
  } catch (error) {
    console.error('[CART_ITEM_DELETE_ERROR]', error)
    return serverErrorResponse()
  }
}
