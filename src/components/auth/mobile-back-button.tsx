'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface MobileBackButtonProps {
  /** Where to navigate. When omitted, the button calls router.back(). */
  href?: string
  /** Accessible label for the icon-only button. Defaults to "Go back". */
  ariaLabel?: string
}

// 40x40 circular back button matching handoff auth-recovery.jsx headers.
// Used at the top-left of every mobile auth screen. When `href` is set the
// destination is fixed (Link); otherwise router.back() — preferred for
// screens reached via varied entry points.
export default function MobileBackButton({
  href,
  ariaLabel = 'Go back',
}: MobileBackButtonProps) {
  const router = useRouter()

  const sharedClassName = 'inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80'
  const sharedStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    background: 'var(--bg-card)',
    color: 'var(--primary)',
    boxShadow: 'var(--shadow-card)',
  }

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={sharedClassName} style={sharedStyle}>
        <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={ariaLabel}
      className={sharedClassName}
      style={sharedStyle}
    >
      <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}
