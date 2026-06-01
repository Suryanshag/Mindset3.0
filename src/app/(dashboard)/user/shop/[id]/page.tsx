import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileShopDetail from '@/components/mobile/shop-detail'
import BProductDetail from '@/components/dashboard/desktop/b-product-detail'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      image: true,
      isDigital: true,
    },
  })

  if (!product) notFound()

  const serialized = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    image: product.image,
    isDigital: product.isDigital,
  }

  const cartCount = await prisma.cartItem
    .aggregate({
      where: { userId: session.user.id },
      _sum: { quantity: true },
    })
    .then((r) => r._sum.quantity ?? 0)
    .catch(() => 0)

  return (
    <>
      {/* Mobile — Phase 5 ported product detail. */}
      <div className="lg:hidden">
        <MobileShopDetail p={serialized} cartCount={cartCount} />
      </div>

      {/* Desktop — Phase 3h Direction B port. */}
      <div className="hidden lg:block">
        <BProductDetail product={serialized} />
      </div>
    </>
  )
}
