'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Loader2, MessageCircle } from 'lucide-react'
import { registerForWorkshop } from '@/lib/actions/workshops'
import RazorpayCheckout from '@/components/payments/razorpay-checkout'

type Props = {
  workshopId: string
  workshopTitle: string
  isPast: boolean
  isFull: boolean
  isFree: boolean
  isRegistered: boolean
  whatsappUrl: string | null
  price: number
}

type PaymentSession = {
  razorpayOrderId: string
  amount: number
  paymentId: string
}

// Drives the in-line panel below (or replacing) the register button. Each
// state corresponds to a distinct moment in the paid flow:
//   idle       — user hasn't clicked yet, button visible
//   opening    — POST /api/payments/create-order in flight
//   paying     — Razorpay modal mounted (autoOpen)
//   confirming — Razorpay handler fired, polling webhook for Payment.status
//   confirmed  — webhook flipped to PAID; router.refresh triggered the page
//                to re-render into the isRegistered branch
//   pending    — 30s polling timeout; payment captured but webhook hasn't
//                flipped status yet
//   error      — payment failed at Razorpay or registration errored
type FlowState =
  | 'idle'
  | 'opening'
  | 'paying'
  | 'confirming'
  | 'confirmed'
  | 'pending'
  | 'error'

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 30_000

