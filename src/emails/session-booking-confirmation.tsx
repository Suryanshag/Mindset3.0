import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'
import { APP_BASE_URL, SUPPORT_EMAIL } from '@/lib/email-config'

interface SessionBookingConfirmationProps {
  userName: string
  doctorName: string
  sessionDate: Date
  durationMin: number
  meetLink: string | null
  sessionId: string
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

export default function SessionBookingConfirmationEmail({
  userName,
  doctorName,
  sessionDate,
  durationMin,
  sessionId,
}: SessionBookingConfirmationProps) {
  const dashboardUrl = `${APP_BASE_URL}/user/sessions/${sessionId}`
  const dateLong = formatSessionDateLong(sessionDate)

  return (
    <EmailLayout preview={`Your session with ${doctorName} is confirmed`}>
      <Text style={h1Style}>Your session is confirmed</Text>
      <Text style={subtitleStyle}>
        Hi {userName}, your session with <strong>{doctorName}</strong> is booked.
      </Text>

      <EmailInfoCard
        items={[
          { label: 'Doctor', value: doctorName },
          { label: 'When', value: dateLong },
          { label: 'Duration', value: `${durationMin} minutes` },
          { label: 'Format', value: 'Online · Google Meet' },
        ]}
      />

      <Text style={{ fontSize: '14px', color: '#334155', margin: '24px 0 12px', lineHeight: '1.6' }}>
        Your therapist will add a Google Meet link before your session.
        You&apos;ll see a Join button on your dashboard 15 minutes before the
        session starts.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <EmailButton href={dashboardUrl}>Open session details</EmailButton>
      </Section>

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={sectionLabelStyle}>Tips to prepare</Text>
      <Text style={tipStyle}>• Find a quiet, private space</Text>
      <Text style={tipStyle}>• Test your camera and mic beforehand</Text>
      <Text style={tipStyle}>
        • Have water and tissues nearby — sessions can bring up a lot
      </Text>

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={footerStyle}>
        Need to reschedule or cancel? Visit your session page above.
        Cancellations more than 24 hours before the session are fully refundable.
      </Text>

      <Text style={footerStyle}>
        Questions? Reply to this email or contact us at {SUPPORT_EMAIL}.
      </Text>
    </EmailLayout>
  )
}
