/**
 * Placeholder data for dashboard sections that don't have a real backing model yet.
 * These will be replaced as each feature gets its own DB model / query.
 *
 * Sections with real data (NOT in this file):
 *   - user name/avatar       → auth session + prisma User
 *   - workshop banner        → getNextWorkshop()
 *   - notification count     → getUnreadNotificationCount()
 *   - profile completion     → computed from real User fields
 *
 * Placeholder sections (waiting on sprint 4):
 *   - todaysCheckIn   → needs MoodCheckIn model (sprint 4)
 *   - upcomingSession → needs Session booking wired to dashboard (sprint 4)
 *   - stats           → needs EngagementEvent model (sprint 4)
 *   - streak          → needs EngagementEvent model (sprint 4)
 */

import type { Session } from '@/types/dashboard'

/* ---------- types for placeholder-only fields ---------- */

export type PlaceholderStats = {
  sessionsCompleted: number
  mindfulHours: number
  streak: number
}

export type PlaceholderDashboard = {
  streak: number
  todaysCheckIn: { mood: 1 | 2 | 3 | 4 | 5 } | null
  upcomingSession: Session | null
  stats: PlaceholderStats
}

/* ---------- filled state ---------- */

export function getPlaceholderDashboard(): PlaceholderDashboard {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  return {
    streak: 7,
    todaysCheckIn: null,
    upcomingSession: {
      id: 'sess-1',
      doctorName: 'Dr. Meera Sharma',
      doctorSpecialty: 'Clinical psychologist',
      doctorAvatarUrl: null,
      date: tomorrow.toISOString(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
      status: 'CONFIRMED',
    },
    stats: {
      sessionsCompleted: 12,
      mindfulHours: 8,
      streak: 7,
    },
  }
}

/* ---------- empty state (for ?empty=1 toggle) ---------- */

export function getPlaceholderEmptyDashboard(): PlaceholderDashboard {
  return {
    streak: 0,
    todaysCheckIn: null,
    upcomingSession: null,
    stats: {
      sessionsCompleted: 0,
      mindfulHours: 0,
      streak: 0,
    },
  }
}
