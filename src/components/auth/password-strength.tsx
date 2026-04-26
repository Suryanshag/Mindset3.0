'use client'

interface PasswordStrengthProps {
  password: string
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[@$!%*?&]/.test(password),
  ]

  const passed = checks.filter(Boolean).length
  const strength = passed <= 2 ? 'weak' : passed <= 4 ? 'medium' : 'strong'
  const colors = { weak: '#EF4444', medium: '#F59E0B', strong: '#10B981' }
  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }
  const widths = { weak: '33%', medium: '66%', strong: '100%' }

  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: widths[strength], background: colors[strength] }}
        />
      </div>
      <p className="text-xs mt-1 font-medium" style={{ color: colors[strength] }}>
        {labels[strength]} password
      </p>
    </div>
  )
}
