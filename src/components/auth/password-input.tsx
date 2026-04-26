'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, error, ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={className}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'rgba(30,68,92,0.35)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(30,68,92,0.6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(30,68,92,0.35)' }}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
