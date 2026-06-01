import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import MobileAccountDelete from '@/components/mobile/account-delete'
import BProfileDelete from '@/components/dashboard/desktop/b-profile-delete'

export default async function AccountDeletePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <>
      <div className="lg:hidden">
        <MobileAccountDelete />
      </div>
      <div className="hidden lg:block">
        <BProfileDelete />
      </div>
    </>
  )
}
