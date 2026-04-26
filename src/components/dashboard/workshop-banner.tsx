import Link from 'next/link'
import { Ticket } from 'lucide-react'
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
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ticket size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.6px',
            }}
          >
            New workshop
          </span>
          <p className="text-[15px] font-medium">{workshop.title}</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {dateStr} &middot; {workshop.time} &middot; {workshop.price}
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <Link
          href={`/workshops/${workshop.id}`}
          className="inline-block px-4 py-2 rounded-full bg-white text-accent text-[13px] font-medium"
        >
          Reserve spot
        </Link>
      </div>
    </div>
  )
}
