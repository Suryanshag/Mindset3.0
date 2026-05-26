'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, UserX, Video, X } from 'lucide-react'
import { format } from 'date-fns'
import { formatSessionTime } from '@/lib/format-date'
import StatusBadge from './status-badge'

interface DaySheetSession {
  id: string
  date: string
  meetLink: string | null
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  paymentStatus: string
  notes: string | null
  user: { id: string; name: string; email: string }
}

interface Props {
  day: Date
  sessions: DaySheetSession[]
  onClose: () => void
  /** Save notes for a session — resolves true on success. */
  onSaveNotes: (sessionId: string, notes: string) => Promise<boolean>
  /** Mark a session COMPLETED or NO_SHOW. */
  onMarkStatus: (sessionId: string, status: 'COMPLETED' | 'NO_SHOW') => Promise<boolean>
}

function canMarkComplete(s: DaySheetSession): boolean {
  if (s.status !== 'CONFIRMED') return false
  if (s.paymentStatus !== 'PAID') return false
  return Date.now() >= new Date(s.date).getTime() + 45 * 60 * 1000
}
function canMarkNoShow(s: DaySheetSession): boolean {
  if (s.status !== 'CONFIRMED') return false
  return Date.now() >= new Date(s.date).getTime() + 15 * 60 * 1000
}

export default function DaySheet({ day, sessions, onClose, onSaveNotes, onMarkStatus }: Props) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-end">
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(20,30,28,0.45)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative w-full overflow-y-auto"
        style={{
          background: 'var(--bg-card)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '14px 16px max(18px, env(safe-area-inset-bottom))',
          maxHeight: '85vh',
          animation: 'sheetUp .3s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-3.5 rounded"
          style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.18)' }}
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="ms-display text-[22px]" style={{ color: 'var(--text)' }}>
              {format(day, 'EEE, d MMM')}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {sessions.length} session{sessions.length === 1 ? '' : 's'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div
            className="mt-4 text-center rounded-[16px] p-[18px] text-[13px]"
            style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}
          >
            No sessions on this day.
          </div>
        ) : (
          <div className="mt-3.5 grid gap-2.5">
            {sessions.map((s) => (
              <DaySheetRow
                key={s.id}
                s={s}
                onSaveNotes={onSaveNotes}
                onMarkStatus={onMarkStatus}
                canComplete={canMarkComplete(s)}
                canNoShow={canMarkNoShow(s) && !canMarkComplete(s)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DaySheetRow({
  s,
  onSaveNotes,
  onMarkStatus,
  canComplete,
  canNoShow,
}: {
  s: DaySheetSession
  onSaveNotes: (sessionId: string, notes: string) => Promise<boolean>
  onMarkStatus: (sessionId: string, status: 'COMPLETED' | 'NO_SHOW') => Promise<boolean>
  canComplete: boolean
  canNoShow: boolean
}) {
  const [notesDraft, setNotesDraft] = useState(s.notes ?? '')
  const [busy, setBusy] = useState<'complete' | 'noshow' | 'notes' | null>(null)

  async function handleMark(status: 'COMPLETED' | 'NO_SHOW') {
    if (status === 'NO_SHOW') {
      const ok = window.confirm(
        'Mark this session as no-show? The patient will not be refunded, and this cannot be undone.'
      )
      if (!ok) return
    }
    setBusy(status === 'COMPLETED' ? 'complete' : 'noshow')
    await onMarkStatus(s.id, status)
    setBusy(null)
  }

  async function handleNotesBlur() {
    const trimmed = notesDraft.trim()
    if ((s.notes ?? '') === trimmed) return
    setBusy('notes')
    await onSaveNotes(s.id, trimmed)
    setBusy(null)
  }

  return (
    <div className="rounded-[16px] p-3.5" style={{ background: 'var(--bg-app)' }}>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-extrabold truncate" style={{ color: 'var(--text)' }}>
            {s.user.name}
          </div>
          <div className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {formatSessionTime(s.date)} · 60 min
          </div>
        </div>
        <StatusBadge status={s.status} />
      </div>

      <textarea
        value={notesDraft}
        onChange={(e) => setNotesDraft(e.target.value)}
        onBlur={handleNotesBlur}
        placeholder="Notes — autosaved on blur"
        className="w-full mt-2.5 outline-none resize-none"
        style={{
          minHeight: 64,
          padding: 10,
          borderRadius: 12,
          border: '1px solid var(--border-strong)',
          background: 'var(--bg-card)',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text)',
        }}
      />

      <div className="flex flex-wrap gap-2 mt-2.5">
        {s.meetLink && s.status === 'CONFIRMED' && (
          <a
            href={s.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold"
            style={{
              padding: '8px 12px',
              background: 'var(--accent)',
              color: 'var(--on-dark, var(--cream))',
            }}
          >
            <Video size={12} strokeWidth={2.2} /> Open Meet
          </a>
        )}
        {canComplete && (
          <button
            onClick={() => handleMark('COMPLETED')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold disabled:opacity-50"
            style={{ padding: '8px 12px', background: '#2A7A4A', color: 'var(--on-dark, var(--cream))' }}
          >
            {busy === 'complete'
              ? <Loader2 size={12} className="animate-spin" />
              : <CheckCircle size={12} strokeWidth={2.2} />}
            {busy === 'complete' ? 'Marking…' : 'Mark complete'}
          </button>
        )}
        {canNoShow && (
          <button
            onClick={() => handleMark('NO_SHOW')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold disabled:opacity-50"
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1.5px solid var(--border-strong)',
            }}
          >
            {busy === 'noshow'
              ? <Loader2 size={12} className="animate-spin" />
              : <UserX size={12} strokeWidth={2.2} />}
            {busy === 'noshow' ? 'Marking…' : 'No-show'}
          </button>
        )}
        {busy === 'notes' && (
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={11} className="animate-spin" /> Saving notes…
          </span>
        )}
      </div>
    </div>
  )
}
