import { prisma } from '@/lib/prisma'

export type ServerCartItem = {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  isDigital: boolean
}

/**
 * Server-side cart fetch. Mirrors the shape returned by GET /api/user/cart
 * so the client cart context can use it as initial state without a
 * round-trip on mount.
 *
 * Active-only items; inactive products are skipped (and cleaned up by the
 * API route on its first GET).
 */
export async function getInitialCartItems(userId: string): Promise<ServerCartItem[]> {
  const rows = await prisma.cartItem.findMany({
    where: { userId, product: { isActive: true } },
    include: {
      product: {
        select: { name: true, price: true, image: true, isDigital: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return rows.map((r) => ({
    productId: r.productId,
    name: r.product.name,
    price: Number(r.product.price),
    image: r.product.image,
    quantity: r.quantity,
    isDigital: r.product.isDigital,
  }))
}
