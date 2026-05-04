'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ShoppingBag, Plus, Check, Loader2 } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import { useCart } from '@/lib/cart-context'

type Product = {
  id: string
  name: string
  price: number
  imageUrl: string | null
  isDigital: boolean
  stock: number
}

export default function ShopContent({
  cartCount,
  products,
}: {
  cartCount: number
  products: Product[]
}) {
  const featured = products[0] ?? null
  const { totalItems } = useCart()
  const liveCount = totalItems || cartCount

  return (
    <div>
      <PageHeader
        title="Shop"
        back="/user/discover"
        rightAction={
          <div className="flex items-center gap-3">
            <Link
              href="/user/orders"
              className="text-[12px] font-medium text-primary"
            >
              My orders
            </Link>
            <Link href="/user/cart" className="relative p-1">
              <ShoppingCart size={20} className="text-text-muted" />
              {liveCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-medium text-white flex items-center justify-center">
                  {liveCount}
                </span>
              )}
            </Link>
          </div>
        }
      />

      <div className="space-y-3.5 pt-3.5">
      {/* Featured product banner */}
      {featured && (
        <Link href={`/user/shop/${featured.id}`} className="block rounded-2xl bg-primary-tint p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {featured.imageUrl ? (
                <Image
                  fill
                  src={featured.imageUrl}
                  alt={featured.name}
                  sizes="64px"
                  className="object-cover"
                  unoptimized
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
        </Link>
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
  const { addItem, items } = useCart()
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const inCart = items.some(i => i.productId === product.id)

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading || inCart) return
    setLoading(true)
    try {
      await addItem(product.id)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    } catch {
      // Error handled by cart context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <Link href={`/user/shop/${product.id}`}>
        <div className="relative w-full h-28 rounded-xl bg-bg-app flex items-center justify-center mb-2 overflow-hidden">
          {product.imageUrl ? (
            <Image
              fill
              src={product.imageUrl}
              alt={product.name}
              sizes="(max-width: 768px) 50vw, 200px"
              className="object-cover rounded-xl"
              unoptimized
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
      {inCart || added ? (
        <Link
          href="/user/cart"
          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-full bg-primary-tint text-primary text-[11px] font-medium"
        >
          <Check size={12} />
          In cart
        </Link>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading || (!product.isDigital && product.stock < 1)}
          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-full bg-primary-tint text-primary text-[11px] font-medium disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {loading ? 'Adding...' : 'Add to cart'}
        </button>
      )}
    </div>
  )
}
