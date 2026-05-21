'use client'

// Mindset mobile — UI primitives ported from app/ui.jsx (Phase 2).
//
// Card, Pill, Chip, Avatar, SectionHead, ImageSlot, MoodFace, MOOD_INFO,
// Blob, TypeChip. Inline styles preserved per Phase 1 precedent — the
// CSS variables drive theming.

import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { IconArrowRight } from './icons'

// ─── Card ─────────────────────────────────────────────────────────────
type CardProps = {
  children: ReactNode
  padding?: number
  radius?: number
  bg?: string
  style?: CSSProperties
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

export function Card({
  children,
  padding = 18,
  radius = 22,
  bg = 'var(--bg-card)',
  style,
  className,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bg,
        borderRadius: radius,
        padding,
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────
type PillProps = {
  children: ReactNode
  color?: string
  fg?: string
  icon?: ReactNode
  onClick?: () => void
  style?: CSSProperties
  type?: 'button' | 'submit'
  disabled?: boolean
  ariaLabel?: string
}

export function Pill({
  children,
  color = 'var(--primary)',
  fg = 'var(--on-dark)',
  icon,
  onClick,
  style,
  type = 'button',
  disabled,
  ariaLabel,
}: PillProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: color,
        color: fg,
        padding: '10px 16px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {children}
      {icon}
    </button>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────
type ChipProps = {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  color?: string
}

export function Chip({ children, active, onClick, color = 'var(--primary)' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 13px',
        borderRadius: 999,
        background: active ? color : 'transparent',
        color: active ? 'var(--on-dark)' : 'var(--text-muted)',
        border: active ? `1px solid ${color}` : '1px solid var(--border-strong)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────
// Initials on a colored swatch. Photo via `src` (opt-in).
type AvatarProps = {
  name?: string
  size?: number
  color?: string
  src?: string | null
  ring?: string
}

export function Avatar({
  name = '?',
  size = 40,
  color = 'var(--primary)',
  src,
  ring,
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: src ? '#000' : color,
        color: 'var(--on-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.42,
        letterSpacing: '0.02em',
        flexShrink: 0,
        boxShadow: ring ? `0 0 0 3px ${ring}` : 'none',
        overflow: 'hidden',
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </div>
  )
}

// ─── SectionHead ──────────────────────────────────────────────────────
// Kicker + title + optional inline "see all" action button.
type SectionHeadProps = {
  kicker?: string
  title: ReactNode
  action?: ReactNode
  onAction?: () => void
}

export function SectionHead({ kicker, title, action, onAction }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <div>
        {kicker && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {kicker}
          </div>
        )}
        <div
          className="ms-display"
          style={{
            fontSize: 26,
            color: 'var(--text)',
            marginTop: kicker ? 4 : 0,
          }}
        >
          {title}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {action} <IconArrowRight size={14} sw={2} />
        </button>
      )}
    </div>
  )
}

// ─── ImageSlot ────────────────────────────────────────────────────────
// Striped placeholder — used while real photography is being sourced.
type ImageSlotProps = {
  h?: number
  label?: string
  tint?: string
  tintDark?: string
  radius?: number
}

export function ImageSlot({
  h = 140,
  label = 'image',
  tint = 'var(--primary-tint)',
  tintDark = 'var(--primary)',
  radius = 16,
}: ImageSlotProps) {
  return (
    <div
      style={{
        height: h,
        borderRadius: radius,
        position: 'relative',
        overflow: 'hidden',
        background: `repeating-linear-gradient(135deg, ${tint} 0 8px, ${tintDark}22 8px 16px)`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: 'var(--text-muted)',
          padding: '4px 8px',
          margin: 8,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 6,
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── MoodFace ─────────────────────────────────────────────────────────
// 5-point mood scale, rendered as SVG arcs (1=frown, 5=happy).
type MoodValue = 1 | 2 | 3 | 4 | 5

type MoodFaceProps = {
  mood: MoodValue
  size?: number
  color?: string
}

export function MoodFace({ mood, size = 36, color = 'currentColor' }: MoodFaceProps) {
  const mouths: Record<MoodValue, string> = {
    1: 'M 8 18 Q 14 12 20 18',
    2: 'M 8 16 Q 14 14 20 16',
    3: 'M 8 16 L 20 16',
    4: 'M 8 14 Q 14 18 20 14',
    5: 'M 7 13 Q 14 22 21 13',
  }
  const eyes =
    mood === 5 ? (
      <>
        <path
          d="M 8 9 q 1.5 -2 3 0"
          stroke={color}
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M 17 9 q 1.5 -2 3 0"
          stroke={color}
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <circle cx="9.5" cy="10" r="1.1" fill={color} />
        <circle cx="18.5" cy="10" r="1.1" fill={color} />
      </>
    )
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="13" stroke={color} strokeWidth="1.6" />
      {eyes}
      <path
        d={mouths[mood]}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ─── MOOD_INFO ────────────────────────────────────────────────────────
// Color metadata per mood level. Index 0 is null so MOOD_INFO[mood]
// works with the 1..5 scale directly.
export type MoodInfo = {
  label: string
  color: string
  tint: string
}

export const MOOD_INFO: readonly (MoodInfo | null)[] = [
  null,
  { label: 'Low', color: '#8C5A8A', tint: 'var(--purple-tint)' },
  { label: 'Down', color: 'var(--navy)', tint: 'var(--soft-blue)' },
  { label: 'Okay', color: 'var(--text-muted)', tint: '#EAE4D4' },
  { label: 'Good', color: 'var(--primary)', tint: 'var(--primary-tint)' },
  { label: 'Bright', color: 'var(--accent)', tint: 'var(--accent-tint)' },
]

// ─── Blob ─────────────────────────────────────────────────────────────
// Soft organic shape used as a decorative background element.
type BlobProps = {
  d?: string
  fill?: string
  style?: CSSProperties
}

export function Blob({ d, fill = 'var(--accent)', style }: BlobProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      style={{ display: 'block', ...style }}
      aria-hidden="true"
    >
      <path
        d={
          d ||
          'M60 8 C90 8 112 30 112 60 C112 92 88 116 56 112 C28 108 8 88 8 60 C8 32 30 8 60 8 Z'
        }
        fill={fill}
      />
    </svg>
  )
}

// ─── TypeChip ─────────────────────────────────────────────────────────
// Workshop vs Circle badge — used on mixed lists like Home "Coming up".
type TypeChipProps = {
  kind?: 'workshop' | 'circle'
  size?: 'sm' | 'lg'
}

export function TypeChip({ kind = 'workshop', size = 'sm' }: TypeChipProps) {
  const cfg =
    kind === 'circle'
      ? {
          label: 'Circle',
          bg: 'var(--bg-cream)',
          fg: 'var(--accent-deep)',
          dot: 'var(--accent)',
          border: '1px solid rgba(45,90,79,0.10)',
        }
      : {
          label: 'Workshop',
          bg: 'var(--primary-tint)',
          fg: 'var(--primary)',
          dot: 'var(--primary)',
          border: 'none',
        }
  const pad = size === 'lg' ? '6px 12px' : '4px 9px'
  const fs = size === 'lg' ? 12 : 10.5
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: pad,
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.fg,
        fontSize: fs,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        border: cfg.border,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  )
}
