'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export default function RailPortal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Skip if inside a hidden container (e.g. the mobile shell on desktop viewport)
    if (!ref.current || ref.current.offsetParent === null) return
    setTarget(document.getElementById('desktop-rail-content'))
  }, [])

  return (
    <>
      <span ref={ref} aria-hidden style={{ position: 'absolute', width: 0, height: 0 }} />
      {target ? createPortal(children, target) : null}
    </>
  )
}
