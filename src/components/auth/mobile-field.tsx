'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface MobileFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Visually-prominent uppercase label rendered inside the card. */
  label: string
  /** Leading icon (lucide). Coloured --primary by the wrapper. Optional. */
  icon?: ReactNode
  /** Trailing slot — used for "Show" toggles on password fields, etc. Optional. */
  trailing?: ReactNode
  /** When set, renders an error message below the field and tints the border. */
  fieldError?: string
}

// Handoff `<Field>` analogue used across the mobile auth chrome — card-
// shaped input with an inline icon + uppercase label. RHF-compatible:
// the ref + spread of input attrs makes `{...register('email')}` work.
//
// Visuals are mobile-only by design (callers render this inside `lg:hidden`
// containers). Existing desktop auth fields stay as-is.
const MobileField = forwardRef<HTMLInputElement, MobileFieldProps>(function MobileField(
  { label, icon, trailing, fieldError, className, id, ...inputProps },
  ref
) {
  const inputId = id ?? `mobile-field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block rounded-[18px] px-3.5 py-2.5"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)',
          border: fieldError ? '1.5px solid var(--accent)' : '1.5px solid transparent',
          transition: 'border-color 0.18s ease',
        }}
      >
        <span
          className="block text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <span className="flex items-center gap-2.5 mt-1">
          {icon && (
            <span aria-hidden="true" style={{ color: 'var(--primary)', display: 'inline-flex' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`flex-1 bg-transparent border-0 outline-none text-base min-w-0 py-1 ${className ?? ''}`}
            style={{ color: 'var(--text)', fontFamily: 'inherit' }}
            {...inputProps}
          />
          {trailing && <span style={{ display: 'inline-flex' }}>{trailing}</span>}
        </span>
      </label>
      {fieldError && (
        <p
          role="alert"
          className="mt-1.5 ml-1 text-xs font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {fieldError}
        </p>
      )}
    </div>
  )
})

export default MobileField
