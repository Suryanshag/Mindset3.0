'use client'

import { scorePassword, type PasswordScore } from '@/lib/validations/password-policy'

interface PasswordStrengthBarsProps {
  password: string
  /** When true, render the label line under the bars. Defaults to true. */
  showLabel?: boolean
}

// 4-bar variant per the handoff `app/auth-recovery.jsx` ResetPassword visual.
// Renders bars 1..score lit; bar color and label come from the same
// scorePassword() the single-bar PasswordStrength uses — and from the same
// passwordSchema the server validates against. No client-only heuristic.

const PALETTE: Record<PasswordScore['score'], string> = {
  0: '#EF4444', // red — too short
  1: '#EF4444', // red — weak
  2: '#F59E0B', // amber — fair
  3: '#F59E0B', // amber — good
  4: '#10B981', // green — strong
}

export default function PasswordStrengthBars({
  password,
  showLabel = true,
}: PasswordStrengthBarsProps) {
  if (!password) return null

  const { score, label } = scorePassword(password)
  const color = PALETTE[score]

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5 px-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-[2px]"
            style={{
              height: 4,
              background: i <= score ? color : 'var(--border-strong)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <p
          className="mt-1.5 px-1 text-[11px] font-bold"
          style={{ color }}
          role="status"
          aria-live="polite"
        >
          {label}
        </p>
      )}
    </div>
  )
}
