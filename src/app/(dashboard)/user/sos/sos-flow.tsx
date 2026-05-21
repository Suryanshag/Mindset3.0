'use client'

// Phase 2 SOS triage flow — ported from app/sos.jsx (303 LOC).
// Three states: triage (initial choice) → support (helplines + Mindset
// therapist CTA) | crisis (warm, immediate-call buttons).
//
// CRITICAL: no tracking, no analytics, no session-timeout logic. Users
// in crisis need this surface to render predictably and work without
// friction. tel: + https://wa.me/ links rely on the device's default
// app handler (Android dialer / WhatsApp) — TWA delegates these to the
// system the same way a regular browser does.
//
// Helpline source: src/lib/safety/helplines.ts is the single source of
// truth (numbers verified 2026-05-20, Vandrevala uses the current
// 9999666555 not the design's outdated 1860-2662-345).

import { useState } from 'react'
import Link from 'next/link'
import { Card, Blob } from '@/components/mobile/ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconPhone,
  IconWhats,
} from '@/components/mobile/icons'
import { HELPLINES, whatsappHref, type Helpline } from '@/lib/safety/helplines'

type SosState = 'triage' | 'support' | 'crisis'
type TriagePath = 'calm' | 'support'

export default function SosFlow() {
  const [state, setState] = useState<SosState>('triage')
  const [path, setPath] = useState<TriagePath>('calm')

  return (
    <div
      key={state}
      style={{
        minHeight: '100%',
        position: 'relative',
        animation: 'fadeUp .35s both',
      }}
    >
      {state === 'triage' && (
        <SosTriage
          onPick={(p) => {
            setPath(p)
            setState('support')
          }}
          onCrisis={() => setState('crisis')}
        />
      )}
      {state === 'support' && (
        <SosSupport path={path} onBack={() => setState('triage')} />
      )}
      {state === 'crisis' && <SosCrisis onBack={() => setState('triage')} />}
    </div>
  )
}

// ─── Shared chrome ──────────────────────────────────────────────────
// SosFooter — every state shows the same legal/safety disclaimer.
function SosFooter() {
  return (
    <div style={{ padding: '20px 24px 24px', textAlign: 'center' }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Mindset is not an emergency service. If you or someone is in immediate
        danger, please call <a href="tel:112" style={{ color: 'var(--primary)', fontWeight: 700 }}>112</a>.
      </p>
    </div>
  )
}

// Back button — internal states use this for the in-flow back navigation
// (back to triage). The initial triage state's "Back to dashboard" is a
// real <Link> to /user.
function SosBack({
  onBack,
  dark,
  ariaLabel = 'Back',
}: {
  onBack: () => void
  dark?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={ariaLabel}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: dark ? 'rgba(255,248,235,0.18)' : 'rgba(255,255,255,0.6)',
        color: dark ? 'var(--on-dark)' : 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: dark ? 'none' : 'var(--shadow-card)',
      }}
    >
      <IconArrowLeft size={18} sw={1.8} />
    </button>
  )
}

// ─── State 1 — Triage (soft-pink background, warm pause) ─────────────
function SosTriage({
  onPick,
  onCrisis,
}: {
  onPick: (p: TriagePath) => void
  onCrisis: () => void
}) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--soft-pink)',
        minHeight: '100%',
        overflowY: 'auto',
      }}
    >
      <header style={{ padding: '14px 16px' }}>
        {/* Initial state: back goes to dashboard, not within the flow. */}
        <Link
          href="/user"
          aria-label="Back to dashboard"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            color: 'var(--text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
      </header>

      <section style={{ padding: '4px 24px 0', animation: 'fadeUp .6s both' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--accent-deep)',
            textTransform: 'uppercase',
          }}
        >
          You're not alone right now
        </div>
        <h1
          className="ms-display"
          style={{
            fontSize: 36,
            marginTop: 8,
            lineHeight: 1.0,
            color: 'var(--text)',
          }}
        >
          What feels right,
          <br />
          right now?
        </h1>
        <p
          className="ms-serif"
          style={{
            fontSize: 15,
            color: 'var(--text)',
            opacity: 0.75,
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          Pick the one that's closest — there's no wrong answer.
        </p>
      </section>

      <section style={{ padding: '24px 20px 0', display: 'grid', gap: 12 }}>
        <TriageCard
          title="I just need to talk."
          sub="We'll show you who can listen."
          accent="var(--primary)"
          onClick={() => onPick('calm')}
          delay={120}
        />
        <TriageCard
          title="I'm having a hard time."
          sub="Helplines and a Mindset therapist on standby."
          accent="var(--accent)"
          onClick={() => onPick('support')}
          delay={200}
        />
        <TriageCard
          title="I'm in danger, or thinking of hurting myself."
          sub="We'll get you to immediate support."
          emphasised
          onClick={onCrisis}
          delay={280}
        />
      </section>

      <SosFooter />
    </div>
  )
}