export default function WorkshopRegisterButton({
  workshopId,
  workshopTitle,
  isPast,
  isFull,
  isFree,
  isRegistered,
  whatsappUrl,
  price,
}: Props) {
  const router = useRouter()
  const { data: authSession } = useSession()

  const [state, setState] = useState<FlowState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentSession | null>(null)

  // Free-flow success modal (kept for the "join WhatsApp" flow that
  // still makes sense there). Paid flow uses the state-driven UI below.
  const [showFreeModal, setShowFreeModal] = useState(false)
  const [freeModalWhatsapp, setFreeModalWhatsapp] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Refs so the Razorpay handler closures pick up the latest values
  // without re-mounting RazorpayCheckout.
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Poll Payment.status until CONFIRMED/FAILED or timeout. Triggered by the
  // Razorpay success handler.
  const pollPaymentStatus = async (paymentId: string) => {
    const startedAt = Date.now()
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = await res.json()
          const status = json?.data?.status
          if (status === 'PAID') {
            setState('confirmed')
            // Refresh so the server component re-runs and hits the
            // isRegistered branch.
            router.refresh()
            return
          }
          if (status === 'FAILED') {
            setState('error')
            setError(
              'Payment was reversed. If you were charged, the refund ' +
              'will appear in 5-7 business days. Try again or contact support.'
            )
            return
          }
        }
      } catch {
        // Transient network error during polling — keep trying.
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
    // Timeout — payment was captured client-side but webhook hasn't
    // flipped Payment.status yet (slow webhook, or transient outage).
    setState('pending')
  }

  async function handlePaidRegister() {
    setState('opening')
    setError(null)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WORKSHOP', workshopId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not start payment')
        setState('error')
        return
      }
      setPayment({
        razorpayOrderId: data.data.razorpayOrderId,
        amount: data.data.amount,
        paymentId: data.data.paymentId,
      })
      setState('paying')
    } catch {
      setError('Could not start payment. Please try again.')
      setState('error')
    }
  }

  function handleFreeRegister() {
    setError(null)
    startTransition(async () => {
      const result = await registerForWorkshop(workshopId)
      if (result.error) {
        setError(
          result.error === 'full'
            ? 'Sorry, all spots have been filled'
            : result.error
        )
      } else if ('success' in result && result.success) {
        setFreeModalWhatsapp(result.whatsappUrl ?? null)
        setShowFreeModal(true)
        router.refresh()
      }
    })
  }

  function handlePaymentSuccess() {
    // Razorpay captured client-side. The webhook will create the
    // WorkshopRegistration row + flip Payment.status server-side; poll
    // until that lands so the UI doesn't lie to the user.
    if (!payment) {
      setState('error')
      setError('Lost track of payment context — please refresh.')
      return
    }
    setState('confirming')
    pollPaymentStatus(payment.paymentId)
  }

  function handlePaymentDismiss() {
    // User closed the Razorpay modal without paying. Don't trigger
    // polling — there's nothing to confirm. Return to idle so the
    // button is clickable again.
    if (stateRef.current === 'paying') {
      setPayment(null)
      setState('idle')
    }
  }

  function handleErrorReset() {
    setError(null)
    setPayment(null)
    setState('idle')
  }

  // ─── Terminal states ────────────────────────────────────────────────

  if (isPast) {
    return (
      <div
        className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
        style={{ border: '1px solid var(--color-border)' }}
      >
        This workshop has ended
      </div>
    )
  }

  if (isRegistered) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-center w-full h-[48px] rounded-full bg-primary-tint text-primary text-[14px] font-medium">
          You&apos;re enrolled
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-[44px] rounded-full bg-bg-card text-text text-[13px] font-medium"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <MessageCircle size={16} />
            Open WhatsApp group
          </a>
        )}
      </div>
    )
  }

  if (isFull) {
    return (
      <div
        className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
        style={{ border: '1px solid var(--color-border)' }}
      >
        Spots filled
      </div>
    )
  }

  // ─── Paid flow in-flight states (mid-transaction UI) ────────────────

  if (state === 'confirming') {
    return (
      <div
        className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-primary-tint text-primary text-[14px] font-medium"
      >
        <Loader2 size={16} className="animate-spin" />
        Confirming your registration…
      </div>
    )
  }

  if (state === 'confirmed') {
    return (
      <div
        className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
      >
        <CheckCircle size={16} />
        You&apos;re in
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div className="space-y-2">
        <div
          className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-amber-100 text-amber-800 text-[14px] font-medium px-4 text-center"
        >
          Payment received — confirmation pending
        </div>
        <p className="text-[12px] text-text-muted text-center">
          We&apos;re finalizing your registration. Check your email in a
          minute, or refresh this page.
        </p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-2">
        <button
          onClick={handleErrorReset}
          className="flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
        >
          Try again
        </button>
        {error && (
          <p className="text-[13px] text-red-600 text-center">{error}</p>
        )}
      </div>
    )
  }

  // ─── Default (idle / opening / paying) — button + optional Razorpay ─

  const busy = isPending || state === 'opening' || state === 'paying'
  const buttonLabel = (() => {
    if (state === 'opening') return 'Starting payment…'
    if (state === 'paying') return 'Opening Razorpay…'
    if (isPending) return 'Registering…'
    if (isFree) return 'Reserve spot'
    return `Pay ₹${(price / 100).toFixed(0)} and register`
  })()

  return (
    <>
      {payment && authSession?.user ? (
        // autoOpen=true triggers the Razorpay modal immediately on mount.
        // RazorpayCheckout's own button label is irrelevant since the modal
        // pops on render; we keep it as a fallback "Re-open payment".
        <RazorpayCheckout
          orderId={payment.razorpayOrderId}
          amount={payment.amount}
          name={authSession.user.name ?? ''}
          email={authSession.user.email ?? ''}
          description={`Workshop: ${workshopTitle}`}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
          buttonText="Re-open payment"
          autoOpen
          className="flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
        />
      ) : (
        <button
          onClick={isFree ? handleFreeRegister : handlePaidRegister}
          disabled={busy}
          className="flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      )}

      {/* error from create-order failure or transient — error state has
          its own dedicated panel above, so by here state is idle/opening/
          paying and any lingering error message belongs inline */}
      {error && (
        <p className="text-[13px] text-red-600 text-center mt-2">{error}</p>
      )}

      {/* Free-flow success modal — paid flow uses the state-driven UI above */}
      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFreeModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-sm mx-4 mb-8 bg-bg-card rounded-2xl p-5 space-y-4"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div className="text-center">
              <p className="text-[18px] font-medium text-text">You&apos;re in!</p>
              {freeModalWhatsapp && (
                <p className="text-[13px] text-text-muted mt-2">
                  Join the WhatsApp group to get workshop details and reminders.
                </p>
              )}
            </div>
            <div className="space-y-2.5">
              {freeModalWhatsapp && (
                <a
                  href={freeModalWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
                >
                  <MessageCircle size={16} />
                  Open WhatsApp group
                </a>
              )}
              <button
                onClick={() => setShowFreeModal(false)}
                className="flex items-center justify-center w-full h-[44px] rounded-full bg-bg-card text-text-muted text-[13px] font-medium"
                style={{ border: '1px solid var(--color-border)' }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
