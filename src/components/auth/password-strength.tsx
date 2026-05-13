'use client'

interface PasswordStrengthProps {
  password: string
}

// Mirrors the server-side policy in src/lib/validations/auth.ts:
// min 10 chars + 3-of-4 character classes.
export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const lengthScore =
    password.length >= 14 ? 2 : password.length >= 10 ? 1 : 0

  const classScore = [
    /[A-Z]/,
    /[a-z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/,
  ].filter((re) => re.test(password)).length

  const meetsPolicy = password.length >= 10 && classScore >= 3

  let label: 'too short' | 'weak' | 'medium' | 'strong'
  if (!meetsPolicy) {
    label = password.length < 10 ? 'too short' : 'weak'
  } else if (lengthScore >= 2 && classScore === 4) {
    label = 'strong'
  } else {
    label = 'medium'
  }

  const palette: Record<typeof label, { color: string; width: string; copy: string }> = {
    'too short': { color: '#EF4444', width: '20%', copy: 'Too short — use at least 10 characters' },
    weak: { color: '#EF4444', width: '40%', copy: 'Weak — mix in 3 of: A-Z, a-z, 0-9, symbol' },
    medium: { color: '#F59E0B', width: '70%', copy: 'Medium — good, longer is stronger' },
    strong: { color: '#10B981', width: '100%', copy: 'Strong password' },
  }
  const swatch = palette[label]

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
