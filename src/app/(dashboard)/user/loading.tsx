import Skeleton from '@/components/ui/skeleton'

// Segment-level loading boundary for the /user dashboard. The home screen
// fans out ~13 parallel queries before first paint; without a tailored
// skeleton it falls back to the generic (dashboard)/loading.tsx, which
// doesn't match the home shell. This also covers the /user routes that
// lack their own loading.tsx (cart, notifications, payments, reflection).
export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-52" />
      </div>
      {/* Next-session / hero card */}
      <Skeleton className="h-36 w-full rounded-2xl" />
      {/* Week mood strip */}
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 flex-1 rounded-xl" />
        ))}
      </div>
      {/* Open items */}
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}
