import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ShopContent from '@/components/dashboard/shop/shop-content'

export default async function ShopPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [cartCount, products] = await Promise.all([
    prisma.cartItem
      .aggregate({
        where: { userId: session.user.id },
        _sum: { quantity: true },
      })
      .then((r) => r._sum.quantity ?? 0)
      .catch(() => 0),
    prisma.product
      .findMany({
        where: { isActive: true },
        select: { id: true, name: true, price: true, image: true, isDigital: true, stock: true },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []),
  ])

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    imageUrl: p.image,
    isDigital: p.isDigital,
    stock: p.stock,
  }))

  return <ShopContent cartCount={cartCount} products={serialized} />
}
