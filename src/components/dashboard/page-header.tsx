'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  back?: boolean | string
  rightAction?: ReactNode
}

export default function PageHeader({ title, back, rightAction }: Props) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof back === 'string') {
      router.push(back)
    } else {
      router.back()
    }
  }

  return (
    <div
      className="sticky top-0 z-30 bg-bg-app flex items-center h-14 -mx-4 px-4"
      style={{ borderBottom: '0.5px solid var(--color-border)' }}
    >
      {back && (
        typeof back === 'string' ? (
          <Link
            href={back}
            className="w-11 h-11 flex items-center justify-center shrink-0 -ml-1.5"
          >
            <ArrowLeft size={22} className="text-text" />
          </Link>
        ) : (
          <button
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center shrink-0 -ml-1.5"
          >
            <ArrowLeft size={22} className="text-text" />
          </button>
        )
      )}

      <h1 className="flex-1 min-w-0 text-[17px] font-medium text-text truncate">
        {title}
      </h1>

      {rightAction && (
        <div className="shrink-0 ml-2">
          {rightAction}
        </div>
      )}
    </div>
  )
}
