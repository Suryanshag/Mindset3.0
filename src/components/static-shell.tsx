'use client'

import { forwardRef, memo } from 'react'

/**
 * Wraps a `dangerouslySetInnerHTML` div in `React.memo` so it only renders once.
 * Without this, every parent state change re-applies innerHTML, wiping out any
 * subsequent DOM mutations done via refs (card lists, detail views, click
 * handlers attached imperatively, etc.).
 */
const StaticShell = memo(
  forwardRef<HTMLDivElement, { html: string }>(function StaticShell({ html }, ref) {
    return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
  })
)

export default StaticShell
