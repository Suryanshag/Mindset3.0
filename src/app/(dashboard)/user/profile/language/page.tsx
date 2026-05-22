import StubPage from '@/components/dashboard/stub-page'
import MobileSettingsLanguage from '@/components/mobile/settings-language'

export default function LanguagePage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSettingsLanguage />
      </div>
      <div className="hidden lg:block">
        <StubPage title="Language" />
      </div>
    </>
  )
}
