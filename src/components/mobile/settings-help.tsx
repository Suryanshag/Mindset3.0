'use client'

// Phase 6 — Mobile Help & support screen. Ports flows.jsx SettingsHelp
// (lines 392-412) but omits the "Call our team" row — Mindset does not
// have a staffed support line to ship yet (decided 2026-05-22). Chat +
// User guide rows ship to the live support email + WhatsApp community.

import { useState } from 'react'
import { Card } from './ui'
import SettingsShell, { SettingsRow } from './settings-shell'
import { IconChat, IconBook, IconChevR } from './icons'
import { SUPPORT_EMAIL, WHATSAPP_GROUP_URL } from '@/lib/constants/contact'

const FAQS: Array<[string, string]> = [
  [
    'How is Mindset different from therapy on its own?',
    "We pair 1:1 therapy with daily tools — journaling, mood check-ins, workshops, and assignments — so the work doesn't stop when the session ends.",
  ],
  [
    'Can I switch therapists?',
    "Yes, anytime. Your history transfers with your consent. Reach out to support and we'll re-pair you.",
  ],
  [
    'How do refunds work?',
    'Full refund up to 24 hours before a session. After that, we offer partial credit toward future bookings.',
  ],
  [
    'Are sessions recorded?',
    "Never. Only your own private notes are saved. Your therapist's clinical notes are encrypted and accessible only to your care team.",
  ],
  [
    'How do I update my phone number?',
    'Open Settings → Edit profile and change the number. If you need to clear it entirely, email support.',
  ],
]

export default function MobileSettingsHelp() {
  return (
    <SettingsShell title="Help &amp; support">
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '4px 4px 8px',
        }}
      >
        FAQ
      </div>
      <Card padding={0}>
        {FAQS.map(([q, a], i) => (
          <FAQItem key={i} q={q} a={a} last={i === FAQS.length - 1} />
        ))}
      </Card>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '24px 4px 8px',
        }}
      >
        Talk to us
      </div>
      <Card padding={0}>
        <SettingsRow
          icon={<IconChat size={18} sw={1.8} />}
          label="Chat with support"
          sub="Email us &mdash; replies within 24 hours"
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
            'Support request'
          )}`}
          trailing={<IconChevR size={16} sw={1.8} />}
        />
        <SettingsRow
          icon={<IconBook size={18} sw={1.8} />}
          label="Community on WhatsApp"
          sub="Join other Mindset users"
          href={WHATSAPP_GROUP_URL}
          trailing={<IconChevR size={16} sw={1.8} />}
          last
        />
      </Card>
    </SettingsShell>
  )
}

function FAQItem({ q, a, last }: { q: string; a: string; last?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          textAlign: 'left',
          background: 'transparent',
        }}
      >
        <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
          {q}
        </div>
        <span
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform .2s',
            display: 'inline-flex',
          }}
        >
          <IconChevR size={16} sw={1.8} />
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 14px',
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          {a}
        </div>
      )}
    </div>
  )
}
