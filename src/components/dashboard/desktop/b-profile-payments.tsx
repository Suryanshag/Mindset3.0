'use client'

import { useEffect, useMemo, useState } from 'react'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3j — Payment history (Direction B port).

type Payment = {
  id: string
  amount: string
  type: string
  status: string
  createdAt: string
  razorpayPaymentId: string | null
}

const TYPE_LABELS: Record<string, string> = {
  SESSION: 'Session',
  PRODUCT: 'Product',
  EBOOK: 'Ebook',
  WORKSHOP: 'Workshop',
}

const TYPE_CHIP: Record<string, 'primary' | 'workshop' | 'neutral'> = {
  SESSION: 'primary',
  PRODUCT: 'neutral',
  EBOOK: 'neutral',
  WORKSHOP: 'workshop',
}

type Filter = 'all' | 'SESSION' | 'PRODUCT' | 'EBOOK' | 'WORKSHOP' | 'refunds'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'SESSION', label: 'Sessions' },
  { key: 'PRODUCT', label: 'Shop' },
  { key: 'WORKSHOP', label: 'Workshops' },
  { key: 'EBOOK', label: 'Ebooks' },
  { key: 'refunds', label: 'Refunds' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function BProfilePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/user/payments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPayments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totals = useMemo(() => {
    const t = {
      total: 0,
      session: 0,
      shop: 0,
      workshop: 0,
      refunds: 0,
      counts: {
        SESSION: 0,
        PRODUCT: 0,
        EBOOK: 0,
        WORKSHOP: 0,
        refunds: 0,
      },
    }
    for (const p of payments) {
      const amount = Number(p.amount)
      if (p.status === 'PAID') {
        t.total += amount
        if (p.type === 'SESSION') {
          t.session += amount
          t.counts.SESSION++
        } else if (p.type === 'PRODUCT' || p.type === 'EBOOK') {
          t.shop += amount
          t.counts[p.type as 'PRODUCT' | 'EBOOK']++
        } else if (p.type === 'WORKSHOP') {
          t.workshop += amount
          t.counts.WORKSHOP++
        }
      } else if (p.status === 'REFUNDED') {
        t.refunds += amount
        t.counts.refunds++
      }
    }
    return t
  }, [payments])

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    map.set('all', payments.length)
    for (const p of payments) {
      const key = p.status === 'REFUNDED' ? 'refunds' : (p.type as Filter)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [payments])

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    if (filter === 'refunds') return payments.filter((p) => p.status === 'REFUNDED')
    return payments.filter((p) => p.type === filter && p.status !== 'REFUNDED')
  }, [payments, filter])

  return (
    <>
      <BPageHeader
        title="Payment history."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'PAYMENTS' },
        ]}
        back="/user/profile"
        sub="Receipts and refunds for everything you&rsquo;ve paid Mindset."
        ctas={['search']}
      />

      {/* Totals band */}
      <BCard padding={0}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 18,
            padding: '16px 24px',
            alignItems: 'center',
          }}
        >
          <StatTile label="Total paid" value={totals.total} sub={`${payments.filter(p => p.status === 'PAID').length} paid`} />
          <StatTile label="Sessions" value={totals.session} sub={`${totals.counts.SESSION} sessions`} divider />
          <StatTile
            label="Shop"
            value={totals.shop}
            sub={`${totals.counts.PRODUCT + totals.counts.EBOOK} purchases`}
            divider
          />
          <StatTile label="Refunds" value={totals.refunds} sub={`${totals.counts.refunds} refunded`} divider />
        </div>
      </BCard>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const on = filter === f.key
          const count = counts.get(f.key) ?? 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? '#fff' : 'var(--text-muted)',
                border: on ? 'none' : '1px solid var(--border)',
              }}
            >
              {f.label}{' '}
              <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                · {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Ledger */}
      {loading ? (
        <BCard>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
        </BCard>
      ) : filtered.length === 0 ? (
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 13.5,
              color: 'var(--text-muted)',
            }}
          >
            Nothing in this filter.
          </p>
        </BCard>
      ) : (
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 90px 1fr 100px 80px',
              gap: 16,
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-faint)',
              letterSpacing: '0.08em',
            }}
          >
            <span>DATE</span>
            <span>KIND</span>
            <span>REFERENCE</span>
            <span>AMOUNT</span>
            <span>STATUS</span>
          </div>
          {filtered.map((p, i) => (
            <PaymentRow key={p.id} payment={p} first={i === 0} />
          ))}
        </BCard>
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
        }}
      >
        Receipts are emailed automatically. GST invoices for orders over ₹500.
      </p>
    </>
  )
}

function StatTile({
  label,
  value,
  sub,
  divider,
}: {
  label: string
  value: number
  sub: string
  divider?: boolean
}) {
  return (
    <div
      style={{
        borderLeft: divider ? '1px solid var(--border)' : 'none',
        paddingLeft: divider ? 18 : 0,
      }}
    >
      <BCap>{label}</BCap>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 500,
          marginTop: 4,
          lineHeight: 1,
          color: 'var(--text)',
        }}
      >
        ₹{value.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function PaymentRow({ payment, first }: { payment: Payment; first: boolean }) {
  const isRefund = payment.status === 'REFUNDED'
  const kind = TYPE_CHIP[payment.type] ?? 'neutral'
  const ref = payment.razorpayPaymentId
    ? `…${payment.razorpayPaymentId.slice(-8)}`
    : `#${payment.id.slice(0, 8)}`
  const amount = Number(payment.amount)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 90px 1fr 100px 80px',
        gap: 16,
        padding: '12px 20px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: 'var(--text-muted)',
        }}
      >
        {formatDate(payment.createdAt)}
      </span>
      <BChip kind={kind}>{TYPE_LABELS[payment.type] ?? payment.type}</BChip>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text)',
        }}
      >
        {ref}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14,
          fontWeight: 500,
          color: isRefund ? 'var(--accent-deep)' : 'var(--text)',
        }}
      >
        {isRefund ? '− ' : ''}₹{amount.toLocaleString('en-IN')}
      </span>
      <BChip kind={isRefund ? 'accent' : payment.status === 'PAID' ? 'primary' : 'neutral'}>
        {payment.status}
      </BChip>
    </div>
  )
}
