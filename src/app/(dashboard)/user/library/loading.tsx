import Skeleton from '@/components/ui/skeleton'

// Section-level loading boundary. Keeps the dashboard shell (spine,
// main column chrome) painted while only the panel area shows the
// skeleton during a transition.

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}
