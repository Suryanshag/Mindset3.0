'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Shield, Lock, Download, X, ChevronRight } from 'lucide-react'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'
import { requestDataExport } from '@/lib/actions/account'

// Phase 3j — Privacy & data (Direction B port).
// Same server action, same three rows. Only chrome changes.

export default function BProfilePrivacy() {
  const [downloading, startDownload] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDownload() {
    setError(null)
    startDownload(async () => {
      try {
        const result = await requestDataExport()
        if (!result.success) {
          setError(result.error)
          return
        }
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed')
      }
    })
  }

  return (
    <>
      <BPageHeader
        title="Privacy &amp; data."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'PRIVACY' },
        ]}
        back="/user/profile"
        sub="Your data is yours. Export it, change your password, delete the account."
        ctas={['search']}
      />

      <BCard accent="var(--primary)" padding={22}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={18} strokeWidth={1.8} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              Your data is yours.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13.5,
                color: 'var(--text-muted)',
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              Therapy notes, journal entries and check-ins are encrypted and
              never sold. You can export or delete them any time. Some records
              (clinical notes, payment receipts, audit logs) are retained per
              Indian law &mdash; see our{' '}
              <Link
                href="/privacy-policy"
                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
              >
                Privacy Policy
              </Link>{' '}
              for details.
            </p>
          </div>
        </div>
      </BCard>

      <div>
        <BCap>Account &amp; data</BCap>
        <BCard padding={0} style={{ marginTop: 10, overflow: 'hidden' }}>
          <PrivacyRow
            icon={<Lock size={18} />}
            title="Change password"
            sub="Send a reset link to your email"
            href="/forgot-password"
            first
          />
          <PrivacyRow
            icon={<Download size={18} />}
            title="Download my data"
            sub={downloading ? 'Preparing your file…' : 'A JSON copy of everything'}
            onClick={downloading ? undefined : handleDownload}
            disabled={downloading}
          />
          <PrivacyRow
            icon={<X size={18} color="var(--accent-deep)" />}
            title="Delete my account"
            titleColor="var(--accent-deep)"
            sub="Permanent · 30-day grace period"
            href="/user/profile/delete"
          />
        </BCard>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--accent-deep)' }}>{error}</p>
      )}
    </>
  )
}

function PrivacyRow({
  icon,
  title,
  titleColor,
  sub,
  href,
  onClick,
  disabled,
  first,
}: {
  icon: React.ReactNode
  title: string
  titleColor?: string
  sub: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  first?: boolean
}) {
  const inner = (
    <>
      <span
        style={{
          color: 'var(--text-muted)',
          width: 24,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 500,
            color: titleColor ?? 'var(--text)',
            display: 'block',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
          {sub}
        </span>
      </span>
      <ChevronRight size={16} color="var(--text-faint)" />
    </>
  )

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    borderTop: first ? 'none' : '1px solid var(--border)',
    background: 'transparent',
    border: 'none',
    width: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    textAlign: 'left' as const,
  }

  if (href) {
    return (
      <Link href={href} style={baseStyle as React.CSSProperties}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={baseStyle}>
      {inner}
    </button>
  )
}
