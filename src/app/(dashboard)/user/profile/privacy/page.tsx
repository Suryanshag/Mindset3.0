import StubPage from '@/components/dashboard/stub-page'
import MobileSettingsPrivacy from '@/components/mobile/settings-privacy'

export default function PrivacyPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsPrivacy />
      </div>
      <div className="hidden lg:block">
        <StubPage title="Privacy & data" />
      </div>
    </>
  )
}
