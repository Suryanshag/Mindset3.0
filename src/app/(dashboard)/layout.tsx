import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NavigationLoader from '@/components/navigation-loader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <>
      <NavigationLoader />
      {children}
    </>
  )
}
