'use client'

import { useState, useTransition } from 'react'
import { useWriting } from './writing-context'
import { logMoodCheckIn } from '@/lib/actions/mood'
import { MOODS } from '@/lib/constants/mood'
import MoodFace from '@/components/dashboard/mood-face'

function shortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length > 1 && /^Dr\.?$/i.test(parts[0])) return parts[1]
  return parts[0] ?? fullName
}

type WritingRailProps = {
  todaysMood: { mood: 1 | 2 | 3 | 4 | 5 } | null
  pendingPrompt: {
    id: string
    title: string
    instructions: string
    dueDate: Date | null
    doctor: { user: { name: string } }
  } | null
}

export default function WritingRail({
  todaysMood,
  pendingPrompt,
}: WritingRailProps) {
  const {
    saveStatus,
    wordCount,
    body,
    draftId,
    assignmentId,
    setAssignmentId,
    publish,
    isPublishing,
  } = useWriting()

  return (
    <div className="space-y-6">
      <MoodSection todaysMood={todaysMood} />

      {pendingPrompt && assignmentId === pendingPrompt.id && (
        <PromptSection
          prompt={pendingPrompt}
          onDismiss={() => setAssignmentId(null)}
        />
      )}

      <PrivacyCopy />

      <AutosaveIndicator saveStatus={saveStatus} wordCount={wordCount} />

      <PublishButton
        disabled={!body.trim() || saveStatus !== 'saved' || !draftId}
        isPublishing={isPublishing}
        onPublish={publish}
      />
    </div>
  )
}

// ── Mood ──────────────────────────────────────────────────────────

function MoodSection({
  todaysMood,
}: {
  todaysMood: { mood: 1 | 2 | 3 | 4 | 5 } | null
}) {
  const [selected, setSelected] = useState<number | null>(
    todaysMood?.mood ?? null
  )
  const [isPending, startTransition] = useTransition()

  function handleSelect(value: number) {
    setSelected(value)
    startTransition(async () => {
      await logMoodCheckIn(value)
    })
  }

  return (
    <div>
      <p className="text-[13px] text-text-muted mb-3">How are you feeling?</p>
      <div className="flex gap-2">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => handleSelect(mood.value)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: mood.tint,
                  color: mood.stroke,
                  border: isSelected
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                }}
              >
                <MoodFace mood={mood.value} size={16} />
              </div>
              <span className="text-[9px] text-text-faint">{mood.label}</span>
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <p className="text-[11px] text-text-faint mt-2">
          {isPending ? 'Saving\u2026' : 'Logged today'} \u00B7{' '}
          {MOODS.find((m) => m.value === selected)?.label}
        </p>
      )}
    </div>
  )
}

// ── Assignment prompt ─────────────────────────────────────────────

function PromptSection({
  prompt,
  onDismiss,
}: {
  prompt: NonNullable<WritingRailProps['pendingPrompt']>
  onDismiss: () => void
}) {
  const dueDateStr = prompt.dueDate
    ? prompt.dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div>
      <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
        Prompt
      </p>
      <div
        className="rounded-xl p-4 bg-bg-card"
        style={{ border: '0.5px solid var(--color-border)' }}
      >
        <p className="text-[14px] font-medium text-text">{prompt.title}</p>
        {prompt.instructions && (
          <p className="text-[14px] font-serif italic text-text-muted mt-1.5 leading-relaxed">
            {prompt.instructions}
          </p>
        )}
        <p className="text-[12px] text-text-faint mt-2">
          {dueDateStr && `Due ${dueDateStr} \u00B7 `}From{' '}
          {shortName(prompt.doctor.user.name)}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-[13px] text-primary mt-2 hover:underline transition-colors duration-150 bg-transparent border-0 p-0 cursor-pointer"
      >
        Write something else instead {'\u2192'}
      </button>
    </div>
  )
}

// ── Privacy copy ──────────────────────────────────────────────────

function PrivacyCopy() {
  return (
    <p className="text-[12px] text-text-faint italic leading-relaxed">
      This is your private space. Only you can read what you write here.
    </p>
  )
}

// ── Autosave indicator ────────────────────────────────────────────

function AutosaveIndicator({
  saveStatus,
  wordCount,
}: {
  saveStatus: string
  wordCount: number
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {saveStatus === 'saving' && (
        <span className="text-text-faint">{'\u25CB'} Saving{'\u2026'}</span>
      )}
      {saveStatus === 'saved' && (
        <span className="text-text-faint">{'\u2713'} Saved</span>
      )}
      {saveStatus === 'error' && (
        <span style={{ color: 'var(--color-accent)' }}>
          Couldn{'\u2019'}t save {'\u2014'} check your connection
        </span>
      )}
      {wordCount > 0 && (
        <span className="text-text-faint">
          {saveStatus !== 'idle' && '\u00B7 '}
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      )}
    </div>
  )
}

// ── Publish button ────────────────────────────────────────────────

function PublishButton({
  disabled,
  isPublishing,
  onPublish,
}: {
  disabled: boolean
  isPublishing: boolean
  onPublish: () => Promise<void>
}) {
  return (
    <div>
      <button
        onClick={onPublish}
        disabled={disabled || isPublishing}
        className="w-full py-3 rounded-full bg-primary text-white text-[14px] font-medium disabled:opacity-40 transition-all duration-200"
      >
        {isPublishing ? 'Publishing\u2026' : 'Publish entry'}
      </button>
      {disabled && !isPublishing && (
        <p className="text-[11px] text-text-faint text-center mt-2">
          Write something to publish
        </p>
      )}
    </div>
  )
}
