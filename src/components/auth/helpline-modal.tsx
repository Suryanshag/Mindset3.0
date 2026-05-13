'use client'

import { useEffect, useRef } from 'react'
import { X, PhoneCall } from 'lucide-react'

const HELPLINES = [
  { name: 'iCall', number: '9152987821', detail: 'Mon–Sat, 8 am – 10 pm' },
  { name: 'Vandrevala Foundation', number: '1860-266-2345', detail: '24×7, multilingual' },
  { name: 'KIRAN (Govt. of India)', number: '1800-599-0019', detail: '24×7, toll-free' },
] as const

interface HelplineModalProps {
  open: boolean
  onClose: () => void
}

export default function HelplineModal({ open, onClose }: HelplineModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="helpline-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(30,68,92,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-7 relative"
        style={{
          background: '#fff',
          boxShadow: '0 24px 60px rgba(30,68,92,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-lg transition-opacity hover:opacity-60"
          style={{ color: 'var(--navy)' }}
        >
          <X className="w-5 h-5" />
        </button>

        <h3
          id="helpline-title"
          className="text-xl font-bold mb-1"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}
        >
          Need help right now?
        </h3>
        <p className="text-sm mb-5" style={{ color: 'rgba(30,68,92,0.65)' }}>
          You are not alone. Trained listeners are available — calls are confidential and free.
        </p>

        <ul className="space-y-2.5">
          {HELPLINES.map((h) => (
            <li key={h.name}>
              <a
                href={`tel:${h.number.replace(/[-\s]/g, '')}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-150"
                style={{ background: 'var(--cream)', color: 'var(--navy)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(11,157,169,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--cream)'
                }}
              >
                <div>
                  <p className="text-sm font-semibold">{h.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(30,68,92,0.55)' }}>
                    {h.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--teal)' }}>
                  <PhoneCall className="w-4 h-4" />
                  {h.number}
                </div>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-xs mt-5 text-center" style={{ color: 'rgba(30,68,92,0.45)' }}>
          In an emergency, please call 112 or visit the nearest hospital.
        </p>
      </div>
    </div>
  )
}
