'use client'

type Props = {
  message?: string
}

/**
 * Full-screen branded loader used on the auth pages while a sign-in or
 * sign-up round-trip is in flight. Geometry + animation timings come
 * straight from the user-provided reference; only the colors and the
 * styling mechanism (Tailwind + CSS variables instead of styled-
 * components) differ. Two layers of identical 4-rect groups, the
 * second masked by a corner-to-corner gradient so the coral overlay
 * sweeps across the teal base as the whole composition rotates.
 *
 * Keyframes (`pl1-a/b/c`) live in src/app/globals.css under the
 * "Mindset auth loader" header.
 */
export function MindsetLoader({ message = 'Loading…' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-app/95 backdrop-blur-sm">
      <div className="font-serif text-[32px] text-text mb-8 leading-none">Mindset</div>

      <svg
        height="128px"
        width="128px"
        viewBox="0 0 128 128"
        className="pl1"
        role="status"
        aria-label={message}
      >
        <defs>
          <linearGradient id="pl-grad" x1={0} y1={0} x2={1} y2={1}>
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <mask id="pl-mask">
            <rect x={0} y={0} width={128} height={128} fill="url(#pl-grad)" />
          </mask>
        </defs>

        {/* Base layer — Mindset teal */}
        <g fill="var(--color-primary)">
          <g className="pl1__g">
            <g transform="translate(20,20) rotate(0,44,44)">
              <g className="pl1__rect-g">
                <rect className="pl1__rect" rx={8} ry={8} width={40} height={40} />
                <rect className="pl1__rect" transform="translate(0,48)" rx={8} ry={8} width={40} height={40} />
              </g>
              <g className="pl1__rect-g" transform="rotate(180,44,44)">
                <rect className="pl1__rect" rx={8} ry={8} width={40} height={40} />
                <rect className="pl1__rect" transform="translate(0,48)" rx={8} ry={8} width={40} height={40} />
              </g>
            </g>
          </g>
        </g>

        {/* Masked overlay — Mindset coral, sweeps over the teal */}
        <g fill="var(--color-accent)" mask="url(#pl-mask)">
          <g className="pl1__g">
            <g transform="translate(20,20) rotate(0,44,44)">
              <g className="pl1__rect-g">
                <rect className="pl1__rect" rx={8} ry={8} width={40} height={40} />
                <rect className="pl1__rect" transform="translate(0,48)" rx={8} ry={8} width={40} height={40} />
              </g>
              <g className="pl1__rect-g" transform="rotate(180,44,44)">
                <rect className="pl1__rect" rx={8} ry={8} width={40} height={40} />
                <rect className="pl1__rect" transform="translate(0,48)" rx={8} ry={8} width={40} height={40} />
              </g>
            </g>
          </g>
        </g>
      </svg>

      <div className="mt-4 text-sm text-text-muted">{message}</div>
    </div>
  )
}
