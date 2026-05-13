'use client'

import { useState } from 'react'
import { Mail, Loader2, X } from 'lucide-react'

interface VerifyEmailBannerProps {
  initialDismissed?: boolean
}

type SendState = 'idle' | 'sending' | 'sent' | 'error'

export default function VerifyEmailBanner({ initialDismissed = false }: VerifyEmailBannerProps) {
  const [dismissed, setDismissed] = useState(initialDismissed)
  const [state, setState] = useState<SendState>('idle')

  if (dismissed) return null

  const sendLink = async () => {
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/auth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) setState('sent')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-2.5"
      style={{
        background: 'rgba(255,170,17,0.12)',
        borderBottom: '1px solid rgba(255,170,17,0.25)',
      }}
    >
      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#92400E' }} aria-hidden="true" />
      <p className="text-xs sm:text-sm font-medium flex-1" style={{ color: '#92400E' }}>
        Verify your email to book sessions.
      </p>

      {state === 'sent' ? (
        <span className="text-xs font-semibold" style={{ color: '#065F46' }}>
          Link sent — check your inbox
        </span>
      ) : (
        <button
          type="button"
          onClick={sendLink}
          disabled={state === 'sending'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-60"
          style={{ background: '#92400E', color: '#fff' }}
        >
          {state === 'sending' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Sending…
            </>
          ) : state === 'error' ? (
            'Try again'
          ) : (
            'Send link'
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="p-1 rounded transition-opacity hover:opacity-70"
        style={{ color: '#92400E' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
