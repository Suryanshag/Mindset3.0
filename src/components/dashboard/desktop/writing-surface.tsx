'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWriting } from './writing-context'

export default function WritingSurface() {
  const { title, setTitle, body, setBody } = useWriting()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 300)}px`
  }, [])

  useEffect(() => {
    autoGrow()
  }, [body, autoGrow])

  return (
    <div className="max-w-[680px] mx-auto pt-16 pb-32">
      {/* Date */}
      <p className="text-[13px] text-text-muted mb-6">{todayStr}</p>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full text-[22px] font-medium text-text bg-transparent border-none outline-none placeholder:text-text-faint"
      />

      {/* Divider */}
      <div className="h-px my-4" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Body */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          autoGrow()
        }}
        placeholder="What's on your mind?"
        className="w-full text-[18px] font-serif text-text bg-transparent border-none outline-none resize-none placeholder:text-text-faint placeholder:italic"
        style={{ lineHeight: '1.8', minHeight: '300px' }}
      />
    </div>
  )
}
