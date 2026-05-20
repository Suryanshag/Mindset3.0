'use client'

import { forwardRef, isValidElement, useState, type InputHTMLAttributes, type ReactNode, type FocusEvent, type ReactElement } from 'react'

interface MobileFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Visually-prominent uppercase label rendered inside the card. */
  label: string
  /** Leading icon (lucide). Coloured --primary by the wrapper. Optional. */
  icon?: ReactNode
  /**
   * Trailing slot — used for "Show" toggles on password fields, status
   * badges, etc.
   *
   * Interactive trailings (a <button>, a [role="button"] element, or any
   * element with an onClick handler) are auto-wrapped in a 44×44 minimum
   * flex container so WCAG 2.5.5 is satisfied without each caller having
   * to remember to size their button.
   *
   * Non-interactive trailings (icon, status badge, label) render as-is
   * with no minimum size — forcing a 44×44 box around a decorative icon
   * would distort the field layout.
   */
  trailing?: ReactNode
  /** When set, renders an error message below the field and tints the border. */
  fieldError?: string
}

// Detect whether a trailing element is interactive. Three signals:
//   1. element type is the intrinsic 'button'  (a JSX <button>)
//   2. element has an onClick prop             (a clickable wrapper)
//   3. element has role="button"               (a custom role)
// Returns false for plain icons, spans, status badges, etc.
function isInteractiveTrailing(node: ReactNode): boolean {
  if (!isValidElement(node)) return false
  const el = node as ReactElement<Record<string, unknown>>
  if (el.type === 'button') return true
  const props = el.props ?? {}
  if (typeof props.onClick === 'function') return true
  if (props.role === 'button') return true
  return false
}

// Handoff `<Field>` analogue used across the mobile auth chrome — card-
// shaped input with an inline icon + uppercase label. RHF-compatible:
// the ref + spread of input attrs makes `{...register('email')}` work.
//
// Visuals are mobile-only by design (callers render this inside `lg:hidden`
// containers). Existing desktop auth fields stay as-is.
const MobileField = forwardRef<HTMLInputElement, MobileFieldProps>(function MobileField(
  { label, icon, trailing, fieldError, className, id, onFocus, onBlur, ...inputProps },
  ref
) {
  const inputId = id ?? `mobile-field-${label.replace(/\s+/g, '-').toLowerCase()}`

  // Tracks whether the input has keyboard / mouse focus so the card can
  // render a visible focus ring (WCAG 2.4.7). Using state instead of
  // CSS :focus-within so the ring composes cleanly with the existing
  // box-shadow elevation in inline styles.
  const [focused, setFocused] = useState(false)

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    onFocus?.(e)
  }
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false)
    onBlur?.(e)
  }

  // Layered box-shadow keeps the card's drop-shadow while drawing a 2px
  // ring in --primary on focus. Error border overrides the ring color via
  // the explicit border, so focused-with-error renders a coral border +
  // primary ring — visually distinct without being chaotic.
  const baseShadow = 'var(--shadow-card)'
  const focusRing = '0 0 0 2px var(--primary)'

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block rounded-[18px] px-3.5 py-2.5"
        style={{
          background: 'var(--bg-card)',
          boxShadow: focused ? `${baseShadow}, ${focusRing}` : baseShadow,
          border: fieldError ? '1.5px solid var(--accent)' : '1.5px solid transparent',
          transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...inputProps}
          />
          {trailing && (
            <span
              style={
                isInteractiveTrailing(trailing)
                  ? {
                      // 44×44 hit-zone enforcement for interactive trailings
                      // (WCAG 2.5.5). The wrapper sets a floor; a child that
                      // already declares its own ≥44 dimensions composes
                      // naturally (the wrapper just provides the minimum
                      // tap surface). Negative margins on the child shift
                      // its visual position relative to the wrapper without
                      // breaking the hit zone.
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 44,
                      minHeight: 44,
                    }
                  : { display: 'inline-flex', alignItems: 'center' }
              }
            >
              {trailing}
            </span>
          )}
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
