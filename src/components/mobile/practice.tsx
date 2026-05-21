// Phase 4 — Mobile Practice hub. Ported from app/practice.jsx.
// Three tiles (Journal / Assignments / Mindfulness disabled), stat pill,
// quote card. Mobile design intentionally omits the desktop's "Recent
// entries" + "Pending assignments" preview sections — Practice on
// mobile is purely a navigation hub; previews live on Home.

import Link from 'next/link'
import { Card, Blob } from './ui'
import {
  IconChevR,
  IconClipboard,
  IconDot,
  IconLeaf,
  IconPen,
} from './icons'
import type { ReactNode } from 'react'

type MobilePracticeProps = {
  lastEntryDays: number | null
  pendingAssignments: number
}

export default function MobilePractice({
  lastEntryDays,
  pendingAssignments,
}: MobilePracticeProps) {
  const statLine = [
    lastEntryDays != null
      ? `${lastEntryDays}d since last entry`
      : null,
    pendingAssignments > 0
      ? `${pendingAssignments} pending ${pendingAssignments === 1 ? 'assignment' : 'assignments'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const journalSub =
    lastEntryDays === 0
      ? 'Entry saved today'
      : lastEntryDays != null
      ? `Last written ${lastEntryDays}d ago`
      : 'Start writing'

  return (
    <div
      data-mobile-fullbleed
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <header style={{ padding: '18px 20px 8px' }}>
        <div
          className="ms-display"
          style={{ fontSize: 32, color: 'var(--text)' }}
        >
          Practice
        </div>
        <div
          className="ms-serif"
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          Your space between sessions.
        </div>
        {statLine && (
          <div
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              background: 'var(--primary-tint)',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primary)',
            }}
          >
            <IconDot size={8} sw={0} />
            {statLine}
          </div>
        )}
      </header>

      <section
        style={{
          padding: '20px 20px 0',
          display: 'grid',
          gap: 14,
        }}
      >
        <PracticeTile
          icon={<IconPen size={22} sw={1.7} />}
          title="Journal"
          sub={journalSub}
          bg="var(--accent-tint)"
          fg="var(--accent-deep)"
          decor="rgba(201,120,100,0.20)"
          href="/user/practice/journal"
        />
        <PracticeTile
          icon={<IconClipboard size={22} sw={1.7} />}
          title="Assignments"
          sub={
            pendingAssignments === 0
              ? 'All caught up'
              : `${pendingAssignments} pending`
          }
          bg="var(--primary-tint)"
          fg="var(--primary)"
          decor="rgba(45,90,79,0.18)"
          badge={pendingAssignments > 0 ? pendingAssignments : null}
          href="/user/practice/assignments"
        />
        <PracticeTile
          icon={<IconLeaf size={22} sw={1.7} />}
          title="Mindfulness"
          sub="Coming soon"
          bg="var(--bg-cream)"
          fg="var(--text-muted)"
          decor="rgba(0,0,0,0.04)"
          disabled
        />
      </section>

      <section style={{ padding: '32px 20px 0' }}>
        <Card padding={18} bg="var(--bg-cream)" radius={22}>
          <div
            className="ms-serif"
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--text)',
            }}
          >
            “The work between sessions is where most of the change happens.
            Small, repeated, kind.”
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 8,
            }}
          >
            — Dr Priya Sharma
          </div>
        </Card>
      </section>
    </div>
  )
}

type TileProps = {
  icon: ReactNode
  title: string
  sub: string
  bg: string
  fg: string
  decor: string
  badge?: number | null
  href?: string
  disabled?: boolean
}

function PracticeTile({
  icon,
  title,
  sub,
  bg,
  fg,
  decor,
  badge,
  href,
  disabled,
}: TileProps) {
  const body = (
    <>
      <Blob
        fill={decor}
        style={{
          position: 'absolute',
          right: -30,
          top: -38,
          width: 140,
          height: 140,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="ms-display"
            style={{ fontSize: 22, lineHeight: 1.05 }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.8 }}>
            {sub}
          </div>
        </div>
        {badge != null && (
          <div
            style={{
              minWidth: 26,
              height: 26,
              padding: '0 8px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--on-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {badge}
          </div>
        )}
        {!disabled && (
          <IconChevR
            size={18}
            sw={1.8}
            style={{ opacity: 0.5 }}
          />
        )}
      </div>
    </>
  )

  const tileStyle = {
    width: '100%',
    textAlign: 'left' as const,
    background: bg,
    color: fg,
    borderRadius: 24,
    padding: '20px 22px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: disabled ? 'none' : 'var(--shadow-card)',
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? ('default' as const) : ('pointer' as const),
    animation: 'fadeUp .5s both',
    display: 'block' as const,
  }

  if (disabled || !href) {
    return (
      <button type="button" disabled={disabled} style={tileStyle}>
        {body}
      </button>
    )
  }

  return (
    <Link href={href} style={tileStyle}>
      {body}
    </Link>
  )
}
