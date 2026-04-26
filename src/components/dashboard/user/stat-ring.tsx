'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ClipboardList, Package } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  calendar: Calendar,
  'clipboard-list': ClipboardList,
  package: Package,
}

interface StatRingProps {
  value: number
  label: string
  color: string
  iconName: string
  maxValue?: number
}

export default function StatRing({ value, label, color, iconName, maxValue = 10 }: StatRingProps) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const ringRef = useRef<SVGCircleElement>(null)

  const Icon = ICON_MAP[iconName]

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const proportion = Math.min(value / Math.max(maxValue, 1), 1)
  const offset = circumference - proportion * circumference

  useEffect(() => {
    setMounted(true)
    if (value === 0) return
    const duration = 600
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
      style={{ boxShadow: '0 2px 12px rgba(30,68,92,0.06)' }}
    >
      {/* SVG Ring */}
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            opacity="0.1"
          />
          <circle
            ref={ringRef}
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {Icon && <Icon size={20} style={{ color }} />}
        </div>
      </div>

      <div>
        <p className="text-4xl font-bold" style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>
          {count}
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(30,68,92,0.5)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
