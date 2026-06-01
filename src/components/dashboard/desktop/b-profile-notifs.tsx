'use client'

import { useState } from 'react'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3j — Notification preferences (Direction B port).
// Same caveat as mobile/desktop predecessors: visual preview only, not
// persisted until the schema gets a NotificationPreferences row.

type ToggleKey =
  | 'session'
  | 'journal'
  | 'workshop'
  | 'circle'
  | 'mood'
  | 'motivation'
  | 'marketing'
  | 'dnd'

const DEFAULTS: Record<ToggleKey, boolean> = {
  session: true,
  journal: true,
  workshop: true,
  circle: true,
  mood: true,
  motivation: false,
  marketing: false,
  dnd: true,
}

export default function BProfileNotifs() {
  const [vals, setVals] = useState<Record<ToggleKey, boolean>>(DEFAULTS)
  const set = (k: ToggleKey, v: boolean) =>
    setVals((s) => ({ ...s, [k]: v }))

  return (
    <>
      <BPageHeader
        title="Notifications."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'NOTIFICATIONS' },
        ]}
        back="/user/profile"
        sub="What we send and when. Preview only — saving isn&rsquo;t wired yet."
        ctas={['search']}
      />

      <BCard accent="var(--primary)" padding={18}>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13.5,
            color: 'var(--text)',
            lineHeight: 1.55,
          }}
        >
          Preferences are coming soon. For now you can preview the settings —
          your selections won&rsquo;t be saved.
        </p>
      </BCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <div>
          <BCap>What to send</BCap>
          <BCard padding={0} style={{ marginTop: 10, overflow: 'hidden' }}>
            <ToggleRow label="Session reminders" sub="24h and 10 min before" on={vals.session} onChange={(v) => set('session', v)} first />
            <ToggleRow label="Journal prompts" sub="A short prompt at 8 PM" on={vals.journal} onChange={(v) => set('journal', v)} />
            <ToggleRow label="Workshop reminders" sub="Day-of and 1 hour before" on={vals.workshop} onChange={(v) => set('workshop', v)} />
            <ToggleRow label="Circle reminders" sub="Day-of and 1 hour before" on={vals.circle} onChange={(v) => set('circle', v)} />
            <ToggleRow label="Mood check-ins" sub="A nudge to log how you feel" on={vals.mood} onChange={(v) => set('mood', v)} />
            <ToggleRow label="Daily motivation" sub="A small good thing once a day" on={vals.motivation} onChange={(v) => set('motivation', v)} />
            <ToggleRow label="Mindset news" sub="Workshops, content, updates" on={vals.marketing} onChange={(v) => set('marketing', v)} />
          </BCard>
        </div>

        <div>
          <BCap>Quiet hours</BCap>
          <BCard padding={0} style={{ marginTop: 10, overflow: 'hidden' }}>
            <ToggleRow
              label="Do not disturb"
              sub="10:00 PM → 7:00 AM"
              on={vals.dnd}
              onChange={(v) => set('dnd', v)}
              first
            />
          </BCard>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 12.5,
              color: 'var(--text-faint)',
              marginTop: 14,
              lineHeight: 1.55,
            }}
          >
            Session reminders ignore quiet hours so you don&rsquo;t miss them.
          </p>
        </div>
      </div>
    </>
  )
}

function ToggleRow({
  label,
  sub,
  on,
  onChange,
  first,
}: {
  label: string
  sub?: string
  on: boolean
  onChange: (v: boolean) => void
  first?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          {label}
        </p>
        {sub && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            {sub}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 44,
          height: 26,
          borderRadius: 999,
          background: on ? 'var(--primary)' : 'var(--border-strong)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </div>
  )
}
