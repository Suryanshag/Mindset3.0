'use client'

import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Users,
  ClipboardList,
} from 'lucide-react'
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav'

const ITEMS = [
  { href: '/doctor', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/doctor/sessions', label: 'Sessions', icon: ListChecks },
  { href: '/doctor/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/doctor/patients', label: 'Patients', icon: Users },
  { href: '/doctor/assignments', label: 'Work', icon: ClipboardList },
]

export default function DoctorBottomNavMobile() {
  return <MobileBottomNav items={ITEMS} />
}
