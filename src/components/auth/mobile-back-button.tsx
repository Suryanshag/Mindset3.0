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

  // 44x44 satisfies WCAG 2.5.5 minimum tap target without needing a hidden
  // hit-zone overlay. The handoff prototype rendered 40x40 — small visual
  // drift; accessibility is the harder constraint.
  const sharedClassName = 'inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
  const sharedStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    background: 'var(--bg-card)',
    color: 'var(--primary)',
    boxShadow: 'var(--shadow-card)',
    outlineColor: 'var(--primary)',
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
