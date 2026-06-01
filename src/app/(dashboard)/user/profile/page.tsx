import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileProfileHub from '@/components/mobile/profile-hub'
import BProfile from '@/components/dashboard/desktop/b-profile'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [user, latestSession, sessionCount, entryCount, workshopCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true },
      }),
      prisma.session.findFirst({
        where: { userId },
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
      prisma.session.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.workshopRegistration.count({ where: { userId } }),
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
    <>
      <div className="lg:hidden">
        <MobileProfileHub
          user={{ name: user.name, email: user.email, image: user.image }}
          therapist={
            therapist
              ? {
                  name: therapist.name,
                  specialty: therapist.specialty,
                  photo: therapist.photo,
                  doctorId: therapist.doctorId,
                }
              : null
          }
        />
      </div>

      <div className="hidden lg:block">
        <BProfile
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            initials,
          }}
          therapist={therapist}
          stats={{
            sessions: sessionCount,
            entries: entryCount,
            workshops: workshopCount,
          }}
        />
      </div>
    </>
  )
}
