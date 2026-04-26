'use client'

import Link from 'next/link'
import { ShoppingCart, ShoppingBag, Plus } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

type Product = {
  id: string
  name: string
  price: number
  imageUrl: string | null
}

export default function ShopContent({
  cartCount,
  products,
}: {
  cartCount: number
  products: Product[]
}) {
  const featured = products[0] ?? null

  return (
    <div>
      <PageHeader
        title="Shop"
        back="/user/discover"
        rightAction={
          <div className="flex items-center gap-3">
            <Link
              href="/user/shop/orders"
              className="text-[12px] font-medium text-primary"
            >
              My orders
            </Link>
            <Link href="/user/shop/cart" className="relative p-1">
              <ShoppingCart size={20} className="text-text-muted" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[9px] font-medium text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        }
      />

      <div className="space-y-3.5 pt-3.5">
      {/* Featured product banner */}
      {featured && (
        <div className="rounded-2xl bg-primary-tint p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {featured.imageUrl ? (
                <img
                  src={featured.imageUrl}
                  alt={featured.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag size={24} className="text-primary/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider">
                Featured
              </p>
              <p className="text-[14px] font-medium text-text mt-0.5">
                {featured.name}
              </p>
              <p className="text-[13px] text-primary font-medium">
                {'\u20B9'}{featured.price}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12">
          <ShoppingBag size={28} className="text-text-faint mb-2" />
          <p className="text-[14px] text-text-muted">No products available yet</p>
        </div>
      )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div
      className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="w-full h-28 rounded-xl bg-bg-app flex items-center justify-center mb-2 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <ShoppingBag size={24} className="text-text-faint/30" />
          )}
        </div>
        <p className="text-[13px] font-medium text-text line-clamp-1">
          {product.name}
        </p>
        <p className="text-[12px] text-primary font-medium">
          {'\u20B9'}{product.price}
        </p>
      </Link>
      <button className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-full bg-primary-tint text-primary text-[11px] font-medium">
        <Plus size={12} />
        Add to cart
      </button>
    </div>
  )
}
