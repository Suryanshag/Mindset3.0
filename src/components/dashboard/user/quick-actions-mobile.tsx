'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Calendar, Stethoscope, BookOpen, ShoppingBag } from 'lucide-react'
import gsap from 'gsap'

const ACTIONS = [
  {
    label: 'Book Session',
    href: '/doctors',
    icon: Calendar,
    bg: 'var(--teal)',
    bgLight: 'rgba(11,157,169,0.08)',
  },
  {
    label: 'Browse Doctors',
    href: '/doctors',
    icon: Stethoscope,
    bg: 'var(--coral)',
    bgLight: 'rgba(249,101,83,0.08)',
  },
  {
    label: 'Library',
    href: '/user/library',
    icon: BookOpen,
    bg: 'var(--amber)',
    bgLight: 'rgba(255,170,17,0.08)',
  },
  {
    label: 'Shop Products',
    href: '/products',
    icon: ShoppingBag,
    bg: '#a855f7',
    bgLight: 'rgba(168,85,247,0.08)',
  },
]

export default function QuickActionsMobile() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.qa-item',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
      )
    }, gridRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-3 mx-4">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="qa-item flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl active:scale-95 transition-transform duration-150"
          style={{ background: action.bgLight }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: action.bg, color: '#fff' }}
          >
            <action.icon size={20} />
          </div>
          <span
            className="text-sm font-semibold text-center"
            style={{ color: 'var(--navy)' }}
          >
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
