'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { registerForWorkshop } from '@/lib/actions/workshops'

type Props = {
  workshopId: string
  isPast: boolean
  isFull: boolean
  isFree: boolean
  isRegistered: boolean
  whatsappUrl: string | null
  price: number
}

export default function WorkshopRegisterButton({
  workshopId,
  isPast,
  isFull,
  isFree,
  isRegistered,
  whatsappUrl,
  price,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [modalWhatsapp, setModalWhatsapp] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleRegister() {
    if (!isFree) {
      // Paid flow — not implemented yet
      setError('Paid workshop registration coming soon')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await registerForWorkshop(workshopId)
      if (result.error) {
        if (result.error === 'full') {
          setError('Sorry, all spots have been filled')
        } else {
          setError(result.error)
        }
      } else if (result.success) {
        setModalWhatsapp(result.whatsappUrl ?? null)
        setShowModal(true)
        router.refresh()
      }
    })
  }

  // Past
  if (isPast) {
    return (
      <div className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
        style={{ border: '0.5px solid var(--color-border)' }}
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
            style={{ border: '0.5px solid var(--color-border)' }}
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
        style={{ border: '0.5px solid var(--color-border)' }}
      >
        Spots filled
      </div>
    )
  }

  // Registerable
  return (
    <>
      <button
        onClick={handleRegister}
        disabled={isPending}
        className="flex items-center justify-center w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium disabled:opacity-50"
      >
        {isPending
          ? 'Registering...'
          : isFree
            ? 'Reserve spot'
            : `Reserve spot \u00b7 \u20B9${(price / 100).toFixed(0)}`}
      </button>

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
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <div className="text-center">
              <p className="text-[18px] font-medium text-text">You&apos;re in!</p>
              {modalWhatsapp && (
                <p className="text-[13px] text-text-muted mt-2">
                  Join the WhatsApp group to get workshop details and reminders.
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
                style={{ border: '0.5px solid var(--color-border)' }}
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
