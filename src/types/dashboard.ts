export type Session = {
  id: string
  doctorName: string
  doctorSpecialty: string
  doctorAvatarUrl: string | null
  date: string // ISO string
  meetLink: string | null
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
}

export type FocusItem = {
  id: string
  type: 'assignment' | 'ebook' | 'workshop'
  title: string
  meta: string // e.g. "Due tomorrow" or "Chapter 3 of 8"
  href: string
}

export type Workshop = {
  id: string
  title: string
  date: string // ISO string
  time: string // e.g. "4:00 PM"
  price: string // "Free" or "₹499"
  imageUrl: string | null
  isRegistered: boolean
  whatsappUrl: string | null
}

export type DashboardData = {
  user: { name: string; avatarInitials: string; avatarUrl: string | null }
  streak: number
  todaysCheckIn: { mood: 1 | 2 | 3 | 4 | 5 } | null
  upcomingSession: Session | null
  stats: {
    sessionsCompleted: number
    mindfulHours: number
    streak: number
  }
  todaysFocus: FocusItem | null
  workshop: Workshop | null
  profileCompletion: { done: number; total: number }
  unreadNotifications: number
}
