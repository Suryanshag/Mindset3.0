'use client'

import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function WelcomeMessage({ fallbackName }: { fallbackName?: string | null }) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? fallbackName
  const greeting = getGreeting()

  return (
    <div className="mb-6">
      <p className="text-sm" style={{ color: 'rgba(30,68,92,0.45)' }}>
        Good <span style={{ color: 'var(--coral)' }}>{greeting}</span>,
      </p>
      <h1
        className="text-3xl font-bold mt-1"
        style={{
          color: 'var(--navy)',
          fontFamily: 'var(--wp--preset--font-family--labil-grotesk), var(--font-heading)',
        }}
      >
        {name}
      </h1>
      <p className="text-xs mt-1.5" style={{ color: 'rgba(30,68,92,0.35)' }}>
        {format(new Date(), 'EEEE, dd MMMM yyyy')}
      </p>
    </div>
  )
}
