// Mindset mobile — line-icon library ported from app/icons.jsx.
// Stroked 1.7px, currentColor, viewBox 0 0 24 24.
//
// Source: Phase 2 design zip (/tmp/mindset-design/app/icons.jsx). The
// design uses `Object.assign(window, …)` for vanilla JS demo; this
// file replaces that with proper ES module named exports.
//
// IconPhone is NEW — referenced by sos.jsx but missing from the design's
// icons.jsx. Added here so the SOS triage UI builds cleanly.

import type { CSSProperties, ReactNode } from 'react'

type IconProps = {
  size?: number
  sw?: number
  fill?: string
  viewBox?: string
  style?: CSSProperties
  className?: string
  children?: ReactNode
  /** When set, the SVG renders the given `d`. When omitted, children render
   *  inside the SVG (used by callers that need multiple paths/shapes). */
  d?: string
}

export function Icon({
  d,
  size = 22,
  sw = 1.7,
  fill = 'none',
  viewBox = '0 0 24 24',
  style,
  className,
  children,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
    >
      {d ? <path d={d} /> : children}
    </svg>
  )
}

type LeafIconProps = Omit<IconProps, 'd' | 'children' | 'viewBox' | 'fill'>

export const IconHome = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M3.5 11.5 12 4l8.5 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
    <path d="M10 20v-5h4v5" />
  </Icon>
)

export const IconSpark = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M5.6 5.6l2.1 2.1" />
    <path d="M16.3 16.3l2.1 2.1" />
    <path d="M5.6 18.4l2.1-2.1" />
    <path d="M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const IconBook = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5a1.5 1.5 0 0 0-1.5 1.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  </Icon>
)

export const IconCalendar = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3.5v3" />
    <path d="M16 3.5v3" />
  </Icon>
)

export const IconUser = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.4-3.8 4.4-5.5 7.5-5.5s6.1 1.7 7.5 5.5" />
  </Icon>
)

export const IconArrowRight = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Icon>
)

export const IconArrowLeft = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M19 12H5" />
    <path d="M11 18l-6-6 6-6" />
  </Icon>
)

export const IconChevR = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
)

export const IconPlus = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
)

export const IconCheck = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
)

export const IconBell = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
)

export const IconSearch = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Icon>
)

export const IconVideo = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="3" y="6.5" width="13" height="11" rx="2" />
    <path d="M16 10l5-2.5v9L16 14" />
  </Icon>
)

export const IconPlay = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M7 5l12 7-12 7z" fill="currentColor" />
  </Icon>
)

export const IconShop = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8a3 3 0 1 1 6 0" />
  </Icon>
)

export const IconLeaf = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M20 4c-9 0-15 5-15 12 0 2 1 3.5 2.5 4.5C8 14 13 9 19 8c-6 3-10 8-11 13" />
  </Icon>
)

export const IconPen = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M4 20l3.5-1 11-11-2.5-2.5-11 11z" />
    <path d="M14.5 7.5l2.5 2.5" />
  </Icon>
)

export const IconHeart = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </Icon>
)

export const IconMic = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="9.5" y="3" width="5" height="11" rx="2.5" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Icon>
)

export const IconCloseSmall = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6l-6 6" />
  </Icon>
)

export const IconMore = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="1.4" fill="currentColor" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    <circle cx="18" cy="12" r="1.4" fill="currentColor" />
  </Icon>
)

export const IconCompass = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-1.5 4.5L9 15l1.5-4.5z" />
  </Icon>
)

export const IconWind = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M4 10h11a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M4 14h15a2.5 2.5 0 1 1-2.5 2.5" />
  </Icon>
)

export const IconFlame = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-2-1-3-1-5 0 0 1.5 1 1.5 3.5a5.5 5.5 0 1 1-11 0c0-4 6-4 6-6.5z" />
  </Icon>
)

export const IconLock = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
)

export const IconUsers = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3 19c1-3 3.4-4.5 6-4.5s5 1.5 6 4.5" />
    <circle cx="17" cy="7.5" r="2.6" />
    <path d="M16 14c2.5 0 4.5 1.2 5.5 4" />
  </Icon>
)

export const IconClock = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)

export const IconShield = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z" />
  </Icon>
)

export const IconStar = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 19l.9-5.4-3.9-3.8 5.4-.8z" />
  </Icon>
)

export const IconClipboard = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="6" y="4.5" width="12" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="3" rx="1" />
    <path d="M9 11h6M9 14h4" />
  </Icon>
)

export const IconTruck = (p: LeafIconProps) => (
  <Icon {...p}>
    <rect x="2" y="7" width="11" height="10" rx="1" />
    <path d="M13 10h4l3 3v4h-7z" />
    <circle cx="6.5" cy="18" r="1.5" />
    <circle cx="16.5" cy="18" r="1.5" />
  </Icon>
)

export const IconMapPin = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </Icon>
)

export const IconPackage = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Icon>
)

export const IconWhats = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M3.5 20.5l1.4-4.4a8 8 0 1 1 3 3z" />
    <path d="M9 10c.5 2 1.5 3.5 3.5 4.5l1-1 2.5 1.2c-.4 1-1.4 2-3 2-2.6 0-5.3-2.5-5.3-5.3 0-1.6 1-2.5 2-3l1.3 1.6z" />
  </Icon>
)

export const IconMinus = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)

export const IconDot = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </Icon>
)

export const IconCart = (p: LeafIconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l2.7 13a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 7H6" />
  </Icon>
)

// NEW: design's sos.jsx references IconPhone but icons.jsx didn't export
// one. Standard outlined-phone glyph; same stroke + rounded caps as the
// rest of the family.
export const IconPhone = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icon>
)

// Phase 6 — settings screens.
export const IconChat = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </Icon>
)

export const IconDownload = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </Icon>
)

export const IconMail = (p: LeafIconProps) => (
  <Icon {...p}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="m22 6-10 7L2 6" />
  </Icon>
)
