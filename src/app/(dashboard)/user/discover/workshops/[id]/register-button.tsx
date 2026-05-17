'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MessageCircle } from 'lucide-react'
import { registerForWorkshop } from '@/lib/actions/workshops'
import RazorpayCheckout from '@/components/payments/razorpay-checkout'

type Props = {
  workshopId: string
  isPast: boolean
  isFull: boolean
  isFree: boolean
  isRegistered: boolean
  whatsappUrl: string | null
  price: number
  workshopTitle: string
}

type PaymentSession = {
  razorpayOrderId: string
  amount: number
}

export default function WorkshopRegisterButton({
  workshopId,
  isPast,
  isFull,
  isFree,
  isRegistered,
  whatsappUrl,
  price,
  workshopTitle,
}: Props) {
  const router = useRouter()
  const { data: authSession } = useSession()

  const [showModal, setShowModal] = useState(false)
  const [modalWhatsapp, setModalWhatsapp] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // When set, mounts <RazorpayCheckout autoOpen> below the button.
  // Cleared when the modal dismisses or the payment succeeds.
  const [payment, setPayment] = useState<PaymentSession | null>(null)
  // Separate flag for "paid Razorpay checkout is loading" so the button
  // shows "Starting payment…" while we wait on /api/payments/create-order.
  const [paying, setPaying] = useState(false)

  async function handlePaidRegister() {
    setPaying(true)
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
        setPaying(false)
        return
      }
      setPayment({
        razorpayOrderId: data.data.razorpayOrderId,
        amount: data.data.amount,
      })
    } catch {
      setError('Could not start payment. Please try again.')
      setPaying(false)
    }
  }

  function handleFreeRegister() {
    setError(null)
    startTransition(async () => {
      const result = await registerForWorkshop(workshopId)
      if (result.error) {
        setError(result.error === 'full' ? 'Sorry, all spots have been filled' : result.error)
      } else if ('success' in result && result.success) {
        setModalWhatsapp(result.whatsappUrl ?? null)
        setShowModal(true)
        router.refresh()
      }
    })
  }

  function handlePaymentSuccess() {
    // Razorpay handler resolved — the webhook will create the registration
    // row server-side. Refresh so the page re-fetches and the
    // "You're enrolled" state takes over on next render.
    setPayment(null)
    setPaying(false)
    setModalWhatsapp(whatsappUrl)
    setShowModal(true)
    router.refresh()
  }

  function handlePaymentDismiss() {
    // User closed the Razorpay modal without paying — clear the session so
    // the button is clickable again.
    setPayment(null)
    setPaying(false)
  }

  // Past
  if (isPast) {
    return (
      <div className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
        style={{ border: '1px solid var(--color-border)' }}
      >
        This workshop has ended
      </div>
    )
  }

  // Already registered
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

  // Full
  if (isFull) {
    return (
      <div className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
        style={{ border: '1px solid var(--color-border)' }}
      >
        Spots filled
      </div>
    )
  }

  // Registerable
  const busy = isPending || paying
  const buttonLabel = busy
    ? isFree ? 'Registering…' : 'Starting payment…'
    : isFree
      ? 'Reserve spot'
      : `Pay ₹${(price / 100).toFixed(0)} and register`

  return (
    <>
      {payment && authSession?.user ? (
        // autoOpen=true triggers the Razorpay modal immediately on mount.
        // The wrapper button is the same shape as the original CTA so the
        // layout doesn't shift while the SDK loads.
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

      {error && (
        <p className="text-[13px] text-red-600 text-center">{error}</p>
      )}

      {/* Success modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-sm mx-4 mb-8 bg-bg-card rounded-2xl p-5 space-y-4"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div className="text-center">
              <p className="text-[18px] font-medium text-text">You&apos;re in!</p>
              {modalWhatsapp && (
                <p className="text-[13px] text-text-muted mt-2">
                  Join the WhatsApp group to get workshop details and reminders.
                </p>
              )}
              {!isFree && (
                <p className="text-[13px] text-text-muted mt-2">
                  A confirmation email is on its way.
                </p>
              )}
            </div>
            <div className="space-y-2.5">
              {modalWhatsapp && (
                <a
                  href={modalWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
                >
                  <MessageCircle size={16} />
                  Open WhatsApp group
                </a>
              )}
              <button
                onClick={() => setShowModal(false)}
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
