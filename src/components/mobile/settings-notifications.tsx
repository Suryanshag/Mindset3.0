'use client'

// Phase 6 — Mobile Notifications screen. Visual port of flows.jsx
// SettingsNotifications (lines 309-333) with a "coming soon" banner —
// no backend wiring per the Phase 6 brief. Toggles are stateful so the
// screen feels real, but the values do not persist across mounts.

import { useState } from 'react'
import { Card } from './ui'
import SettingsShell from './settings-shell'

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

export default function MobileSettingsNotifications() {
  const [vals, setVals] = useState<Record<ToggleKey, boolean>>(DEFAULTS)
  const set = (k: ToggleKey, v: boolean) =>
    setVals((s) => ({ ...s, [k]: v }))

  return (
    <SettingsShell title="Notifications">
      {/* Coming-soon notice — values are visual only */}
      <Card
        padding={14}
        bg="var(--primary-tint)"
        radius={16}
        style={{ marginBottom: 16 }}
      >
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text)',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          Notification preferences are coming soon. For now, you can preview the
          settings — your selections won&apos;t be saved.
        </div>
      </Card>

      <SectionHead title="What to send" kicker="Choose what reaches you" />
      <Card padding={0}>
        <ToggleRow
          label="Session reminders"
          sub="24h and 10 min before"
          on={vals.session}
          onChange={(v) => set('session', v)}
        />
        <ToggleRow
          label="Journal prompts"
          sub="A short prompt at 8 PM"
          on={vals.journal}
          onChange={(v) => set('journal', v)}
        />
        <ToggleRow
          label="Workshop reminders"
          sub="Day-of and 1 hour before"
          on={vals.workshop}
          onChange={(v) => set('workshop', v)}
        />
        <ToggleRow
          label="Circle reminders"
          sub="Day-of and 1 hour before"
          on={vals.circle}
          onChange={(v) => set('circle', v)}
        />
        <ToggleRow
          label="Mood check-ins"
          sub="A nudge to log how you feel"
          on={vals.mood}
          onChange={(v) => set('mood', v)}
        />
        <ToggleRow
          label="Daily motivation"
          sub="A small good thing once a day"
          on={vals.motivation}
          onChange={(v) => set('motivation', v)}
        />
        <ToggleRow
          label="Mindset news"
          sub="Workshops, content, updates"
          on={vals.marketing}
          onChange={(v) => set('marketing', v)}
          last
        />
      </Card>

      <div style={{ height: 18 }} />
      <SectionHead
        title="Quiet hours"
        kicker="When you&rsquo;re not to be disturbed"
      />
      <Card padding={0}>
        <ToggleRow
          label="Do not disturb"
          sub="10:00 PM → 7:00 AM"
          on={vals.dnd}
          onChange={(v) => set('dnd', v)}
          last
        />
      </Card>
    </SettingsShell>
  )
}

function SectionHead({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div style={{ padding: '14px 4px 8px' }}>
      {kicker && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {kicker}
        </div>
      )}
      <div
        className="ms-display"
        style={{ fontSize: 18, color: 'var(--text)', marginTop: 2 }}
      >
        {title}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  sub,
  on,
  onChange,
  last,
}: {
  label: string
  sub?: string
  on: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: on ? 'var(--primary)' : 'var(--border-strong)',
          position: 'relative',
          transition: 'background .15s',
          flexShrink: 0,
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
            background: 'var(--bg-card)',
            transition: 'left .15s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    </div>
  )
}
