import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/page-header'
import ProductActions from '@/components/products/product-actions'

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

  return (
    <div>
      <PageHeader title={product.name} back="/user/shop" />

      <div className="pt-3.5 space-y-4 lg:max-w-[680px] lg:mx-auto">
        {/* Product image */}
        <div className="relative w-full aspect-[4/3] rounded-2xl bg-bg-card overflow-hidden flex items-center justify-center"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          {product.image ? (
            <Image
              fill
              src={product.image}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, 680px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-text-faint text-[48px]">{'\u{1F4E6}'}</div>
          )}
        </div>

        {/* Price + digital badge */}
        <div className="flex items-center gap-3">
          <p className="text-[22px] font-bold text-text">
            {'\u20B9'}{serialized.price.toLocaleString('en-IN')}
          </p>
          {product.isDigital && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary-tint text-primary">
              Digital Product
            </span>
          )}
        </div>

        {/* Stock / availability */}
        {product.isDigital ? (
          <p className="text-[13px] text-primary">
            Available immediately after purchase
          </p>
        ) : (
          <p className={`text-[13px] ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
        )}

        {/* Add to cart */}
        <ProductActions product={serialized} />

        {/* Description */}
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2">
            Description
          </p>
          <p className="text-[14px] text-text leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  )
}
