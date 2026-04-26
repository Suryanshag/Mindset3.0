'use client'

import { ReactNode } from 'react'
import { useInView } from '@/hooks/use-intersection-observer'

export function FadeInSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, isInView } = useInView(0.15)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  )
}

export function SlideInSection({
  children,
  direction = 'left',
  className = '',
}: {
  children: ReactNode
  direction?: 'left' | 'right'
  className?: string
}) {
  const { ref, isInView } = useInView(0.15)
  const translateX = direction === 'left' ? '-24px' : '24px'
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateX(0)' : `translateX(${translateX})`,
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  )
}

export function StaggerChild({
  children,
  index,
  className = '',
}: {
  children: ReactNode
  index: number
  className?: string
}) {
  const { ref, isInView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.15}s, transform 0.5s ease ${index * 0.15}s`,
      }}
    >
      {children}
    </div>
  )
}
