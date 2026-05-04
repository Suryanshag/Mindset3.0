import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { addToCartSchema } from '@/lib/validations/order'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            image: true,
            stock: true,
            isActive: true,
            isDigital: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Filter out inactive products
    const activeItems = cartItems.filter((item) => item.product.isActive)

    // Clean up inactive items from cart
    const inactiveIds = cartItems
      .filter((item) => !item.product.isActive)
      .map((item) => item.id)
    if (inactiveIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: inactiveIds } },
      })
    }

    const items = activeItems.map((item) => ({
      productId: item.productId,
      product: {
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.image,
        stock: item.product.stock,
        isDigital: item.product.isDigital,
      },
      quantity: item.quantity,
    }))

    const totalAmount = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    return successResponse({ items, totalAmount, totalItems })
  } catch (error) {
    console.error('[CART_GET_ERROR]', error)
    return serverErrorResponse()
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = addToCartSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const { productId, quantity } = parsed.data

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, stock: true, isDigital: true },
    })

    if (!product || !product.isActive) {
      return errorResponse('Product not found or unavailable', 404)
    }

    if (!product.isDigital && product.stock < 1) {
      return errorResponse('Product is out of stock', 400)
    }

    // Check existing cart item to calculate new total quantity
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    })

    const newQuantity = existing ? existing.quantity + quantity : quantity
    if (!product.isDigital && newQuantity > product.stock) {
      return errorResponse(`Only ${product.stock} items available in stock`, 400)
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
      update: { quantity: newQuantity },
      create: {
        userId: session.user.id,
        productId,
        quantity,
      },
    })

    return successResponse(cartItem)
  } catch (error) {
    console.error('[CART_POST_ERROR]', error)
    return serverErrorResponse()
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    if (session.user.role !== 'USER' && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    })

    return successResponse({ cleared: true })
  } catch (error) {
    console.error('[CART_DELETE_ERROR]', error)
    return serverErrorResponse()
  }
}
