'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSession } from '@/lib/actions/sessions'

export default function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelSession(sessionId)
      if (result.error) {
        setError(result.error)
        setShowConfirm(false)
      } else {
        setShowConfirm(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center justify-center w-full h-[44px] rounded-full bg-bg-card text-red-600 text-[13px] font-medium"
        style={{ border: '1px solid var(--color-border)' }}
      >
        Cancel session
      </button>

      {error && (
        <p className="text-[12px] text-red-600 text-center">{error}</p>
      )}

      {/* Confirmation dialog overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isPending && setShowConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm mx-4 mb-8 bg-bg-card rounded-2xl p-5 space-y-4"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div>
              <p className="text-[16px] font-medium text-text">Cancel this session?</p>
              <p className="text-[13px] text-text-muted mt-1">
                You&apos;ll need to book again if you change your mind.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 h-[44px] rounded-full bg-bg-card text-text text-[14px] font-medium disabled:opacity-50"
                style={{ border: '1px solid var(--color-border)' }}
              >
                Keep session
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 h-[44px] rounded-full bg-red-600 text-white text-[14px] font-medium disabled:opacity-50"
              >
                {isPending ? 'Cancelling...' : 'Cancel session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
