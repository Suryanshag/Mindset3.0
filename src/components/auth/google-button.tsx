'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface GoogleButtonProps {
  callbackUrl?: string
  label?: string
}

export default function GoogleButton({
  callbackUrl = '/user',
  label = 'Continue with Google',
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    signIn('google', { callbackUrl })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
      style={{
        background: '#fff',
        color: 'var(--navy)',
        border: '1px solid rgba(30,68,92,0.14)',
      }}
      onMouseEnter={(e) => {
        if (loading) return
        e.currentTarget.style.borderColor = 'rgba(30,68,92,0.28)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,68,92,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(30,68,92,0.14)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      aria-label={label}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <Image
          src="/images/auth/google-logo.svg"
          alt=""
          width={18}
          height={18}
          aria-hidden="true"
        />
      )}
      <span>{loading ? 'Redirecting…' : label}</span>
    </button>
  )
}
