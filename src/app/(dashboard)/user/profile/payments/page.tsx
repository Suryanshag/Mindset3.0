'use client'

import { useState, useEffect } from 'react'
import { CreditCard } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

interface Payment {
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
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PAID: { bg: 'bg-primary-tint', text: 'text-primary' },
  PENDING: { bg: 'bg-accent-tint', text: 'text-accent-deep' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-text-muted' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ProfilePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/payments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPayments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalSpent = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) {
    return (
      <div>
        <PageHeader title="Payments" back="/user/profile" />
        <div className="space-y-3 pt-5">
          <div className="h-20 rounded-2xl bg-bg-card animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Payments" back="/user/profile" />

      <div className="space-y-3.5 pt-5">
        {/* Total card */}
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[12px] text-text-faint">Total spent</p>
          <p className="text-[24px] font-medium text-text mt-0.5">
            &#8377;{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Payment list */}
        {payments.length === 0 ? (
          <div
            className="bg-bg-card rounded-2xl py-16 flex flex-col items-center"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <CreditCard size={32} className="text-text-faint mb-3" />
            <p className="text-[14px] font-medium text-text">No payments yet</p>
            <p className="text-[12px] text-text-muted mt-1">Your payment history will appear here</p>
          </div>
        ) : (
          <div
            className="bg-bg-card rounded-2xl overflow-hidden"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            {payments.map((p, i) => {
              const statusStyle = STATUS_STYLES[p.status] ?? STATUS_STYLES.PENDING
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={
                    i < payments.length - 1
                      ? { borderBottom: '0.5px solid var(--color-border)' }
                      : undefined
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-text">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-faint mt-0.5">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <p className="text-[15px] font-medium text-text shrink-0">
                    &#8377;{Number(p.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
