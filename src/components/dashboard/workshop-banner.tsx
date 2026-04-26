import Link from 'next/link'
import type { Workshop } from '@/types/dashboard'

type Props = {
  workshop: Workshop
}

export default function WorkshopBanner({ workshop }: Props) {
  const d = new Date(workshop.date)
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="rounded-2xl bg-accent p-4 text-white">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">
        New workshop
      </p>
      <p className="text-[15px] font-medium mt-1.5">{workshop.title}</p>
      <p className="text-[12px] text-white/70 mt-1">
        {dateStr} &middot; {workshop.time} &middot; {workshop.price}
      </p>
      <Link
        href={`/workshops/${workshop.id}`}
        className="inline-block mt-3 px-4 py-2 rounded-full bg-white text-accent text-[13px] font-medium"
      >
        Reserve spot
      </Link>
    </div>
  )
}
