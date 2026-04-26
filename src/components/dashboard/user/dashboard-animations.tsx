'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function DashboardAnimations({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wrapperRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-animate="fade-up"]',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
      )
      gsap.fromTo(
        '[data-animate="scale-in"]',
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out', delay: 0.1 }
      )
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  return <div ref={wrapperRef}>{children}</div>
}
