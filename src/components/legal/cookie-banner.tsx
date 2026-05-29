'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'mindset_cookie_consent_v1'
const CONSENT_VERSION = 1

type ConsentRecord = {
  essential: true
  analytics: boolean
  marketing: boolean
  consentedAt: string
  version: number
}

type Prefs = { analytics: boolean; marketing: boolean }

function readStoredConsent(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (typeof parsed !== 'object' || parsed === null) return null
    if (parsed.version !== CONSENT_VERSION) return null
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      consentedAt: typeof parsed.consentedAt === 'string' ? parsed.consentedAt : new Date().toISOString(),
      version: CONSENT_VERSION,
    }
  } catch {
    return null
  }
}

function writeConsent(prefs: Prefs) {
  const record: ConsentRecord = {
    essential: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    consentedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // localStorage unavailable (private window, quota) — banner will reappear next visit; acceptable degradation.
  }
}

export default function CookieBanner() {
  // `mounted` guards SSR: we render nothing until client hydration so localStorage check is safe.
  const [mounted, setMounted] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ analytics: false, marketing: false })

  // Refs for focus trap.
  const modalRef = useRef<HTMLDivElement | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    const existing = readStoredConsent()
    if (!existing) {
      setBannerOpen(true)
    } else {
      setPrefs({ analytics: existing.analytics, marketing: existing.marketing })
    }
  }, [])

  // Listen for an app-wide event so the Privacy Policy "Update cookie preferences"
  // button (and any future trigger) can reopen the customize modal.
  useEffect(() => {
    function handler() {
      const existing = readStoredConsent()
      if (existing) {
        setPrefs({ analytics: existing.analytics, marketing: existing.marketing })
      }
      setBannerOpen(true)
      setModalOpen(true)
    }
    window.addEventListener('mindset:open-cookie-preferences', handler)
    return () => window.removeEventListener('mindset:open-cookie-preferences', handler)
  }, [])

  const closeAll = useCallback(() => {
    setModalOpen(false)
    setBannerOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    const next = { analytics: true, marketing: true }
    setPrefs(next)
    writeConsent(next)
    closeAll()
  }, [closeAll])

  const rejectAll = useCallback(() => {
    const next = { analytics: false, marketing: false }
    setPrefs(next)
    writeConsent(next)
    closeAll()
  }, [closeAll])

  const savePrefs = useCallback(() => {
    writeConsent(prefs)
    closeAll()
  }, [prefs, closeAll])

  // Escape closes modal; focus trap keeps Tab inside.
  useEffect(() => {
    if (!modalOpen) return
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const node = modalRef.current
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.[0]?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setModalOpen(false)
        return
      }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lastFocusedRef.current?.focus?.()
    }
  }, [modalOpen])

  if (!mounted || (!bannerOpen && !modalOpen)) return null

  return (
    <>
      {bannerOpen && !modalOpen && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50"
          style={{
            background: 'var(--cream, #FFF8EB)',
            borderTop: '1px solid rgba(30, 68, 92, 0.18)',
            boxShadow: '0 -8px 24px rgba(30, 68, 92, 0.08)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="lg:flex-1">
              <p
                className="text-[14px] font-semibold mb-1"
                style={{ color: 'var(--navy, #1E445C)' }}
              >
                We use cookies
              </p>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: 'var(--navy, #1E445C)', opacity: 0.75 }}
              >
                Mindset uses cookies to keep you signed in, remember your preferences, and
                understand how our platform is used. Some cookies are required for the
                platform to work. You can choose what else to allow.{' '}
                <a
                  href="/cookies"
                  className="underline"
                  style={{ color: '#08646E' }}
                >
                  Read our cookie policy →
                </a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-[13px] font-medium px-4 py-2.5 rounded-lg"
                style={{ color: 'var(--navy, #1E445C)' }}
              >
                Customize
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="text-[13px] font-medium px-4 py-2.5 rounded-lg bg-white"
                style={{
                  color: 'var(--navy, #1E445C)',
                  border: '1px solid var(--navy, #1E445C)',
                }}
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="text-[13px] font-medium px-4 py-2.5 rounded-lg text-white"
                style={{ background: 'var(--navy, #1E445C)' }}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(30, 68, 92, 0.45)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            className="w-full max-w-[480px] rounded-2xl p-6"
            style={{ background: 'var(--cream, #FFF8EB)' }}
          >
            <h2
              id="cookie-prefs-title"
              className="text-[18px] font-semibold mb-4"
              style={{ color: 'var(--navy, #1E445C)' }}
            >
              Cookie preferences
            </h2>

            <div className="space-y-4">
              <PrefRow
                title="Essential"
                subtitle="Required to keep you signed in and your data secure."
                checked={true}
                disabled
              />
              <PrefRow
                title="Analytics"
                subtitle="Help us understand which features are useful. Anonymous, no personal data."
                checked={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <PrefRow
                title="Marketing"
                subtitle="Allow us to remember your preferences across visits."
                checked={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>

            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[13px] font-medium"
                style={{ color: 'var(--navy, #1E445C)', opacity: 0.7 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePrefs}
                className="text-[13px] font-medium px-4 py-2.5 rounded-lg text-white"
                style={{ background: 'var(--navy, #1E445C)' }}
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PrefRow({
  title,
  subtitle,
  checked,
  disabled,
  onChange,
}: {
  title: string
  subtitle: string
  checked: boolean
  disabled?: boolean
  onChange?: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <p
          className="text-[14px] font-semibold mb-0.5"
          style={{ color: 'var(--navy, #1E445C)' }}
        >
          {title}
        </p>
        <p
          className="text-[12px] leading-relaxed"
          style={{ color: 'var(--navy, #1E445C)', opacity: 0.7 }}
        >
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title}${disabled ? ' (required)' : ''}`}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className="shrink-0 mt-1 inline-flex items-center w-10 h-6 rounded-full transition-colors"
        style={{
          background: checked ? 'var(--teal, #0B9DA9)' : 'rgba(30, 68, 92, 0.25)',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          className="inline-block w-4 h-4 rounded-full bg-white transition-transform"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(4px)',
          }}
        />
      </button>
    </div>
  )
}
