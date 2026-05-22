'use client'

// Phase 6 — Mobile Privacy & data screen. Ports flows.jsx SettingsPrivacy
// (lines 335-359) with policy-aligned content:
//   - retention details are NOT enumerated inline (per owner: omit
//     specifics, link to /privacy)
//   - 2FA + connected-devices rows are OUT (Phase 6 brief)
//   - Download my data triggers requestDataExport (server action)
//   - Delete account routes to the 4-step flow at /user/profile/delete

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card } from './ui'
import SettingsShell, { SettingsRow } from './settings-shell'
import {
  IconShield,
  IconLock,
  IconDownload,
  IconCloseSmall,
  IconChevR,
} from './icons'
import { requestDataExport } from '@/lib/actions/account'

export default function MobileSettingsPrivacy() {
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
    <SettingsShell title="Privacy">
      {/* Reassurance card */}
      <Card
        padding={18}
        bg="var(--primary-tint)"
        radius={20}
        style={{ marginBottom: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'var(--bg-card)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconShield size={18} sw={1.8} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
              Your data is yours.
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text)',
                opacity: 0.75,
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Therapy notes, journal entries and check-ins are encrypted and
              never sold. You can export or delete them any time. Some records
              (clinical notes, payment receipts, audit logs) are retained per
              Indian law &mdash; see our{' '}
              <Link
                href="/privacy"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  fontWeight: 700,
                }}
              >
                Privacy Policy
              </Link>{' '}
              for details.
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '0 4px 8px',
        }}
      >
        Account &amp; data
      </div>

      <Card padding={0}>
        <SettingsRow
          icon={<IconLock size={18} sw={1.8} />}
          label="Change password"
          sub="Send a reset link to your email"
          href="/forgot-password"
          trailing={<IconChevR size={16} sw={1.8} />}
        />
        <SettingsRow
          icon={<IconDownload size={18} sw={1.8} />}
          label="Download my data"
          sub={downloading ? 'Preparing your file…' : 'A JSON copy of everything'}
          onClick={downloading ? undefined : handleDownload}
          trailing={<IconChevR size={16} sw={1.8} />}
        />
        <SettingsRow
          icon={<IconCloseSmall size={18} sw={1.8} />}
          label="Delete my account"
          sub="Permanent · 30-day grace period"
          href="/user/profile/delete"
          trailing={<IconChevR size={16} sw={1.8} />}
          last
          danger
        />
      </Card>

      {error && (
        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            color: '#B23B2E',
            padding: '0 4px',
          }}
        >
          {error}
        </div>
      )}
    </SettingsShell>
  )
}
