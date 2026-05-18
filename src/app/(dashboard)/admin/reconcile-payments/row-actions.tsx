'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CheckResult = {
  payment: Record<string, unknown>
  razorpay:
    | { error: string }
    | {
        order: Record<string, unknown> | null
        payments: Array<Record<string, unknown>>
        capturedPayment: Record<string, unknown> | null
        isCapturedButOurRowPending: boolean
      }
}

export default function ReconcileRowActions({
  paymentId,
  hasRazorpayOrder,
}: {
  paymentId: string
  hasRazorpayOrder: boolean
}) {
  const router = useRouter()
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/payments/check-razorpay?paymentId=${paymentId}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Razorpay check failed')
      } else {
        setCheck(data.data as CheckResult)
      }
    } catch {
      setError('Network error')
    } finally {
      setChecking(false)
    }
  }

  async function handleReconcile() {
    if (!window.confirm('Force-reconcile this payment? This marks it PAID, creates the downstream row (WorkshopRegistration / Session.CONFIRMED / Order.PAID), and sends the confirmation email to the user.')) {
      return
    }
    setReconciling(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Reconcile failed')
      } else {
        setDone(true)
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setReconciling(false)
    }
  }

  // Per the check, can this be reconciled?
  const rzp = check?.razorpay
  const captured = rzp && !('error' in rzp) && rzp.capturedPayment ? rzp.capturedPayment : null
  const showReconcile = !!captured && !done

  if (done) {
    return <span className="text-[12px] font-medium text-green-700">✓ Reconciled</span>
  }

  return (
    <div className="space-y-1.5 text-right">
      {!hasRazorpayOrder ? (
        <span className="text-[11px] text-gray-400 italic">No Razorpay order</span>
      ) : !check ? (
        <button
          onClick={handleCheck}
          disabled={checking}
          className="text-[12px] px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check Razorpay'}
        </button>
      ) : (
        <>
          {rzp && 'error' in rzp ? (
            <span className="text-[11px] text-red-600">{rzp.error}</span>
          ) : !captured ? (
            <span className="text-[11px] text-gray-500">Razorpay: no capture — likely abandoned</span>
          ) : (
            <>
              <div className="text-[11px] text-green-700">
                Razorpay says captured: <span className="font-mono">{String(captured.id)}</span>
              </div>
              {showReconcile && (
                <button
                  onClick={handleReconcile}
                  disabled={reconciling}
                  className="text-[12px] px-3 py-1.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                >
                  {reconciling ? 'Reconciling…' : 'Reconcile'}
                </button>
              )}
            </>
          )}
        </>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )
}
