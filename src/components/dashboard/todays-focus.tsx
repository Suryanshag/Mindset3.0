import Link from 'next/link'
import { ClipboardList, BookOpen, Users, ChevronRight } from 'lucide-react'
import type { FocusItem } from '@/types/dashboard'

type Props = {
  item: FocusItem
}

const iconMap = {
  assignment: ClipboardList,
  ebook: BookOpen,
  workshop: Users,
}

export default function TodaysFocus({ item }: Props) {
  const Icon = iconMap[item.type]

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 bg-bg-card rounded-2xl p-3.5"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div className="w-10 h-10 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
        <Icon size={18} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text truncate">
          {item.title}
        </p>
        <p className="text-[12px] text-text-faint mt-0.5">{item.meta}</p>
      </div>
      <ChevronRight size={16} className="text-text-faint shrink-0" />
    </Link>
  )
}
