'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import { SUPPORT_EMAIL } from '@/lib/constants/contact'
import {
  requestAccountDeletion,
  signOutAfterDeletionRequest,
} from '@/lib/actions/account'

// Phase 3j — Account deletion (Direction B port).
// Same server actions, same intent. Only chrome changes.

const REASONS = [
  'Not for me right now',
  'Privacy concerns',
  'Found another platform',
  'Something else',
] as const

type Reason = (typeof REASONS)[number]

export default function BProfileDelete() {
  const [reason, setReason] = useState<Reason | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()

  const canSubmit = !!reason && confirm === 'DELETE' && !submitting

  function handleDelete() {
    if (!reason) return
    setSubmitError(null)
    startSubmit(async () => {
      const result = await requestAccountDeletion({
        reason,
        freeText: reason === 'Something else' ? reasonText : undefined,
        confirm: 'DELETE',
      })
      if (!result.success) {
        setSubmitError(result.error)
        return
      }
      setScheduledFor(result.scheduledFor)
    })
  }

  if (scheduledFor) {
    return <DeletionSuccess scheduledFor={scheduledFor} />
  }

  return (
    <>
      <BPageHeader
        title="Delete your account."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'PRIVACY', href: '/user/profile/privacy' },
          { label: 'DELETE' },
        ]}
        back="/user/profile/privacy"
        sub="Permanent — take a moment with what&rsquo;s below before you confirm."
        ctas={['search']}
      />

      <div style={{ maxWidth: 760 }}>
        <BChip kind="accent">ACCOUNT DELETION</BChip>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 30,
            fontWeight: 500,
            color: 'var(--text)',
            marginTop: 14,
            lineHeight: 1.15,
          }}
        >
          Are you sure?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14.5,
            color: 'var(--text-muted)',
            marginTop: 8,
          }}
        >
          Deleting is permanent. There&rsquo;s a 30-day grace window — log back
          in any time before then and we restore everything.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 22 }}>
          <ConsequenceCard
            tone="danger"
            title="This will be deleted"
            items={[
              'Your account and profile',
              'All journal entries',
              'All mood logs and check-ins',
              'Saved addresses and payment methods',
              'Your cart and saved items',
            ]}
          />
          <ConsequenceCard
            tone="info"
            title="We&rsquo;re required to retain"
            items={[
              'Some records (clinical notes, payment receipts, audit logs) are retained per Indian law.',
            ]}
          />
        </div>

        <Link
          href="/privacy-policy"
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            color: 'var(--text-muted)',
            textDecoration: 'underline',
            marginTop: 14,
          }}
        >
          Why is this kept? Read our privacy policy.
        </Link>

        {/* Reason */}
        <div style={{ marginTop: 28 }}>
          <BCap>Mind sharing why?</BCap>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 12.5,
              color: 'var(--text-faint)',
              marginTop: 4,
            }}
          >
            Optional. Helps us improve the bits that aren&rsquo;t working.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REASONS.map((r) => {
              const active = reason === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: active ? 'var(--primary-tint)' : 'var(--bg-card)',
                    borderLeft: active
                      ? '4px solid var(--primary)'
                      : '4px solid transparent',
                    border: active
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {r}
                  </span>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: active
                        ? '6px solid var(--primary)'
                        : '2px solid var(--border-strong)',
                      flexShrink: 0,
                    }}
                  />
                </button>
              )
            })}
          </div>

          {reason === 'Something else' && (
            <BCard padding={14} style={{ marginTop: 10 }}>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Tell us, if you want."
                maxLength={500}
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  color: 'var(--text)',
                  resize: 'none',
                  border: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </BCard>
          )}
        </div>

        {/* Confirmation */}
        <div style={{ marginTop: 28 }}>
          <BCap>Type DELETE to confirm</BCap>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            style={{
              width: '100%',
              maxWidth: 420,
              marginTop: 10,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--text)',
              border: '1.5px solid var(--border-strong)',
            }}
          />
        </div>

        {submitError && (
          <p style={{ fontSize: 13, color: 'var(--accent-deep)', marginTop: 14 }}>
            {submitError}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingBottom: 48 }}>
          <Link
            href="/user/profile/privacy"
            style={{
              flex: 1,
              maxWidth: 200,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 20px',
              borderRadius: 999,
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text)',
              border: '1.5px solid var(--border-strong)',
              background: 'transparent',
            }}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canSubmit}
            style={{
              flex: 1,
              maxWidth: 280,
              padding: '12px 20px',
              borderRadius: 999,
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 700,
              background: canSubmit ? 'var(--accent)' : 'var(--border-strong)',
              color: '#fff',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </>
  )
}

function ConsequenceCard({
  tone,
  title,
  items,
}: {
  tone: 'danger' | 'info'
  title: string
  items: string[]
}) {
  const bg = tone === 'danger' ? 'var(--accent-tint)' : 'var(--primary-tint)'
  const dot = tone === 'danger' ? 'var(--accent)' : 'var(--primary)'
  return (
    <div style={{ background: bg, borderRadius: 14, padding: 18 }}>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, padding: 0, listStyle: 'none' }}>
        {items.map((t) => (
          <li
            key={t}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 13,
              color: 'var(--text)',
              lineHeight: 1.55,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: dot,
                marginTop: 7,
                flexShrink: 0,
              }}
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeletionSuccess({ scheduledFor }: { scheduledFor: string }) {
  const dateLabel = new Date(scheduledFor).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <BPageHeader
        title="Deletion scheduled."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'PRIVACY', href: '/user/profile/privacy' },
          { label: 'DELETE' },
        ]}
        sub="Sign out below — log back in any time within 30 days to cancel."
        ctas={['search']}
      />

      <div
        style={{
          maxWidth: 520,
          margin: '24px auto 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg-paper)',
            color: 'var(--accent)',
          }}
        >
          <Leaf size={36} strokeWidth={1.6} />
        </div>

        <div style={{ marginTop: 20 }}>
          <BChip kind="primary">DONE</BChip>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 500,
            color: 'var(--text)',
            marginTop: 14,
            lineHeight: 1.2,
          }}
        >
          Your account is scheduled for deletion on {dateLabel}.
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--text-muted)',
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          To cancel any time before then, just log back in. Need help? Email{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{ color: 'var(--primary)', fontStyle: 'normal', fontWeight: 500 }}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        <form action={signOutAfterDeletionRequest} style={{ marginTop: 28, width: '100%' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 22px',
              borderRadius: 999,
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}
