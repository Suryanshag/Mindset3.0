'use client'

import { useWriting } from './writing-context'

function shortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length > 1 && /^Dr\.?$/i.test(parts[0])) return parts[1]
  return parts[0] ?? fullName
}

type WritingRailProps = {
  pendingPrompt: {
    id: string
    title: string
    instructions: string
    dueDate: Date | null
    doctor: { user: { name: string } }
  } | null
}

export default function WritingRail({ pendingPrompt }: WritingRailProps) {
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

// ─ Assignment prompt ───────────────────────────

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
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-[14px] font-medium text-text">{prompt.title}</p>
        {prompt.instructions && (
          <p className="text-[14px] font-serif italic text-text-muted mt-1.5 leading-relaxed">
            {prompt.instructions}
          </p>
        )}
        <p className="text-[12px] text-text-faint mt-2">
          {dueDateStr && `Due ${dueDateStr} · `}From{' '}
          {shortName(prompt.doctor.user.name)}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-[13px] text-primary mt-2 hover:underline transition-colors duration-150 bg-transparent border-0 p-0 cursor-pointer"
      >
        Write something else instead {'→'}
      </button>
    </div>
  )
}

// ─ Privacy copy ───────────────────────────────

function PrivacyCopy() {
  return (
    <p className="text-[12px] text-text-faint italic leading-relaxed">
      This is your private space. Only you can read what you write here.
    </p>
  )
}

// ─ Autosave indicator ────────────────────────

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
        <span className="text-text-faint">{'○'} Saving{'…'}</span>
      )}
      {saveStatus === 'saved' && (
        <span className="text-text-faint">{'✓'} Saved</span>
      )}
      {saveStatus === 'error' && (
        <span style={{ color: 'var(--color-accent)' }}>
          Couldn{'’'}t save {'—'} check your connection
        </span>
      )}
      {wordCount > 0 && (
        <span className="text-text-faint">
          {saveStatus !== 'idle' && '· '}
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      )}
    </div>
  )
}

// ─ Publish button ────────────────────────────

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
        {isPublishing ? 'Publishing…' : 'Publish entry'}
      </button>
      {disabled && !isPublishing && (
        <p className="text-[11px] text-text-faint text-center mt-2">
          Write something to publish
        </p>
      )}
    </div>
  )
}
