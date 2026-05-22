import StubPage from '@/components/dashboard/stub-page'
import MobileSettingsNotifications from '@/components/mobile/settings-notifications'

export default function NotificationSettingsPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsNotifications />
      </div>
      <div className="hidden lg:block">
        <StubPage title="Notifications" />
      </div>
    </>
  )
}
