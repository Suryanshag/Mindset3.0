'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet, ChevronDown, Loader2, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface PayoutEarning {
  id: string
  amount: number
  sessionDate: string
  patientName: string | null
}

interface Payout {
  id: string
  amount: number
  method: 'UPI' | 'BANK_TRANSFER' | 'OTHER'
  transactionRef: string | null
  note: string | null
  paidAt: string
  sessionCount: number
  earnings: PayoutEarning[]
}

interface Summary {
  totalPaidOut: number
  payoutCount: number
  orphanedPaidAmount: number
  orphanedPaidCount: number
}

const IST = 'Asia/Kolkata'

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const METHOD_LABEL: Record<string, string> = {
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
}

export default function DoctorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/doctor/payouts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPayouts(d.data.payouts)
          setSummary(d.data.summary)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  const showOrphaned = (summary?.orphanedPaidAmount ?? 0) > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout History</h1>
          <p className="text-gray-500 text-sm mt-1">Settlements transferred to your account</p>
        </div>
        <Link
          href="/doctor/earnings"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
        >
          ← Back to Earnings
        </Link>
      </div>

      {/* Summary cards */}
      <div className={`grid gap-4 mb-8 ${showOrphaned ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div
          className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
          style={{ borderTop: '3px solid var(--teal)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,128,128,0.1)', color: 'var(--teal)' }}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Paid Out</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(summary?.totalPaidOut ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Lifetime settlements</p>
        </div>

        <div
          className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
          style={{ borderTop: '3px solid var(--coral)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,101,83,0.1)', color: 'var(--coral)' }}
            >
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Number of Payouts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.payoutCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Settlement events</p>
        </div>

        {showOrphaned && (
          <div
            className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
            style={{ borderTop: '3px solid #F59E0B' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-500">Awaiting Linkage</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(summary?.orphanedPaidAmount ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">Settled but not yet grouped — contact admin</p>
          </div>
        )}
      </div>

      {/* Payout list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Payouts</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No payouts yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Once your earnings are settled, they appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payouts.map((p) => {
              const istDate = toZonedTime(new Date(p.paidAt), IST)
              const isOpen = expanded.has(p.id)
              return (
                <div key={p.id}>
                  <button
                    onClick={() => toggleExpand(p.id)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(istDate, 'MMM d, yyyy')} · {METHOD_LABEL[p.method]} · {p.sessionCount} session{p.sessionCount === 1 ? '' : 's'}
                      </p>
                      {p.transactionRef && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">Ref: {p.transactionRef}</p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="bg-gray-50 px-6 py-4">
                      {p.note && (
                        <p className="text-sm text-gray-600 italic mb-3">&ldquo;{p.note}&rdquo;</p>
                      )}
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sessions in this payout</p>
                      <div className="space-y-1.5">
                        {p.earnings.map((e) => {
                          const ed = toZonedTime(new Date(e.sessionDate), IST)
                          return (
                            <div key={e.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">
                                {e.patientName ?? 'Patient'} · {format(ed, 'MMM d')}
                              </span>
                              <span className="font-medium text-gray-900">{fmt(e.amount)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400 italic mt-6">
        Settlements are processed by the Mindset finance team. For questions about a specific payout, use the contact form.
      </p>
    </div>
  )
}
