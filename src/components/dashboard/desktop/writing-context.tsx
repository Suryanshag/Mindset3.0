'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { saveDraft, publishDraft, discardDraft } from '@/lib/actions/journal'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type WritingContextValue = {
  draftId: string | null
  title: string
  setTitle: (t: string) => void
  body: string
  setBody: (b: string) => void
  assignmentId: string | null
  setAssignmentId: (id: string | null) => void
  saveStatus: SaveStatus
  wordCount: number
  publish: () => Promise<void>
  isPublishing: boolean
  discard: () => Promise<void>
}

const WritingContext = createContext<WritingContextValue | null>(null)

export function useWriting() {
  const ctx = useContext(WritingContext)
  if (!ctx) throw new Error('useWriting must be used within WritingProvider')
  return ctx
}

type ProviderProps = {
  initialDraft: {
    id: string
    title: string | null
    body: string
    assignmentId: string | null
  } | null
  initialAssignmentId: string | null
  children: ReactNode
}

export function WritingProvider({
  initialDraft,
  initialAssignmentId,
  children,
}: ProviderProps) {
  const router = useRouter()
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null)
  const [title, setTitle] = useState(initialDraft?.title ?? '')
  const [body, setBody] = useState(initialDraft?.body ?? '')
  const [assignmentId, setAssignmentId] = useState<string | null>(
    initialDraft?.assignmentId ?? initialAssignmentId
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    initialDraft ? 'saved' : 'idle'
  )
  const [isPublishing, setIsPublishing] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const retryRef = useRef(0)
  const genRef = useRef(0)

  const wordCount = body.trim()
    ? body.trim().split(/\s+/).filter(Boolean).length
    : 0

  // Debounced autosave
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Don't save empty drafts (requirement 9)
    if (!body.trim()) {
      // If we had a draft and user cleared everything, discard it
      if (draftId && saveStatus === 'saved') {
        timerRef.current = setTimeout(async () => {
          await discardDraft(draftId)
          setDraftId(null)
          setSaveStatus('idle')
        }, 800)
      }
      return
    }

    timerRef.current = setTimeout(async () => {
      const gen = ++genRef.current
      setSaveStatus('saving')
      try {
        const result = await saveDraft({
          title: title || undefined,
          body,
          assignmentId,
        })
        // Ignore stale responses
        if (gen !== genRef.current) return
        if ('error' in result) {
          throw new Error(result.error)
        }
        setDraftId(result.id)
        setSaveStatus('saved')
        retryRef.current = 0
      } catch {
        if (gen !== genRef.current) return
        if (retryRef.current < 3) {
          retryRef.current++
          const delay = 800 * Math.pow(2, retryRef.current)
          setSaveStatus('saving')
          timerRef.current = setTimeout(() => {
            // Re-trigger by bumping a dependency — simplest approach
            genRef.current++ // force next effect cycle
            setSaveStatus('error')
          }, delay)
        } else {
          setSaveStatus('error')
        }
      }
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [title, body, assignmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const publish = useCallback(async () => {
    if (!draftId || !body.trim()) return
    setIsPublishing(true)
    try {
      const result = await publishDraft(draftId, {
        assignmentId: assignmentId ?? undefined,
      })
      if ('error' in result) {
        setIsPublishing(false)
        return
      }
      router.push(`/user/practice/journal/${result.id}`)
    } catch {
      setIsPublishing(false)
    }
  }, [draftId, body, assignmentId, router])

  const discardFn = useCallback(async () => {
    if (!draftId) return
    await discardDraft(draftId)
    setDraftId(null)
    setTitle('')
    setBody('')
    setSaveStatus('idle')
  }, [draftId])

  return (
    <WritingContext.Provider
      value={{
        draftId,
        title,
        setTitle,
        body,
        setBody,
        assignmentId,
        setAssignmentId,
        saveStatus,
        wordCount,
        publish,
        isPublishing,
        discard: discardFn,
      }}
    >
      {children}
    </WritingContext.Provider>
  )
}
