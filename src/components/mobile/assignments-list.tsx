'use client'

// Phase 4 — Mobile Assignments list. Ported from app/assignments.jsx
// Assignments component. Pill tabs (Pending / Completed) with counts.

import { useState } from 'react'
import Link from 'next/link'
import { Card, Avatar } from './ui'
import { IconArrowLeft, IconArrowRight, IconCheck } from './icons'

export type AssignmentListItem = {
  id: string
  type: 'JOURNAL_PROMPT' | 'READING' | 'WORKSHEET' | 'BREATHING' | 'CUSTOM'
  title: string
  description: string | null
  instructions: string
  status: 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'SKIPPED' | 'REVIEWED'
  dueDate: string | null // ISO
  therapistName: string
}

// Type → palette mapping. Mirrors the design's ASSIGNMENT_TYPES table.
export const ASSIGNMENT_TYPE_CFG: Record<
  AssignmentListItem['type'],
  { label: string; bg: string; fg: string; dot: string }
> = {
  JOURNAL_PROMPT: {
    label: 'Journal prompt',
    bg: 'var(--accent-tint)',
    fg: 'var(--accent-deep)',
    dot: 'var(--accent)',
  },
  WORKSHEET: {
    label: 'Worksheet',
    bg: 'var(--primary-tint)',
    fg: 'var(--primary)',
    dot: 'var(--primary)',
  },
  READING: {
    label: 'Reading',
    bg: 'var(--soft-blue)',
    fg: 'var(--navy)',
    dot: 'var(--navy)',
  },
  BREATHING: {
    label: 'Breathing exercise',
    bg: 'var(--soft-blue)',
    fg: 'var(--navy)',
    dot: 'var(--navy)',
  },
  CUSTOM: {
    label: 'Custom',
    bg: 'var(--purple-tint)',
    fg: '#6B3F8A',
    dot: '#8C5A8A',
  },
}

type MobileAssignmentsListProps = {
  pending: AssignmentListItem[]
  completed: AssignmentListItem[]
}

export default function MobileAssignmentsList({
  pending,
  completed,
}: MobileAssignmentsListProps) {
  const [tab, setTab] = useState<'PENDING' | 'COMPLETED'>('PENDING')
  const items = tab === 'PENDING' ? pending : completed
  const counts = { PENDING: pending.length, COMPLETED: completed.length }

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/user/practice"
          aria-label="Back to Practice"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
        <div>
          <div
            className="ms-display"
            style={{ fontSize: 24, color: 'var(--text)' }}
          >
            Assignments
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            From your therapist
          </div>
        </div>
      </header>

      {/* Pill tabs */}
      <div style={{ padding: '6px 20px 0' }}>
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card)',
            borderRadius: 999,
            padding: 4,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {(
            [
              ['PENDING', 'Pending'],
              ['COMPLETED', 'Completed'],
            ] as const
          ).map(([k, l]) => {
            const active = tab === k
            const count = counts[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? 'var(--on-dark)' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {l}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: active
                        ? 'rgba(255,248,235,0.20)'
                        : 'var(--primary-tint)',
                      color: active
                        ? 'var(--on-dark)'
                        : 'var(--primary)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <section style={{ padding: '18px 20px 0' }}>
        {items.length === 0 ? (
          <EmptyAssignments tab={tab} />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((a, i) => (
              <AssignmentCard key={a.id} a={a} delay={i * 70} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AssignmentCard({
  a,
  delay,
}: {
  a: AssignmentListItem
  delay: number
}) {
  const cfg = ASSIGNMENT_TYPE_CFG[a.type]
  const isCompleted = a.status !== 'PENDING'
  const dueLabel = isCompleted
    ? a.status === 'SKIPPED'
      ? 'Skipped'
      : `Done · ${new Date(a.dueDate ?? Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    : a.dueDate
    ? `Due ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    : 'No due date'
  const bodyPreview = a.description ?? a.instructions ?? ''

  return (
    <Link
      href={`/user/practice/assignments/${a.id}`}
      style={{ display: 'block' }}
    >
      <Card
        padding={16}
        radius={22}
        style={{
          animation: `slideIn .5s ${delay}ms both`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: cfg.bg,
              color: cfg.fg,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: cfg.dot,
              }}
            />{' '}
            {cfg.label}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontWeight: 700,
              color: isCompleted ? '#2A7A4A' : 'var(--text-muted)',
            }}
          >
            {dueLabel}
          </span>
        </div>
        <div
          className="ms-display"
          style={{
            fontSize: 19,
            color: 'var(--text)',
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          {a.title}
        </div>
        {bodyPreview && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {bodyPreview}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <Avatar
            name={a.therapistName}
            size={26}
            color="var(--accent)"
          />
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {a.therapistName}
          </span>
          {isCompleted ? (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 800,
                color: '#2A7A4A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconCheck size={12} sw={2.6} /> Done
            </span>
          ) : (
            <IconArrowRight
              size={16}
              sw={2}
              style={{ marginLeft: 'auto', color: 'var(--primary)' }}
            />
          )}
        </div>
      </Card>
    </Link>
  )
}

function EmptyAssignments({ tab }: { tab: 'PENDING' | 'COMPLETED' }) {
  return (
    <Card padding={28} style={{ textAlign: 'center' }}>
      <p
        className="ms-serif"
        style={{
          fontSize: 16,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {tab === 'PENDING'
          ? 'All caught up. Your therapist will add new exercises here.'
          : 'Nothing completed yet. Your finished assignments will appear here.'}
      </p>
    </Card>
  )
}
