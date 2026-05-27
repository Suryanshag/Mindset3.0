'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { ASSIGNMENT_TYPE_CFG } from './assignment-row'

type AssignmentType = 'CUSTOM' | 'JOURNAL_PROMPT' | 'READING' | 'WORKSHEET' | 'BREATHING'

const TYPE_OPTIONS: { key: AssignmentType; label: string }[] = [
  { key: 'CUSTOM',         label: 'Custom' },
  { key: 'JOURNAL_PROMPT', label: 'Journal' },
  { key: 'READING',        label: 'Reading' },
  { key: 'WORKSHEET',      label: 'Worksheet' },
  { key: 'BREATHING',      label: 'Breathing' },
]

interface PatientLite {
  id: string
  name: string
}

interface CreatedAssignment {
  id: string
  title: string
  status: string
  type?: string | null
  dueDate: string | null
  user?: { name: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
  patientPreset?: PatientLite | null
  onCreated?: (a: CreatedAssignment) => void
}

export default function CreateAssignmentSheet({ open, onClose, patientPreset, onCreated }: Props) {
  const [patients, setPatients] = useState<PatientLite[]>([])
  const [patientId, setPatientId] = useState(patientPreset?.id ?? '')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<AssignmentType>('CUSTOM')
  const [instructions, setInstructions] = useState('')
  const [due, setDue] = useState('') // free-text date input (yyyy-mm-dd)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load patients only when sheet opens AND no preset (preset means we
  // already know the patient — no list needed).
  useEffect(() => {
    if (!open || patientPreset) return
    fetch('/api/doctor/patients')
      .then((r) => r.json())
      .then((res) => { if (res.success) setPatients(res.data) })
      .catch(() => {})
  }, [open, patientPreset])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const valid = patientId && title.trim().length >= 2

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        userId: patientId,
        title: title.trim(),
        type,
      }
      if (instructions.trim()) body.instructions = instructions.trim()
      if (due.trim()) {
        // Accept yyyy-mm-dd from a <input type=date>; convert to ISO at noon UTC
        // so dayjs/Date roundtrips don't drop the day in IST.
        const parsed = new Date(`${due.trim()}T12:00:00Z`)
        if (!isNaN(parsed.getTime())) body.dueDate = parsed.toISOString()
      }
      const res = await fetch('/api/doctor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create')
        return
      }
      onCreated?.(data.data)
      // Reset for next open
      setTitle('')
      setInstructions('')
      setDue('')
      setType('CUSTOM')
      if (!patientPreset) setPatientId('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-[60] flex items-end">
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
          maxHeight: '90vh',
          animation: 'sheetUp .3s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div
          className="mx-auto mb-3.5 rounded"
          style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.18)' }}
        />
        <div className="ms-display text-[22px]" style={{ color: 'var(--text)' }}>New assignment</div>

        {/* Patient */}
        <div className="mt-3.5">
          <CALabel>Patient</CALabel>
          {patientPreset ? (
            <div
              className="rounded-[14px] text-[14px] font-bold truncate"
              style={{
                padding: '12px 14px',
                background: 'var(--bg-app)',
                color: 'var(--text)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {patientPreset.name}
            </div>
          ) : (
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full outline-none text-[14px] font-bold"
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--bg-app)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div className="mt-3.5">
          <CALabel>Title</CALabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Thought record · 3 examples"
            className="w-full outline-none text-[14px] font-semibold"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'var(--bg-app)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Type */}
        <div className="mt-3.5">
          <CALabel>Type</CALabel>
          <div className="grid grid-cols-3 gap-1.5">
            {TYPE_OPTIONS.map(({ key, label }) => {
              const active = type === key
              const cfg = ASSIGNMENT_TYPE_CFG[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className="rounded-[12px] text-[11.5px] font-extrabold"
                  style={{
                    padding: '10px 4px',
                    background: active ? cfg.bg : 'var(--bg-app)',
                    color: active ? cfg.fg : 'var(--text-muted)',
                    border: active ? `1.5px solid ${cfg.fg}` : '1px solid var(--border)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3.5">
          <CALabel>Instructions</CALabel>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="What you'd like them to do."
            className="w-full outline-none resize-none ms-serif text-[14px] leading-[1.55]"
            style={{
              minHeight: 90,
              padding: 12,
              borderRadius: 14,
              background: 'var(--bg-app)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Due date */}
        <div className="mt-3.5">
          <CALabel>Due date · optional</CALabel>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full outline-none text-[13px] font-bold"
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--bg-app)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        {error && (
          <p className="text-[12px] mt-2.5" style={{ color: '#A53A1F' }}>{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-full text-[13px] font-extrabold"
            style={{
              padding: 14,
              background: 'transparent',
              color: 'var(--text)',
              border: '1.5px solid var(--border-strong)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || submitting}
            className="flex-[2] inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-extrabold disabled:opacity-60"
            style={{
              padding: 14,
              background: 'var(--accent)',
              color: 'var(--on-dark, var(--cream))',
            }}
          >
            {submitting
              ? <Loader2 size={14} className="animate-spin" />
              : <Check size={14} strokeWidth={2.4} />}
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CALabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-extrabold uppercase mb-1.5"
      style={{ letterSpacing: '0.10em', color: 'var(--text-muted)' }}
    >
      {children}
    </div>
  )
}
