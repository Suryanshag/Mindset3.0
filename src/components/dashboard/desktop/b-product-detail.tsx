import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import ProductActions from '@/components/products/product-actions'

// Phase 3h — Single product detail (Direction B port).
// ProductActions client component drives the add-to-cart / out-of-stock
// flow exactly as before.

type Props = {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    stock: number
    image: string | null
    isDigital: boolean
  }
}

export default function BProductDetail({ product }: Props) {
  const breadcrumbTitle = product.name.slice(0, 40).toUpperCase()
  const breadcrumb = [
    { label: 'SHOP', href: '/user/shop' },
    { label: breadcrumbTitle },
  ]
  const sub = product.isDigital
    ? 'Digital · available immediately after purchase'
    : product.stock > 0
      ? `In stock · ships from Bengaluru in 3–5 days`
      : 'Out of stock'

  return (
    <>
      <BPageHeader title={product.name} breadcrumb={breadcrumb} back="/user/shop" sub={sub} ctas={['search']} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
        {/* Image */}
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              background: 'var(--bg-paper)',
              aspectRatio: '4 / 3',
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {product.image ? (
              <Image
                fill
                src={product.image}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 600px"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-faint)',
                }}
              >
                [ PRODUCT IMAGE ]
              </span>
            )}
          </div>
        </BCard>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <BChip kind={product.isDigital ? 'primary' : 'workshop'}>
              {product.isDigital ? 'DIGITAL' : 'MINDSET MADE'}
            </BChip>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                lineHeight: 1.15,
                marginTop: 12,
                color: 'var(--text)',
              }}
            >
              {product.name}
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 500,
                marginTop: 18,
                color: 'var(--text)',
              }}
            >
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-faint)',
                marginTop: 4,
              }}
            >
              {product.isDigital
                ? 'one-time purchase · yours to keep'
                : 'incl. all taxes · ships from Bengaluru in 2–5 days'}
            </div>
          </div>

          <ProductActions product={product} />

          {product.description && (
            <BCard>
              <BCap>About this product</BCap>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  color: 'var(--text)',
                  marginTop: 10,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}
              >
                {product.description}
              </p>
            </BCard>
          )}

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--text-faint)',
            }}
          >
            Profits from the shop fund our pay-what-you-can workshops.
          </p>
        </div>
      </div>
    </>
  )
}
