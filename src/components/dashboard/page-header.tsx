'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  back?: boolean | string
  rightAction?: ReactNode
}

export default function PageHeader({ title, subtitle, back, rightAction }: Props) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof back === 'string') {
      router.push(back)
    } else {
      router.back()
    }
  }

  const hasSubtitle = !!subtitle

  return (
    <div
      className="sticky top-0 z-30 bg-bg-app -mx-4 px-4 lg:mx-0 lg:px-0 grid items-center"
      style={{
        height: hasSubtitle ? '76px' : '56px',
        gridTemplateColumns: '56px 1fr 56px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left: back button or spacer — always 56px wide */}
      <div className="flex items-center justify-start">
        {back ? (
          typeof back === 'string' ? (
            <Link
              href={back}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 lg:hover:bg-white/60"
            >
              <ArrowLeft size={22} className="text-text" />
            </Link>
          ) : (
            <button
              onClick={handleBack}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 lg:hover:bg-white/60"
            >
              <ArrowLeft size={22} className="text-text" />
            </button>
          )
        ) : null}
      </div>

      {/* Center: title + optional subtitle */}
      <div className="min-w-0">
        <h1 className="text-[17px] font-medium text-text truncate">{title}</h1>
        {hasSubtitle && (
          <p className="text-[13px] text-text-muted truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: action slot or spacer — always 56px wide */}
      <div className="flex items-center justify-end">
        {rightAction ?? null}
      </div>
    </div>
  )
}
