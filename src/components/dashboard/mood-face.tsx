/**
 * SVG line-drawn mood faces. Five expressions, same eye position,
 * only the mouth path varies. Stroke-based, picks up text color.
 */

const MOUTH_PATHS: Record<number, string> = {
  1: 'M 6 14 Q 10 11 14 14',       // Low — downward curve (sad)
  2: 'M 6 13 L 14 13',             // Meh — straight line
  3: 'M 6 12.5 Q 10 15 14 12.5',   // Good — gentle smile
  4: 'M 5.5 11.5 Q 10 16 14.5 11.5', // Great — wider smile
  5: 'M 5.5 11.5 Q 10 16 14.5 11.5', // Amazing — same mouth, closed eyes
}

export default function MoodFace({
  mood,
  size = 16,
}: {
  mood: 1 | 2 | 3 | 4 | 5
  size?: number
}) {
  const isAmazing = mood === 5

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Eyes */}
      {isAmazing ? (
        <>
          {/* Closed happy eyes — small arcs */}
          <path d="M 5.5 8 Q 7 6.5 8.5 8" />
          <path d="M 11.5 8 Q 13 6.5 14.5 8" />
        </>
      ) : (
        <>
          <circle cx={7} cy={8} r={1} fill="currentColor" stroke="none" />
          <circle cx={13} cy={8} r={1} fill="currentColor" stroke="none" />
        </>
      )}

      {/* Mouth */}
      <path d={MOUTH_PATHS[mood]} fill="none" />
    </svg>
  )
}
