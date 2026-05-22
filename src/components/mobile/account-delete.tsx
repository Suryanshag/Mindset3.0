'use client'

// Phase 6 — Mobile Account-delete 4-step flow. Ports app/account-delete.jsx
// (237 LOC) with two policy overrides confirmed with the owner on
// 2026-05-22:
//   1) Step 1 retention card: do NOT enumerate retention windows inline —
//      point at /privacy instead. (Owner: legal hasn't signed off on the
//      RCI 3y / tax / 1y audit numbers in the design.)
//   2) Step 4 copy: 30-day grace, cancel by logging back in, with
//      hello@mindset.org.in as a backup channel.
// Wires to requestAccountDeletion + signOutAfterDeletionRequest server
// actions in src/lib/actions/account.ts.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconArrowRight, IconLeaf } from './icons'
import { SUPPORT_EMAIL } from '@/lib/constants/contact'
import {
  requestAccountDeletion,
  signOutAfterDeletionRequest,
} from '@/lib/actions/account'

const REASONS = [
  'Not for me right now',
  'Privacy concerns',
  'Found another platform',
  'Something else',
] as const

type Reason = (typeof REASONS)[number]

export default function MobileAccountDelete() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [reason, setReason] = useState<Reason | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [confirm, setConfirm] = useState('')
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()

  function handleBack() {
    if (step === 0) router.push('/user/profile/privacy')
    else setStep(step - 1)
  }

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
      setStep(3)
    })
  }

  return (
    <div
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
      }}
    >
      {step < 3 && (
        <header
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text)',
            }}
          >
            <IconArrowLeft size={18} sw={1.8} />
          </button>
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background:
                    i <= step ? 'var(--primary)' : 'var(--border-strong)',
                  transition: 'background .3s',
                }}
              />
            ))}
          </div>
        </header>
      )}

      <div key={step} style={{ animation: 'fadeUp .6s both' }}>
        {step === 0 && (
          <Step1
            onContinue={() => setStep(1)}
            onCancel={() => router.push('/user/profile/privacy')}
          />
        )}
        {step === 1 && (
          <Step2
            reason={reason}
            setReason={setReason}
            reasonText={reasonText}
            setReasonText={setReasonText}
            onContinue={() => setStep(2)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step3
            confirm={confirm}
            setConfirm={setConfirm}
            submitting={submitting}
            error={submitError}
            canSubmit={!!reason}
            onDelete={handleDelete}
          />
        )}
        {step === 3 && <Step4 scheduledFor={scheduledFor} />}
      </div>
    </div>
  )
}

function Step1({
  onContinue,
  onCancel,
}: {
  onContinue: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ paddingBottom: 30 }}>
      <section style={{ padding: '6px 24px 0' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-deep)',
          }}
        >
          Account deletion
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 34, marginTop: 8, lineHeight: 1.0 }}
        >
          Are you sure?
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 15.5,
            color: 'var(--text-muted)',
            marginTop: 12,
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          Deleting is permanent. Take a moment with what&apos;s below.
        </p>
      </section>

      <section style={{ padding: '24px 20px 0', display: 'grid', gap: 14 }}>
        <DelCard
          bg="var(--accent-tint)"
          title="This will be deleted"
          items={[
            'Your account and profile',
            'All journal entries',
            'All mood logs and check-ins',
            'Saved addresses and payment methods on file',
            'Your cart and saved items',
          ]}
          dot="var(--accent)"
        />
        <DelCard
          bg="var(--primary-tint)"
          title="We're required to retain"
          items={[
            'Some records (clinical notes, payment receipts, audit logs) are retained per Indian law.',
          ]}
          dot="var(--primary)"
        />
        <div style={{ padding: '0 4px' }}>
          <Link
            href="/privacy"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Why is this kept? Read our privacy policy.
          </Link>
        </div>
      </section>

      <section style={{ padding: '28px 20px 0', display: 'grid', gap: 10 }}>
        <button
          type="button"
          onClick={onContinue}
          style={{
            padding: 16,
            borderRadius: 999,
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          Continue <IconArrowRight size={16} sw={2.2} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: 16,
            borderRadius: 999,
            background: 'transparent',
            color: 'var(--text)',
            border: '1.5px solid var(--border-strong)',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Cancel
        </button>
      </section>
    </div>
  )
}

