'use client'

import { useEffect, useState } from 'react'

interface StatChip {
  label: string
  value: number
  color: string
}

interface MobileHeaderProps {
  firstName: string
  initial: string
  greeting: string
  stats: StatChip[]
}

export default function MobileHeader({ firstName, initial, greeting, stats }: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="lg:hidden -mx-5 -mt-20">
      {/* Spacer for fixed top bar */}
      <div className="h-14" />

      {/* Greeting area */}
      <div
        className="px-5 pt-4 pb-5 transition-all duration-300"
        style={{ background: 'var(--cream)' }}
      >
        {!scrolled && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm" style={{ color: 'rgba(30,68,92,0.45)' }}>
                  Good {greeting},
                </p>
                <h1
                  className="text-2xl font-bold mt-0.5"
                  style={{
                    color: 'var(--navy)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {firstName}
                </h1>
              </div>
            </div>

            {/* Stat chips */}
            <div className="flex gap-2.5 mt-4 overflow-x-auto no-scrollbar pb-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white flex-shrink-0"
                  style={{ boxShadow: '0 1px 6px rgba(30,68,92,0.08)' }}
                >
                  <span className="font-bold text-sm" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(30,68,92,0.45)' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
