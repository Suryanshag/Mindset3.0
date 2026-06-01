import MobileSettingsNotifications from '@/components/mobile/settings-notifications'
import BProfileNotifs from '@/components/dashboard/desktop/b-profile-notifs'

export default function NotificationSettingsPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsNotifications />
      </div>
      <div className="hidden lg:block">
        <BProfileNotifs />
      </div>
    </>
  )
}