function TriageCard({
  title,
  sub,
  accent,
  emphasised,
  onClick,
  delay = 0,
}: {
  title: string
  sub: string
  accent?: string
  emphasised?: boolean
  onClick: () => void
  delay?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 20,
        borderRadius: 22,
        background: emphasised ? 'var(--accent)' : 'rgba(255,255,255,0.85)',
        color: emphasised ? 'var(--on-dark)' : 'var(--text)',
        borderLeft: emphasised ? 'none' : `4px solid ${accent}`,
        boxShadow: 'var(--shadow-card)',
        animation: `slideIn .55s ${delay}ms both`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="ms-display" style={{ fontSize: 20, lineHeight: 1.15 }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            opacity: 0.78,
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      </div>
      <IconArrowRight size={18} sw={2.2} style={{ opacity: 0.75 }} />
    </button>
  )
}

// ─── State 2 — Support (helplines + Mindset CTA) ────────────────────
function SosSupport({ path, onBack }: { path: TriagePath; onBack: () => void }) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 20,
      }}
    >
      <header style={{ padding: '14px 16px' }}>
        <SosBack onBack={onBack} ariaLabel="Back to triage" />
      </header>

      <section style={{ padding: '4px 24px 0', animation: 'fadeUp .6s both' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--primary)',
            textTransform: 'uppercase',
          }}
        >
          We're glad you're here
        </div>
        <h2
          className="ms-display"
          style={{
            fontSize: 32,
            marginTop: 8,
            lineHeight: 1.05,
            color: 'var(--text)',
          }}
        >
          {path === 'calm'
            ? "Here are people who'll listen."
            : 'Help is here. Take your time.'}
        </h2>
      </section>

      <section style={{ padding: '20px 20px 0', display: 'grid', gap: 10 }}>
        {HELPLINES.map((h, i) => (
          <HelplineRow key={h.id} h={h} delay={i * 70} />
        ))}
      </section>

      <section
        style={{ padding: '24px 20px 0', animation: 'fadeUp .6s .3s both' }}
      >
        <Card
          padding={20}
          radius={22}
          bg="var(--primary)"
          style={{
            color: 'var(--on-dark)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Blob
            fill="rgba(255,248,235,0.08)"
            style={{
              position: 'absolute',
              right: -40,
              top: -50,
              width: 200,
              height: 200,
            }}
          />
          <Blob
            fill="rgba(201,120,100,0.20)"
            d="M30 10 C70 6 110 30 100 70 C92 104 50 116 22 96 C-2 78 -6 30 30 10 Z"
            style={{
              position: 'absolute',
              left: -30,
              bottom: -50,
              width: 160,
              height: 160,
            }}
          />
          <div style={{ position: 'relative' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              Want to talk to someone now?
            </span>
            <p
              className="ms-serif"
              style={{
                fontSize: 16,
                lineHeight: 1.5,
                marginTop: 8,
                marginBottom: 0,
                opacity: 0.95,
              }}
            >
              Browse our therapists and book a same-week session.
            </p>
            <Link
              href="/user/sessions/book"
              style={{
                marginTop: 16,
                background: 'var(--on-dark)',
                color: 'var(--primary)',
                padding: '12px 18px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Find a therapist <IconArrowRight size={14} sw={2.4} />
            </Link>
          </div>
        </Card>
      </section>

      <SosFooter />
    </div>
  )
}

function HelplineRow({ h, delay = 0 }: { h: Helpline; delay?: number }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 18,
        padding: 16,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: `slideIn .5s ${delay}ms both`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--accent-tint)',
          color: 'var(--accent-deep)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconPhone size={18} sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--text)',
          }}
        >
          {h.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {h.hours}
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            color: 'var(--primary)',
            marginTop: 4,
            fontWeight: 700,
          }}
        >
          {h.display}
        </div>
        {h.whatsapp && (
          <a
            href={whatsappHref(h.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#0E8C45',
            }}
          >
            <IconWhats size={12} sw={1.9} /> WhatsApp
          </a>
        )}
      </div>
      <a
        href={`tel:${h.phone}`}
        style={{
          background: 'var(--primary)',
          color: 'var(--on-dark)',
          padding: '9px 16px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        Call
      </a>
    </div>
  )
}

// ─── State 3 — Crisis (warm, immediate-call surface) ────────────────
function SosCrisis({ onBack }: { onBack: () => void }) {
  const aasra = HELPLINES.find((h) => h.id === 'aasra')
  const icall = HELPLINES.find((h) => h.id === 'icall')
  const kiran = HELPLINES.find((h) => h.id === 'kiran')

  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
      }}
    >
      <header style={{ padding: '14px 16px' }}>
        <SosBack onBack={onBack} ariaLabel="Back to triage" />
      </header>

      <section style={{ padding: '4px 24px 0', animation: 'fadeUp .6s both' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--accent)',
            textTransform: 'uppercase',
          }}
        >
          We're with you
        </div>
        <h2
          className="ms-display"
          style={{
            fontSize: 32,
            marginTop: 8,
            lineHeight: 1.05,
            color: 'var(--text)',
          }}
        >
          We'll help you
          <br />
          get help, right now.
        </h2>
        <p
          className="ms-serif"
          style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          If you're with someone, please tell them what you're feeling.
        </p>
      </section>

      <section style={{ padding: '24px 20px 0', display: 'grid', gap: 12 }}>
        {aasra && (
          <CrisisCallButton
            href={`tel:${aasra.phone}`}
            label="Call AASRA now"
            sub={`24/7 emotional support · ${aasra.display}`}
            bg="var(--accent)"
            fg="var(--on-dark)"
            delay={120}
          />
        )}
        {icall && (
          <CrisisCallButton
            href={`tel:${icall.phone}`}
            label="Call iCall"
            sub={`${icall.hours} · ${icall.display}`}
            bg="var(--primary-soft)"
            fg="var(--on-dark)"
            delay={200}
          />
        )}
        {kiran && (
          <CrisisCallButton
            href={`tel:${kiran.phone}`}
            label="Call KIRAN (Govt. of India)"
            sub={`24/7 toll-free · ${kiran.display}`}
            bg="var(--navy)"
            fg="var(--on-dark)"
            delay={280}
          />
        )}
      </section>

      {icall?.whatsapp && (
        <section
          style={{ padding: '20px 20px 0', animation: 'fadeUp .6s .3s both' }}
        >
          <a
            href={whatsappHref(icall.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 18,
              background: '#25D366',
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <IconWhats size={16} sw={1.9} /> Or text iCall on WhatsApp
          </a>
        </section>
      )}

      <SosFooter />
    </div>
  )
}

function CrisisCallButton({
  href,
  label,
  sub,
  bg,
  fg,
  delay = 0,
}: {
  href: string
  label: string
  sub: string
  bg: string
  fg: string
  delay?: number
}) {
  return (
    <a
      href={href}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 18,
        borderRadius: 22,
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: 'var(--shadow-card)',
        animation: `slideIn .55s ${delay}ms both`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconPhone size={20} sw={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="ms-display" style={{ fontSize: 22, lineHeight: 1.1 }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>{sub}</div>
      </div>
    </a>
  )
}
