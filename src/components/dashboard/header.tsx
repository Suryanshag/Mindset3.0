import { Bell, Sprout } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import CartHeaderIcon from '@/components/dashboard/cart-header-icon'

type Props = {
  name: string
  avatarInitials: string
  avatarUrl: string | null
  streak: number
  unreadNotifications: number
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Hi'
}

export default function Header({
  name,
  avatarInitials,
  avatarUrl,
  streak,
  unreadNotifications,
}: Props) {
  const greeting = getGreeting()

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <Link href="/user/profile" className="shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={42}
            height={42}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-[42px] h-[42px] rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-medium text-white">{avatarInitials}</span>
          </div>
        )}
      </Link>

      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-muted">{greeting}</p>
        <p className="text-[16px] font-medium text-text truncate">{name}</p>
      </div>

      {/* Streak pill — only if >= 3 */}
      {streak >= 3 && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-tint shrink-0">
          <Sprout size={12} className="text-accent" />
          <span className="text-[11px] font-medium text-accent-deep">{streak}</span>
        </div>
      )}

      {/* Cart icon */}
      <CartHeaderIcon />

      {/* Notification bell */}
      <Link href="/user/notifications" className="relative shrink-0 p-1.5">
        <Bell size={20} className="text-text-muted" />
        {unreadNotifications > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </Link>
    </div>
  )
}
