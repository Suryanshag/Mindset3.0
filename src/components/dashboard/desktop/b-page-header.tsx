'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useShellContext } from './b-shell-context'

// Phase 3a — Per-page header for the B desktop sub-pages. Mirrors the
// design's `BHeader` (b-shell.jsx) but extended with the Bell + Cart
// icons per B1 since the B spine doesn't include them. Right side, in
// order: optional ⌘K hint → Search button → primary CTA (Write/Book)
// → Bell → Cart. The icons always render; the Search button + primary
// CTA are opt-in via the `ctas` prop, matching the design's pattern.
//
// Back affordance (added later): a `back` href renders a tiny ← arrow
// inline at the start of the breadcrumb row. The breadcrumb prop also
// accepts an array so each crumb can be a Link.

type CtaKind = 'search' | 'write' | 'book'

export type BreadcrumbCrumb = { label: string; href?: string }

type Props = {
  title: string
  /** Small caption above the title. String renders as-is (non-clickable).
   *  Array renders each crumb separately; entries with `href` are Links. */
  breadcrumb?: string | BreadcrumbCrumb[]
  /** Optional href for a tiny ← arrow that sits at the start of the
   *  breadcrumb row. Use this to give sub-pages a back affordance. */
  back?: string
  /** One-line sub-heading under the title. */
  sub?: string
  /** Which content CTAs to render on the right.
   *  Defaults to `["search", "write"]` to match the design's BHeader. */
  ctas?: CtaKind[]
}

const CAPTION_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  color: 'var(--text-faint)',
  letterSpacing: '0.06em',
}

function Breadcrumb({ crumbs }: { crumbs: string | BreadcrumbCrumb[] }) {
  if (typeof crumbs === 'string') {
    return <span style={CAPTION_STYLE}>{crumbs}</span>
  }
  return (
    <span style={CAPTION_STYLE}>
      {crumbs.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span style={{ margin: '0 8px' }}>/</span>}
          {c.href ? (
            <Link
              href={c.href}
              className="hover:underline"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {c.label}
            </Link>
          ) : (
            <span>{c.label}</span>
          )}
        </Fragment>
      ))}
    </span>
  )
}

export default function BPageHeader({
  title,
  breadcrumb,
  back,
  sub,
  ctas = ['search', 'write'],
}: Props) {
  const { unreadCount } = useShellContext()
  const { totalItems } = useCart()
  const cartLabel = totalItems > 9 ? '9+' : String(totalItems)
  const showCaptionRow = Boolean(back) || Boolean(breadcrumb)

  return (
    <div className="flex items-baseline justify-between gap-4">
      {/* Left: breadcrumb (+ back) + title + sub */}
      <div className="min-w-0">
        {showCaptionRow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            {back && (
              <Link
                href={back}
                aria-label="Back"
                title="Back"
                className="hover:opacity-80"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--text-faint)',
                  marginRight: breadcrumb ? 10 : 0,
                }}
              >
                <ArrowLeft size={12} strokeWidth={2.2} />
              </Link>
            )}
            {breadcrumb && <Breadcrumb crumbs={breadcrumb} />}
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.05,
            color: 'var(--text)',
          }}
        >
          {title}
        </h1>
        {sub && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {sub}
          </p>
        )}
      </div>

      {/* Right: ⌘K + Search button + CTA + Bell + Cart */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            marginRight: 4,
          }}
          aria-hidden="true"
        >
          ⌘K
        </span>

        {ctas.includes('search') && (
          <button
            type="button"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            Search
          </button>
        )}

        {ctas.includes('write') && (
          <Link
            href="/user/reflection/today"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Write +
          </Link>
        )}

        {ctas.includes('book') && (
          <Link
            href="/user/sessions/book"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Book session +
          </Link>
        )}

        {/* Bell — notifications inbox */}
        <Link
          href="/user/notifications"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          className="relative inline-flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <Bell size={16} strokeWidth={1.7} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
              aria-hidden="true"
            />
          )}
        </Link>

        {/* Cart — links to /user/cart, badge if items */}
        <Link
          href="/user/cart"
          aria-label={totalItems > 0 ? `Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}` : 'Cart'}
          className="relative inline-flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <ShoppingBag size={16} strokeWidth={1.7} />
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cartLabel}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}
