import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'
import { APP_BASE_URL, SUPPORT_EMAIL } from '@/lib/email-config'

interface WorkshopRegistrationConfirmationProps {
  userName: string
  workshopTitle: string
  startsAt: Date
  durationMin: number
  presenterName: string
  /** 0 = free workshop; the "Amount paid" row is hidden in that case. */
  amount: number
  workshopId: string
}

const h1Style = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const subtitleStyle = {
  fontSize: '16px',
  color: '#475569',
  margin: '0 0 24px',
  lineHeight: '1.6',
}

const sectionLabelStyle = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  color: '#64748b',
  margin: '0 0 12px',
}

const tipStyle = {
  fontSize: '14px',
  color: '#334155',
  margin: '0 0 6px',
  lineHeight: '1.6',
}

const footerStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  margin: '24px 0 0',
  lineHeight: '1.6',
}

export default function WorkshopRegistrationConfirmationEmail({
  userName,
  workshopTitle,
  startsAt,
  durationMin,
  presenterName,
  amount,
  workshopId,
}: WorkshopRegistrationConfirmationProps) {
  const dashboardUrl = `${APP_BASE_URL}/user/discover/workshops/${workshopId}`
  const dateLong = formatSessionDateLong(startsAt)
  const isPaid = amount > 0

  // Info card items — drop the "Amount paid" line entirely for free
  // workshops so the user doesn't see a confusing "₹0" row.
  const infoItems: Array<{ label: string; value: string }> = [
    { label: 'Workshop', value: workshopTitle },
    { label: 'When', value: dateLong },
    { label: 'Duration', value: `${durationMin} minutes` },
    { label: 'With', value: presenterName },
    { label: 'Format', value: 'Online · Google Meet' },
  ]
  if (isPaid) {
    infoItems.push({
      label: 'Amount paid',
      value: `₹${amount.toLocaleString('en-IN')}`,
    })
  }

  return (
    <EmailLayout preview={`You're registered for "${workshopTitle}"`}>
      <Text style={h1Style}>You&apos;re registered</Text>
      <Text style={subtitleStyle}>
        Hi {userName}, your spot in <strong>{workshopTitle}</strong> is
        confirmed.
      </Text>

      <EmailInfoCard items={infoItems} />

      <Text style={{ fontSize: '14px', color: '#334155', margin: '24px 0 12px', lineHeight: '1.6' }}>
        Your meeting link will be emailed before the workshop starts. You
        can also view it on your dashboard at the link below.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <EmailButton href={dashboardUrl}>View workshop details</EmailButton>
      </Section>

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={sectionLabelStyle}>Tips to get the most out of it</Text>
      <Text style={tipStyle}>• Find a quiet, private space</Text>
      <Text style={tipStyle}>• Test your camera and mic beforehand</Text>
      <Text style={tipStyle}>
        • Bring a notebook — workshops often include reflection prompts
      </Text>

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={footerStyle}>
        Looking forward to having you in the session.
      </Text>

      <Text style={footerStyle}>
        Questions? Reply to this email or contact us at {SUPPORT_EMAIL}.
      </Text>
    </EmailLayout>
  )
}
