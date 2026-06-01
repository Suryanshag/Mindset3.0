'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3d — Journal index (Direction B port).
// Filter state is local — preserves the existing route's URL params
// (?q, ?mood, ?from, ?to) untouched for back-compat; B's chips act as
// a viewport-side filter over the already-fetched entries.

export type JournalEntryItem = {
  id: string
  title: string | null
  body: string
  mood: 1 | 2 | 3 | 4 | 5 | null
  /** ISO string — the client parses to Date. */
  entryDate: string
}

type Filter = 'all' | 'with-title' | 'no-title' | 'with-mood' | 'no-mood'

type Props = {
  entries: JournalEntryItem[]
  totalCount: number
  /** Date of the earliest entry, used in the sub-line. */
  sinceDate: Date | null
}

const FILTERS: { key: Filter; label: string; predicate: (e: JournalEntryItem) => boolean }[] = [
  { key: 'all', label: 'All', predicate: () => true },
  { key: 'with-title', label: 'With a title', predicate: (e) => !!e.title?.trim() },
  { key: 'no-title', label: 'Quick notes', predicate: (e) => !e.title?.trim() },
  { key: 'with-mood', label: 'With a mood', predicate: (e) => e.mood !== null },
  { key: 'no-mood', label: 'No mood', predicate: (e) => e.mood === null },
]

export default function BJournalList({ entries, totalCount, sinceDate }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    for (const f of FILTERS) {
      map.set(f.key, entries.filter(f.predicate).length)
    }
    return map
  }, [entries])

  const filtered = useMemo(() => {
    const pred = FILTERS.find((f) => f.key === filter)?.predicate ?? (() => true)
    return entries.filter(pred)
  }, [entries, filter])

  const sub = sinceDate
    ? `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'} · since ${sinceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`
    : `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`

  return (
    <>
      <BPageHeader
        title="Your journal."
        breadcrumb={[
          { label: 'PRACTICE', href: '/user/practice' },
          { label: 'JOURNAL' },
        ]}
        back="/user/practice"
        sub={sub}
        ctas={['search', 'write']}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key
          const count = counts.get(f.key) ?? 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? '#fff' : 'var(--text-muted)',
                border: on ? 'none' : '1px solid var(--border)',
              }}
            >
              {f.label}{' '}
              <span
                style={{
                  opacity: 0.65,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              >
                · {count}
              </span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>
          SORT · NEWEST FIRST
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <BCard style={{ textAlign: 'center', padding: '40px 24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 13.5,
              color: 'var(--text-muted)',
            }}
          >
            {filter === 'all'
              ? "Nothing in your journal yet. Start when you're ready."
              : 'Nothing in this filter.'}
          </p>
        </BCard>
      ) : (
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          {filtered.map((e, i) => (
            <Row key={e.id} entry={e} first={i === 0} />
          ))}
        </BCard>
      )}
    </>
  )
}

function Row({ entry, first }: { entry: JournalEntryItem; first: boolean }) {
  const date = new Date(entry.entryDate)
  const dateLabel = date
    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()
  const timeLabel = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const wordCount = entry.body.trim().split(/\s+/).filter(Boolean).length
  const moodLabel = entry.mood ? `MOOD ${entry.mood}/5` : null

  return (
    <Link
      href={`/user/practice/journal/${entry.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 110px 24px',
        gap: 18,
        padding: '13px 20px',
        alignItems: 'flex-start',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            letterSpacing: '0.06em',
          }}
        >
          {dateLabel} · {timeLabel}
        </div>
        {moodLabel && (
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 3,
            }}
          >
            {moodLabel}
          </div>
        )}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            color: 'var(--text-faint)',
            marginTop: 3,
          }}
        >
          {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}
        </div>
      </div>
      <div>
        {entry.title ? (
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            {entry.title}
          </div>
        ) : (
          <BCap>Quick note</BCap>
        )}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13.5,
            color: 'var(--text-muted)',
            marginTop: 4,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          &ldquo;{entry.body}&rdquo;
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <BChip kind={entry.title ? 'primary' : 'neutral'}>
          {entry.title ? 'TITLED' : 'NOTE'}
        </BChip>
      </div>
      <span style={{ color: 'var(--text-muted)', paddingTop: 2 }}>›</span>
    </Link>
  )
}
