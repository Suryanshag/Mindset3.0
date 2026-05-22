// Phase 6 — Account deletion (mobile-only screen). Desktop redirects
// users back to /user/profile/privacy where the same "Delete my account"
// action is reachable; the 4-step flow is built for the phone-sized
// pattern in the design and we don't ship a desktop equivalent.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import MobileAccountDelete from '@/components/mobile/account-delete'

export default async function AccountDeletePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <>
      <div className="lg:hidden">
        <MobileAccountDelete />
      </div>
      <div className="hidden lg:block px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-text mb-3">
          Delete your account
        </h1>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          For now, account deletion is available on the mobile site. Please
          open Mindset on your phone or in a phone-sized window to continue.
        </p>
      </div>
    </>
  )
}
