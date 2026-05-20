'use client'

import { scorePassword, type PasswordScore } from '@/lib/validations/password-policy'

interface PasswordStrengthProps {
  password: string
}

// Single-bar variant used by the desktop / existing auth surfaces. The
// 4-bar mobile variant lives in password-strength-bars.tsx. Both consume
// the same scorePassword() function so client visuals never disagree with
// the server's Zod policy.

const PALETTE: Record<PasswordScore['score'], { color: string; width: string; copy: string }> = {
  0: { color: '#EF4444', width: '20%', copy: 'Too short — use at least 10 characters' },
  1: { color: '#EF4444', width: '40%', copy: 'Weak — mix in 3 of: A-Z, a-z, 0-9, symbol' },
  2: { color: '#F59E0B', width: '65%', copy: 'Fair — good, longer is stronger' },
  3: { color: '#F59E0B', width: '85%', copy: 'Good — almost there' },
  4: { color: '#10B981', width: '100%', copy: 'Strong password' },
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const { score } = scorePassword(password)
  const swatch = PALETTE[score]

  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: swatch.width, background: swatch.color }}
        />
      </div>
      <p className="text-xs mt-1 font-medium" style={{ color: swatch.color }}>
        {swatch.copy}
      </p>
    </div>
  )
}
