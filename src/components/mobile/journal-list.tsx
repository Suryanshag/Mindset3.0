'use client'

// Phase 4 — Mobile Journal list. Ported from app/journal.jsx Journal.
// Calendar strip + today's prompt + filter chips + entry list.
//
// Filter chips render visually but DO NOT filter — JournalEntry has no
// `tags` column. The active chip just highlights "All" by default;
// tapping other chips updates local state but the entry list never
// narrows. Flagged in PORT_LOG Phase 5 entry-checklist.

import { useState } from 'react'
import Link from 'next/link'
import { Card, Chip, MoodFace, MOOD_INFO } from './ui'
import {
  IconArrowRight,
  IconPen,
  IconSpark,
} from './icons'

type JournalListEntry = {
  id: string
  title: string | null
  body: string
  mood: 1 | 2 | 3 | 4 | 5 | null
  entryDate: string // ISO
}

type WeekDay = {
  date: string // ISO
  mood: 1 | 2 | 3 | 4 | 5 | null
}

type PromptCard = {
  text: string
  // When sourced from a real JOURNAL_PROMPT assignment, navigate to its
  // detail page so the user completes it (which also creates the journal
  // entry per the existing completeAssignment server action). When the
  // prompt is static rotation, navigate to /user/practice/journal/new.
  href: string
}

type MobileJournalListProps = {
  entries: JournalListEntry[]
  weekDays: WeekDay[]
  streak: number
  prompt: PromptCard | null
}

const FILTER_CHIPS = ['All', 'Gratitude', 'Relationships', 'Health', 'Work', 'Sleep']

function singleLetterWeekday(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)
}

function formatEntryDateRow(d: Date): { date: string; time: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)
  const dKey = new Date(d).toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  const yKey = yesterday.toISOString().slice(0, 10)
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  if (dKey === todayKey) return { date: 'Today', time }
  if (dKey === yKey) return { date: 'Yesterday', time }
  return {
    date: d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
    }),
    time,
  }
}

export default function MobileJournalList({
  entries,
  weekDays,
  streak,
  prompt,
}: MobileJournalListProps) {
  const [filter, setFilter] = useState('All')
  const totalEntries = entries.length
  const todayKey = new Date().toISOString().slice(0, 10)

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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              className="ms-display"
              style={{ fontSize: 32, color: 'var(--text)' }}
            >
              Journal
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                marginTop: 2,
              }}
            >
              {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
              {streak > 0 && ` · streak ${streak} ${streak === 1 ? 'day' : 'days'}`}
            </div>
          </div>
          <Link
            href="/user/practice/journal/new"
            aria-label="New entry"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            <IconPen size={20} sw={1.9} />
          </Link>
        </div>
      </header>

      {/* Calendar strip */}
      <div style={{ padding: '8px 20px 0' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            margin: '0 -20px',
            padding: '0 20px 4px',
          }}
          className="screen-scroll"
        >
          {weekDays.map((d, i) => {
            const dt = new Date(d.date)
            const isToday = dt.toISOString().slice(0, 10) === todayKey
            const dayN = dt.toLocaleDateString('en-IN', { day: 'numeric' })
            const moodInfo = d.mood ? MOOD_INFO[d.mood] : null
            return (
              <div
                key={i}
                style={{
                  minWidth: 46,
                  padding: '8px 4px',
                  background: isToday
                    ? 'var(--primary)'
                    : 'var(--bg-card)',
                  color: isToday ? 'var(--on-dark)' : 'var(--text)',
                  borderRadius: 14,
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    opacity: 0.7,
                  }}
                >
                  {singleLetterWeekday(dt)}
                </div>
                <div
                  className="ms-display"
                  style={{ fontSize: 18, marginTop: 2 }}
                >
                  {dayN}
                </div>
                <div
                  style={{
                    height: 8,
                    marginTop: 4,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {d.mood ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isToday
                          ? 'var(--on-dark)'
                          : moodInfo?.color ?? 'var(--text-muted)',
                      }}
                    />
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's prompt */}
      {prompt && (
        <section style={{ padding: '16px 20px 0' }}>
          <Card padding={18} bg="var(--accent-tint)" radius={22}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-deep)',
              }}
            >
              <IconSpark size={14} sw={1.8} /> Today’s prompt
            </div>
            <p
              className="ms-serif"
              style={{
                fontSize: 18,
                lineHeight: 1.4,
                color: 'var(--text)',
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {prompt.text}
            </p>
            <Link
              href={prompt.href}
              style={{
                marginTop: 12,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent-deep)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Write 5 minutes <IconArrowRight size={14} sw={2} />
            </Link>
          </Card>
        </section>
      )}

      {/* Filter chips — visual only (no tag column on JournalEntry).
          See PORT_LOG Phase 5 entry-checklist for the schema-add. */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '20px -20px 4px',
          padding: '0 20px 4px',
        }}
        className="screen-scroll"
      >
        {FILTER_CHIPS.map((f) => (
          <Chip
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Chip>
        ))}
      </div>

      {/* Entries */}
      <section style={{ padding: '12px 20px 0' }}>
        {entries.length === 0 ? (
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
              Your first entry is one tap away.
            </p>
            <Link
              href="/user/practice/journal/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 18,
                background: 'var(--primary)',
                color: 'var(--on-dark)',
                padding: '12px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Start writing <IconArrowRight size={14} sw={2.2} />
            </Link>
          </Card>
        ) : (
          entries.map((e) => <EntryRow key={e.id} entry={e} />)
        )}
      </section>
    </div>
  )
}

function EntryRow({ entry }: { entry: JournalListEntry }) {
  const dt = new Date(entry.entryDate)
  const meta = formatEntryDateRow(dt)
  const moodInfo = entry.mood ? MOOD_INFO[entry.mood] : null
  return (
    <Link
      href={`/user/practice/journal/${entry.id}`}
      style={{ display: 'block', marginBottom: 12 }}
    >
      <Card padding={16} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          {entry.mood && moodInfo ? (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: moodInfo.tint,
                color: moodInfo.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MoodFace mood={entry.mood} size={22} />
            </div>
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--bg-app)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {dt.getDate()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {entry.title || 'Untitled'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                {meta.date} · {meta.time}
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.45,
                marginTop: 6,
                marginBottom: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {entry.body}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
