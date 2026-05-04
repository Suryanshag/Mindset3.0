'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

export default function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  // No site key → render children unwrapped. Forms must handle the case where
  // executeRecaptcha is undefined (treat as bypass in dev).
  if (!siteKey) return <>{children}</>

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
