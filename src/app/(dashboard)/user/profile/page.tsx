import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  UserCircle,
  MapPin,
  CreditCard,
  HelpCircle,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import AvatarUpload from '@/components/dashboard/avatar-upload'
import SignOutButton from '@/components/dashboard/sign-out-button'
import PageHeader from '@/components/dashboard/page-header'

const settingsItems = [
  { label: 'Personal info', href: '/user/profile/personal', Icon: UserCircle },
  { label: 'Addresses', href: '/user/profile/addresses', Icon: MapPin },
  { label: 'Payments', href: '/user/profile/payments', Icon: CreditCard },
  { label: 'Help & support', href: '/user/profile/help', Icon: HelpCircle },
  { label: 'About', href: '/user/profile/about', Icon: Info },
  { label: 'Visit website', href: '/', Icon: ExternalLink },
]

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Fetch user + most recent session's doctor as "your therapist"
  const [user, latestSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.session.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      select: {
        doctorId: true,
        doctor: {
          select: {
            designation: true,
            photo: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const therapist = latestSession
    ? {
        name: latestSession.doctor.user.name,
        specialty: latestSession.doctor.designation,
        initials: latestSession.doctor.user.name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        photo: latestSession.doctor.photo,
        doctorId: latestSession.doctorId,
      }
    : null

  return (
    <div>
      <PageHeader title="Profile" subtitle="Account and settings" />

      <div className="space-y-5 pt-3.5">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-2">
        <AvatarUpload
          currentUrl={user.image}
          initials={initials}
          size={96}
        />
        <p className="text-[16px] font-medium text-text mt-3">{user.name}</p>
        <p className="text-[13px] text-text-muted">{user.email}</p>
      </div>

      {/* Your therapist */}
      {therapist && (
        <div
          className="bg-bg-card rounded-2xl p-3.5"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Your therapist
          </p>
          <div className="flex items-center gap-3">
            {therapist.photo ? (
              <img
                src={therapist.photo}
                alt={therapist.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-white">
                  {therapist.initials}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-text">
                {therapist.name}
              </p>
              <p className="text-[12px] text-text-faint">
                {therapist.specialty}
              </p>
            </div>
            <Link
              href={`/user/sessions/book${therapist.doctorId ? `?doctorId=${therapist.doctorId}` : ''}`}
              className="px-3 py-1.5 rounded-full bg-primary text-white text-[12px] font-medium shrink-0"
            >
              Book session
            </Link>
          </div>
        </div>
      )}

      {/* Settings list */}
      <div
        className="bg-bg-card rounded-2xl overflow-hidden"
        style={{ border: '0.5px solid var(--color-border)' }}
      >
        {settingsItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5"
            style={
              i < settingsItems.length - 1
                ? { borderBottom: '0.5px solid var(--color-border)' }
                : undefined
            }
          >
            <item.Icon size={18} className="text-text-muted shrink-0" />
            <span className="flex-1 text-[14px] text-text">{item.label}</span>
            <ChevronRight size={16} className="text-text-faint" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <SignOutButton />
      </div>
    </div>
  )
}