function DelCard({
  bg,
  title,
  items,
  dot,
}: {
  bg: string
  title: string
  items: string[]
  dot: string
}) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 18,
        padding: 18,
        animation: 'popIn .5s both',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'var(--text)',
        }}
      >
        {title}
      </div>
      <ul
        style={{
          margin: '10px 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gap: 8,
        }}
      >
        {items.map((t) => (
          <li
            key={t}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontSize: 13.5,
              lineHeight: 1.5,
              color: 'var(--text)',
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

function Step2({
  reason,
  setReason,
  reasonText,
  setReasonText,
  onContinue,
  onSkip,
}: {
  reason: Reason | null
  setReason: (r: Reason) => void
  reasonText: string
  setReasonText: (s: string) => void
  onContinue: () => void
  onSkip: () => void
}) {
  return (
    <div style={{ paddingBottom: 30 }}>
      <section style={{ padding: '6px 24px 0' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
          }}
        >
          Step 2
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 32, marginTop: 8, lineHeight: 1.05 }}
        >
          Mind sharing why?
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginTop: 12,
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          Optional. Helps us learn.
        </p>
      </section>

      <section style={{ padding: '22px 20px 0', display: 'grid', gap: 10 }}>
        {REASONS.map((r, i) => (
          <ReasonCard
            key={r}
            active={reason === r}
            label={r}
            onClick={() => setReason(r)}
            delay={i * 60}
          />
        ))}
      </section>

      {reason === 'Something else' && (
        <section style={{ padding: '14px 20px 0', animation: 'fadeUp .4s' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 18,
              padding: 14,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Tell us, if you want."
              maxLength={500}
              style={{
                width: '100%',
                minHeight: 80,
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                color: 'var(--text)',
              }}
            />
          </div>
        </section>
      )}

      <section style={{ padding: '28px 20px 0', display: 'grid', gap: 10 }}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!reason}
          style={{
            padding: 16,
            borderRadius: 999,
            background: reason ? 'var(--primary)' : 'var(--border-strong)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: reason ? 1 : 0.7,
          }}
        >
          Continue <IconArrowRight size={16} sw={2.2} />
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            padding: 14,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          Skip
        </button>
      </section>
    </div>
  )
}

function ReasonCard({
  active,
  label,
  onClick,
  delay,
}: {
  active: boolean
  label: string
  onClick: () => void
  delay: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        background: active ? 'var(--primary-tint)' : 'var(--bg-card)',
        borderLeft: active
          ? '4px solid var(--primary)'
          : '4px solid transparent',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: `slideIn .55s ${delay}ms both`,
      }}
    >
      <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
        {label}
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: active
            ? '6px solid var(--primary)'
            : '2px solid var(--border-strong)',
        }}
      />
    </button>
  )
}

function Step3({
  confirm,
  setConfirm,
  submitting,
  error,
  canSubmit,
  onDelete,
}: {
  confirm: string
  setConfirm: (s: string) => void
  submitting: boolean
  error: string | null
  canSubmit: boolean
  onDelete: () => void
}) {
  const ok = confirm === 'DELETE' && canSubmit && !submitting
  return (
    <div style={{ paddingBottom: 30 }}>
      <section style={{ padding: '6px 24px 0' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent-deep)',
          }}
        >
          Last step
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 32, marginTop: 8, lineHeight: 1.05 }}
        >
          Type DELETE to confirm.
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 15.5,
            color: 'var(--text-muted)',
            marginTop: 12,
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          You&apos;ll have 30 days to change your mind. To cancel any time
          before then, just log back in.
        </p>
      </section>

      <section style={{ padding: '28px 20px 0' }}>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          aria-label="Type DELETE to confirm"
          style={{
            width: '100%',
            textAlign: 'center',
            padding: '18px 20px',
            borderRadius: 18,
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg-card)',
            outline: 'none',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: 'var(--text)',
          }}
        />
      </section>

      {error && (
        <section style={{ padding: '14px 20px 0' }}>
          <div style={{ fontSize: 13, color: '#B23B2E' }}>{error}</div>
        </section>
      )}

      <section style={{ padding: '28px 20px 0' }}>
        <button
          type="button"
          onClick={onDelete}
          disabled={!ok}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 999,
            background: ok ? 'var(--accent)' : 'var(--border-strong)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: ok ? '0 12px 28px rgba(201,120,100,0.30)' : 'none',
          }}
        >
          {submitting ? 'Submitting…' : 'Delete my account'}
        </button>
      </section>
    </div>
  )
}

function Step4({ scheduledFor }: { scheduledFor: string | null }) {
  const dateLabel = scheduledFor
    ? new Date(scheduledFor).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          animation: 'fadeUp .8s both',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--bg-cream)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'popIn .6s both',
          }}
        >
          <IconLeaf size={36} sw={1.6} />
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginTop: 24,
          }}
        >
          Done
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 26, marginTop: 8, lineHeight: 1.1 }}
        >
          Your account is scheduled
          <br />for deletion{dateLabel ? ` on ${dateLabel}` : ''}.
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginTop: 16,
            fontStyle: 'italic',
            lineHeight: 1.55,
            maxWidth: 320,
          }}
        >
          To cancel any time before then, just log back in. Need help? Email{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{
              color: 'var(--primary)',
              fontStyle: 'normal',
              fontWeight: 700,
            }}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
      <div style={{ padding: '0 16px 20px' }}>
        <form action={signOutAfterDeletionRequest}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 15,
              fontWeight: 800,
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
