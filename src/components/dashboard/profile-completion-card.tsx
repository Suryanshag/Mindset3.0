import Link from 'next/link'
import { UserCircle } from 'lucide-react'

type Props = {
  done: number
  total: number
}

export default function ProfileCompletionCard({ done, total }: Props) {
  const pct = Math.round((done / total) * 100)

  return (
    <Link
      href="/user/profile"
      className="block bg-bg-card rounded-2xl p-4"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center shrink-0">
          <UserCircle size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-text">
            Complete your profile
          </p>
          <p className="text-[12px] text-text-muted mt-0.5">
            Unlock personalized recommendations
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-text-faint">
            {done} of {total} done
          </span>
          <span className="text-[11px] text-text-faint">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-app">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
